import { Injectable, inject } from '@angular/core';

import { Line, Payment } from '../models/line.model';
import { SupabaseService } from './supabase.service';

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

  async recordReceipt(receipt: SaleReceiptInput): Promise<RecordedOrder | null> {
    if (!receipt.lines.length) {
      return null;
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const totals = this.calculateTotals(receipt.lines);
    const reference = this.generateReference();
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;

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
      }));

      const { error: lineError } = await client.from(this.lineTable).insert(linePayload);
      if (lineError) {
        throw lineError;
      }
    } catch (error) {
      if (orderId) {
        await client.from(this.orderTable).delete().eq('id', orderId);
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
