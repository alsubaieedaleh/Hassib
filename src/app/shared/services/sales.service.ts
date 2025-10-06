import { Injectable, inject } from '@angular/core';

import { Line, Payment } from '../models/line.model';
import { SupabaseService } from './supabase.service';

export interface SalesOrderLineDto {
  inventoryItemId: number;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrderDto {
  orderNumber: string;
  status?: string;
  customerName: string;
  orderDate: string | Date;
  lines: SalesOrderLineDto[];
}

interface SaleReceiptInput {
  lines: Line[];
  payment: Payment;
  customerPhone: string;
}

interface RecordedOrder {
  id: number;
  reference: string;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly supabase = inject(SupabaseService);
  private readonly orderTable = 'sales_orders';
  private readonly lineTable = 'sales_lines';

  async createSalesOrder(order: SalesOrderDto): Promise<{ id: number; orderNumber: string }> {
    if (!order.lines.length) {
      throw new Error('Sales order must contain at least one line.');
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const userId = await this.supabase.requireAuthenticatedUserId();

    const orderDate = order.orderDate instanceof Date ? order.orderDate.toISOString() : order.orderDate;

    const { data: createdOrder, error: orderError } = await client
      .from(this.orderTable)
      .insert({
        order_number: order.orderNumber,
        status: order.status ?? 'PENDING',
        customer_name: order.customerName,
        order_date: orderDate,
        user_id: userId,
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      throw orderError;
    }

    const orderId = createdOrder?.id;
    if (!orderId) {
      throw new Error('Failed to create sales order.');
    }

    try {
      const linePayload = order.lines.map(line => ({
        sale_id: orderId,
        inventory_item_id: line.inventoryItemId,
        quantity: line.quantity,
        unit_price: line.unitPrice,
      }));

      const { error: lineError } = await client.from(this.lineTable).insert(linePayload);
      if (lineError) {
        throw lineError;
      }

      const inventoryIds = Array.from(new Set(order.lines.map(line => line.inventoryItemId)));
      const { data: inventoryRows, error: inventoryError } = await client
        .from('inventory_items')
        .select('id, quantity, location_id')
        .eq('user_id', userId)
        .in('id', inventoryIds);

      if (inventoryError) {
        throw inventoryError;
      }

      const inventoryMap = new Map<number, { quantity: number; location_id: number | null }>();
      for (const row of inventoryRows ?? []) {
        inventoryMap.set(row.id, {
          quantity: Number(row.quantity) || 0,
          location_id: row.location_id ?? null,
        });
      }

      const movementPayload: { inventory_item_id: number; change_qty: number; movement_type: 'OUT'; location_id: number | null }[] = [];

      for (const line of order.lines) {
        const inventory = inventoryMap.get(line.inventoryItemId);
        if (!inventory) {
          throw new Error(`Inventory item ${line.inventoryItemId} does not belong to the current user.`);
        }

        if (inventory.quantity < line.quantity) {
          throw new Error(`Insufficient quantity for inventory item ${line.inventoryItemId}.`);
        }

        inventory.quantity -= line.quantity;
        movementPayload.push({
          inventory_item_id: line.inventoryItemId,
          movement_type: 'OUT',
          change_qty: line.quantity,
          location_id: inventory.location_id ?? null,
        });
      }

      for (const [id, info] of inventoryMap.entries()) {
        const { error: updateError } = await client
          .from('inventory_items')
          .update({ quantity: info.quantity })
          .eq('id', id)
          .eq('user_id', userId);

        if (updateError) {
          throw updateError;
        }
      }

      if (movementPayload.length) {
        const { error: movementError } = await client
          .from('inventory_movements')
          .insert(movementPayload.map(movement => ({ ...movement, user_id: userId })));

        if (movementError) {
          throw movementError;
        }
      }

      return { id: orderId, orderNumber: createdOrder.order_number ?? order.orderNumber };
    } catch (error) {
      await client.from(this.lineTable).delete().eq('sale_id', orderId);
      await client.from(this.orderTable).delete().eq('id', orderId).eq('user_id', userId);
      throw error;
    }
  }

  async recordReceipt(receipt: SaleReceiptInput): Promise<RecordedOrder | null> {
    if (!receipt.lines.length) {
      return null;
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const userId = await this.supabase.requireAuthenticatedUserId();
    const totals = this.calculateTotals(receipt.lines);
    const reference = this.generateReference();

    const { data: orderRow, error: orderError } = await client
      .from(this.orderTable)
      .insert({
        reference,
        customer_name: receipt.customerPhone || 'Walk-in customer',
        customer_phone: receipt.customerPhone || null,
        payment_method: receipt.payment,
        subtotal: totals.subtotal,
        vat_amount: totals.vat,
        total: totals.total,
        user_id: userId,
      })
      .select('id, reference')
      .single();

    if (orderError) {
      throw orderError;
    }

    const orderId = orderRow?.id ?? null;
    const saleReference = orderRow?.reference ?? reference;

    try {
      const linePayload = receipt.lines.map(line => ({
        sale_id: orderId,
        inventory_item_id: line.inventoryItemId ?? null,
        barcode: line.barcode || null,
        name: line.name,
        qty: line.qty,
        price: line.price,
        cost: line.cost,
        gross_total: line.grossTotal,
        vat_amount: line.vatAmount,
        profit: line.profit,
        payment: line.payment,
        phone: line.phone || null,
        user_id: userId,
      }));

      const { error: lineError } = await client.from(this.lineTable).insert(linePayload);
      if (lineError) {
        throw lineError;
      }
    } catch (error) {
      if (orderId) {
        await client.from(this.orderTable).delete().eq('id', orderId).eq('user_id', userId);
      }
      throw error;
    }

    return orderId ? { id: orderId, reference: saleReference } : null;
  }

  private calculateTotals(lines: Line[]) {
    const total = lines.reduce((sum, line) => sum + line.grossTotal, 0);
    const vat = lines.reduce((sum, line) => sum + line.vatAmount, 0);
    const subtotal = total - vat;

    return {
      subtotal: this.round(subtotal),
      vat: this.round(vat),
      total: this.round(total),
    };
  }

  private generateReference(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}`;
    const randomPart = Math.random().toString(36).slice(-4).toUpperCase();
    return `SO-${datePart}-${randomPart}`;
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
