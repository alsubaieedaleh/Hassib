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
};

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'inventory_items';

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
          'id, barcode, name, qty, price, cost, gross_total, vat_amount, profit, payment, phone'
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

  async addProducts(newProducts: Line[]): Promise<number> {
    if (!newProducts.length) {
      return 0;
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const payload = newProducts.map(product => this.mapLineToInsertPayload(product));
    const client = this.supabase.ensureClient();

    const { data, error } = await client
      .from(this.table)
      .insert(payload)
      .select('id, barcode, name, qty, price, cost, gross_total, vat_amount, profit, payment, phone, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const inserted = (data ?? []).map(row => this.mapRowToLine(row as InventoryRow));
    if (inserted.length) {
      this.productsSignal.update(prev => [...inserted, ...prev]);
    }

    return inserted.length;
  }

  async removeProduct(id: number): Promise<void> {
    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const { error } = await client.from(this.table).delete().eq('id', id);

    if (error) {
      throw error;
    }

    this.productsSignal.update(prev => prev.filter(line => line.id !== id));
  }

  getByBarcode(barcode: string): Line | undefined {
    return this.productsSignal().find(p => p.barcode === barcode);
  }

  async importFromExcel(file: File): Promise<number> {
    const lines = await this.parseExcel(file);
    if (!lines.length) {
      return 0;
    }
    return this.addProducts(lines);
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
              phone: ''
            };
          });

          const valid = importedLines.filter(l => l.barcode && l.name && l.qty > 0);
          resolve(valid);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (event) => reject(event);
      reader.readAsArrayBuffer(file);
    });
  }

  private mapRowToLine(row: InventoryRow): Line {
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
      phone: row.phone ?? ''
    };
  }

  private mapLineToInsertPayload(line: Line) {
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
      phone: line.phone || null
    };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
