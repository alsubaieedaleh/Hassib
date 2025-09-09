import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../services/inventory-service';
import { Line } from '../../models/line.model';

type SplitKey = 'Cash' | 'Mada' | 'Credit Card' | 'On Account';

type Kpi = { label: string; value: () => string };
type ResultBox = { label: string; value: () => string };
type SplitField = { key: SplitKey; label: string };

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPage {
  // --- Shared Inventory ---
  private inventory = inject(InventoryService);
  products = this.inventory.products;

  // KPIs
  totalItems   = computed(() => this.products().length);
  totalQty     = computed(() => this.products().reduce((s, p) => s + (p.qty || 0), 0));
  totalCostVal = computed(() => this.products().reduce((s, p) => s + (p.cost * p.qty), 0));
  totalRetail  = computed(() => this.products().reduce((s, p) => s + (p.price * p.qty), 0));

  kpis = computed<Kpi[]>(() => [
    { label: 'Products',      value: () => `${this.totalItems()}` },
    { label: 'Total Qty',     value: () => `${this.totalQty()}` },
    { label: 'Inventory Cost',value: () => `SAR ${this.totalCostVal().toFixed(2)}` },
    { label: 'Retail Value',  value: () => `SAR ${this.totalRetail().toFixed(2)}` }
  ]);

  // --- VAT Calculator ---
  vatRate = signal(15);                     // 15% KSA default
  mode    = signal<'net'|'gross'>('net');   // net → add VAT, gross → extract VAT
  amount  = signal<number>(100);

  vatOut = computed(() => {
    const r = this.vatRate();
    const a = this.amount();
    if (this.mode() === 'net') {
      const vat = this.round(a * (r / 100));
      return { net: this.round(a), vat, gross: this.round(a + vat) };
    } else {
      const vat = this.round(a * (r / (100 + r)));
      return { net: this.round(a - vat), vat, gross: this.round(a) };
    }
  });

  vatResults = computed<ResultBox[]>(() => [
    { label: 'Net',   value: () => `SAR ${this.vatOut().net.toFixed(2)}` },
    { label: 'VAT',   value: () => `SAR ${this.vatOut().vat.toFixed(2)}` },
    { label: 'Gross', value: () => `SAR ${this.vatOut().gross.toFixed(2)}` },
  ]);

  // --- Change Helper ---
  due  = signal<number>(100);
  paid = signal<number>(200);
  change = computed(() => this.round(this.paid() - this.due()));
  denominations = [500, 200, 100, 50, 10, 5, 1]; // SAR notes
  changeBreakdown = computed(() => {
    let remaining = Math.max(0, this.change());
    const out: { denom: number, count: number }[] = [];
    for (const d of this.denominations) {
      const cnt = Math.floor(remaining / d);
      if (cnt > 0) {
        out.push({ denom: d, count: cnt });
        remaining = this.round(remaining - d * cnt);
      }
    }
    // coins / remainder
    if (remaining > 0) out.push({ denom: Number(remaining.toFixed(2)), count: 1 });
    return out;
  });

  // --- Margin / Markup ---
  cost  = signal<number>(50);
  price = signal<number>(100);
  margin = computed(() => {
    const c = this.cost();
    const p = this.price();
    const profit = this.round(p - c);
    const marginPct = p > 0 ? this.round((profit / p) * 100) : 0;
    const markupPct = c > 0 ? this.round((profit / c) * 100) : 0;
    return { profit, marginPct, markupPct };
  });

  marginResults = computed<ResultBox[]>(() => [
    { label: 'Profit', value: () => `SAR ${this.margin().profit.toFixed(2)}` },
    { label: 'Margin', value: () => `${this.margin().marginPct.toFixed(2)}%` },
    { label: 'Markup', value: () => `${this.margin().markupPct.toFixed(2)}%` },
  ]);

  // --- Split Payment Helper ---
  totalToSplit = signal<number>(250);
  split = signal<Record<SplitKey, number>>({
    'Cash': 50,
    'Mada': 50,
    'Credit Card': 0,
    'On Account': 0
  });

  splitFields: SplitField[] = [
    { key: 'Cash',         label: 'Cash' },
    { key: 'Mada',         label: 'Mada' },
    { key: 'Credit Card',  label: 'Credit Card' },
    { key: 'On Account',   label: 'On Account' },
  ];

  setSplit(key: SplitKey, value: number) {
    this.split.set({ ...this.split(), [key]: value });
  }

  splitAmounts = computed(() => {
    const total = this.totalToSplit();
    const s = this.split();
    const ratioSum = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    const map: Record<SplitKey, number> = { 'Cash': 0, 'Mada': 0, 'Credit Card': 0, 'On Account': 0 };
    (Object.keys(s) as SplitKey[]).forEach(k => {
      map[k] = this.round((s[k] / ratioSum) * total);
    });
    // fix rounding drift
    const calcSum = this.round(Object.values(map).reduce((a, b) => a + b, 0));
    const diff = this.round(total - calcSum);
    if (diff !== 0) {
      const first = Object.keys(map)[0] as SplitKey;
      map[first] = this.round(map[first] + diff);
    }
    return map;
  });

  // present split results in an array for @for
  splitResults = computed<ResultBox[]>(() => ([
    { label: 'Cash',        value: () => `SAR ${this.splitAmounts().Cash.toFixed(2)}` },
    { label: 'Mada',        value: () => `SAR ${this.splitAmounts().Mada.toFixed(2)}` },
    { label: 'Credit Card', value: () => `SAR ${this.splitAmounts()['Credit Card'].toFixed(2)}` },
    { label: 'On Account',  value: () => `SAR ${this.splitAmounts()['On Account'].toFixed(2)}` },
  ]));

  // --- Barcode Quick Lookup ---
  queryBarcode = signal<string>('');
  foundProduct = signal<Line | null>(null);

  onBarcodeInput(ev: Event) {
    const value = (ev.target as HTMLInputElement).value.trim();
    this.queryBarcode.set(value);
    if (!value) { this.foundProduct.set(null); return; }
    const product = this.inventory.getByBarcode(value);
    this.foundProduct.set(product ?? null);
  }

  // Helpers
  setMode(m: 'net'|'gross') { this.mode.set(m); }
  num = (e: Event) => +((e.target as HTMLInputElement).value || 0);
  round(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
}
