import { Injectable, Signal, inject, signal } from '@angular/core';
import * as XLSX from 'xlsx';

import { Line } from '../models/line.model';
import { SupabaseService } from './supabase.service';

type InventoryRow = {
  id: number;
  barcode: string | null;
  name: string;
  qty: number;
  price: number;
  cost: number;
  gross_total: number;
  vat_amount: number;
  profit: number;
  payment: string | null;
  phone: string | null;
  location_id: number | null;
  storage_locations?: {
    id: number;
    name: string | null;
    code: string | null;
  } | null;
};

type MovementInsert = {
  inventory_item_id: number;
  location_id: number | null;
  change: number;
  reason: string;
};

interface AddProductsOptions {
  locationId?: number | null;
  reason?: string;
}

interface SaleOrderInfo {
  id?: number;
  reference?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'inventory_items';
  private readonly movementTable = 'inventory_movements';

  private readonly productsSignal = signal<Line[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  constructor() {
    void this.refresh();
  }

  get products(): Signal<Line[]> {
    return this.productsSignal.asReadonly();
  }

  get loading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  get error(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  async refresh(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.productsSignal.set([]);
      const configError = this.supabase.configurationError();
      this.errorSignal.set(configError ? configError() : 'Supabase configuration missing.');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const client = this.supabase.ensureClient();
      const { data, error } = await client
        .from(this.table)
        .select(
          'id, barcode, name, qty, price, cost, gross_total, vat_amount, profit, payment, phone, location_id, storage_locations ( id, name, code )'
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mapped = (data ?? []).map(row => this.mapRowToLine(row as InventoryRow));
      this.productsSignal.set(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load inventory from Supabase.';
      this.errorSignal.set(message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async addProducts(newProducts: Line[], options: AddProductsOptions = {}): Promise<number> {
    if (!newProducts.length) {
      return 0;
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const payload = newProducts.map(product => this.mapLineToInsertPayload(product, options.locationId));
    const client = this.supabase.ensureClient();

    const { data, error } = await client
      .from(this.table)
      .insert(payload)
      .select(
        'id, barcode, name, qty, price, cost, gross_total, vat_amount, profit, payment, phone, location_id, storage_locations ( id, name, code )'
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const inserted = (data ?? []).map(row => this.mapRowToLine(row as InventoryRow));
    if (inserted.length) {
      this.productsSignal.update(prev => [...inserted, ...prev]);
      try {
        await this.insertMovements(
          inserted.map(line => ({
            inventory_item_id: line.id,
            location_id: line.locationId ?? options.locationId ?? null,
            change: Math.abs(line.qty),
            reason: options.reason ?? 'Manual addition',
          }))
        );
      } catch (movementError) {
        console.error('Failed to record inventory movements', movementError);
      }
    }

    return inserted.length;
  }

  async removeProduct(id: number, reason = 'Manual removal'): Promise<void> {
    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const existing = this.productsSignal().find(line => line.id === id);
    if (!existing) {
      return;
    }

    const client = this.supabase.ensureClient();
    const { error } = await client.from(this.table).delete().eq('id', id);

    if (error) {
      throw error;
    }

    this.productsSignal.update(prev => prev.filter(line => line.id !== id));

    try {
      if (existing.qty > 0) {
        await this.insertMovements([
          {
            inventory_item_id: id,
            location_id: existing.locationId ?? null,
            change: -Math.abs(existing.qty),
            reason,
          },
        ]);
      }
    } catch (movementError) {
      console.error('Failed to record inventory removal movement', movementError);
    }
  }

  getByBarcode(barcode: string): Line | undefined {
    return this.productsSignal().find(p => p.barcode === barcode);
  }

  async importFromExcel(file: File, options: AddProductsOptions = {}): Promise<number> {
    const lines = await this.parseExcel(file);
    if (!lines.length) {
      return 0;
    }
    return this.addProducts(lines, { ...options, reason: options.reason ?? 'Excel import' });
  }

  async recordSale(lines: Line[], order?: SaleOrderInfo): Promise<void> {
    if (!lines.length) {
      return;
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const products = this.productsSignal();

    const updates: {
      id: number;
      qty: number;
      gross_total: number;
      vat_amount: number;
      profit: number;
    }[] = [];
    const movements: MovementInsert[] = [];
    const updatedProducts = new Map<number, Line>();

    for (const line of lines) {
      const match = products.find(product => {
        if (line.inventoryItemId != null) {
          return product.id === line.inventoryItemId;
        }
        return !!line.barcode && product.barcode === line.barcode;
      });

      if (!match) {
        continue;
      }

      const newQty = Math.max(0, match.qty - line.qty);
      const aggregates = this.calculateAggregates(match, newQty);

      updates.push({
        id: match.id,
        qty: newQty,
        gross_total: aggregates.gross_total,
        vat_amount: aggregates.vat_amount,
        profit: aggregates.profit,
      });

      movements.push({
        inventory_item_id: match.id,
        location_id: match.locationId ?? null,
        change: -Math.abs(line.qty),
        reason: order?.reference ? `Sale ${order.reference}` : 'Sale',
      });

      updatedProducts.set(match.id, {
        ...match,
        qty: newQty,
        grossTotal: aggregates.gross_total,
        vatAmount: aggregates.vat_amount,
        profit: aggregates.profit,
      });
    }

    if (!updates.length) {
      return;
    }

    for (const update of updates) {
      const { error } = await client
        .from(this.table)
        .update({
          qty: update.qty,
          gross_total: update.gross_total,
          vat_amount: update.vat_amount,
          profit: update.profit,
        })
        .eq('id', update.id);

      if (error) {
        throw error;
      }
    }

    try {
      await this.insertMovements(movements);
    } catch (movementError) {
      console.error('Failed to record sale movement', movementError);
    }

    this.productsSignal.update(prev =>
      prev.map(item => {
        const updated = updatedProducts.get(item.id);
        return updated ? { ...item, ...updated } : item;
      })
    );
  }

  private async insertMovements(movements: MovementInsert[]): Promise<void> {
    if (!movements.length) {
      return;
    }

    if (!this.supabase.isConfigured()) {
      return;
    }

    const client = this.supabase.ensureClient();
    const { error } = await client.from(this.movementTable).insert(movements);
    if (error) {
      throw error;
    }
  }

  private async parseExcel(file: File): Promise<Line[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          const importedLines: Line[] = rows.map(row => {
            const barcode = String(row['Barcode'] ?? '').trim();
            const name = String(row['Product Name'] ?? '').trim();
            const cost = Number(row['Wholesale Price']) || 0;
            const price = Number(row['Retail Price']) || 0;
            const qty = Number(row['Quantity']) || 0;

            return {
              id: 0,
              barcode,
              name,
              qty,
              price,
              cost,
              grossTotal: this.round(price * qty),
              vatAmount: this.round(price * qty * 0.15),
              profit: 0,
              payment: 'Cash',
              phone: '',
              inventoryItemId: null,
              locationId: null,
              locationName: null,
            };
          });

          const valid = importedLines.filter(l => l.barcode && l.name && l.qty > 0);
          resolve(valid);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = event => reject(event);
      reader.readAsArrayBuffer(file);
    });
  }

  private mapRowToLine(row: InventoryRow): Line {
    const location = row.storage_locations ?? null;

    return {
      id: Number(row.id) || 0,
      barcode: row.barcode ?? '',
      name: row.name ?? '',
      qty: Number(row.qty) || 0,
      price: Number(row.price) || 0,
      cost: Number(row.cost) || 0,
      grossTotal: Number(row.gross_total) || 0,
      vatAmount: Number(row.vat_amount) || 0,
      profit: Number(row.profit) || 0,
      payment: (row.payment as Line['payment']) ?? 'Cash',
      phone: row.phone ?? '',
      inventoryItemId: Number(row.id) || 0,
      locationId: row.location_id ?? location?.id ?? null,
      locationName: location?.name ?? null,
    };
  }

  private mapLineToInsertPayload(line: Line, fallbackLocationId?: number | null) {
    return {
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
      location_id: line.locationId ?? fallbackLocationId ?? null,
    };
  }

  private calculateAggregates(product: Line, newQty: number) {
    const grossTotal = this.round(product.price * newQty);
    const vatRatio = product.grossTotal > 0 ? product.vatAmount / product.grossTotal : 0;
    const vatAmount = vatRatio > 0 ? this.round(grossTotal * vatRatio) : this.round(product.price * newQty * 0.15);
    const profit = this.round(grossTotal - vatAmount - product.cost * newQty);

    return {
      gross_total: grossTotal,
      vat_amount: vatAmount,
      profit,
    };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
