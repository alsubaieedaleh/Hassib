import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../models/line.model';

interface Column {
  key: string;
  label: string;
  format?: (line: Line, index: number) => string;
  class?: string;
}

@Component({
  selector: 'sale-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-table.component.html'
})
export class SaleTableComponent {
  lines = input<Line[]>([]);

  columns: Column[] = [
    { key: 'index', label: '#', format: (_, i) => String(i + 1) },
    { key: 'barcode', label: 'Barcode', format: ln => ln.barcode },
    { key: 'name', label: 'Product', format: ln => ln.name, class: 'text-left pl-2' },
    { key: 'qty', label: 'Qty', format: ln => String(ln.qty) },
    { key: 'cost', label: 'Cost', format: ln => `SAR ${ln.cost.toFixed(2)}` },
    { key: 'grossTotal', label: 'Sell (Gross)', format: ln => `SAR ${ln.grossTotal.toFixed(2)}` },
    { key: 'vatAmount', label: 'VAT (15% incl)', format: ln => `SAR ${ln.vatAmount.toFixed(2)}` },
    { key: 'profit', label: 'Net Profit', format: ln => `SAR ${ln.profit.toFixed(2)}` },
    { key: 'payment', label: 'Payment', format: ln => ln.payment },
    { key: 'phone', label: 'Phone', format: ln => ln.phone }
  ];

  totalQty = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  totalCost = computed(() => this.lines().reduce((s, l) => s + (l.cost * l.qty), 0));
  totalGross = computed(() => this.lines().reduce((s, l) => s + l.grossTotal, 0));
  totalVAT = computed(() => this.lines().reduce((s, l) => s + l.vatAmount, 0));
  totalProfit = computed(() => this.lines().reduce((s, l) => s + l.profit, 0));

  paymentBreakdown = computed(() => {
    const map: Record<string, number> = {};
    this.lines().forEach(l => map[l.payment] = (map[l.payment] || 0) + l.grossTotal);
    return map;
  });

  paymentBreakdownText = computed(() => {
    const entries = Object.entries(this.paymentBreakdown());
    return entries.length
      ? entries.map(([k, v]) => `${k}: SAR ${v.toFixed(2)}`).join(' | ')
      : '—';
  });
}
