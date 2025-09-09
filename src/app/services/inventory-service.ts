// inventory.service.ts
import { Injectable, Signal, signal } from '@angular/core';
import { Line } from '../models/line.model';
import * as XLSX from 'xlsx';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private productsSignal = signal<Line[]>([]);

  get products(): Signal<Line[]> {
    return this.productsSignal.asReadonly();
  }

  addProducts(newProducts: Line[]) {
    this.productsSignal.update(prev => [...prev, ...newProducts]);
  }

  getByBarcode(barcode: string): Line | undefined {
    return this.productsSignal().find(p => p.barcode === barcode);
  }

importFromExcel(file: File): Promise<number> {
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
            vatAmount: 0,
            profit: 0,
            payment: 'Cash',
            phone: ''
          };
        });

        const valid = importedLines.filter(l => l.barcode && l.name && l.qty > 0);
        this.addProducts(valid);
        resolve(valid.length);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}



  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
