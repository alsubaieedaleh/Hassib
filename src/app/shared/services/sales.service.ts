import { Injectable, inject } from '@angular/core';

import { Line } from '../models/line.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'sales_lines';

  async recordLines(lines: Line[]): Promise<void> {
    if (!lines.length) {
      return;
    }

    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    const client = this.supabase.ensureClient();
    const payload = lines.map(line => ({
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
    }));

    const { error } = await client.from(this.table).insert(payload);
    if (error) {
      throw error;
    }
  }
}
