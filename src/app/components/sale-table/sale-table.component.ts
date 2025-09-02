import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../models/line.model';

@Component({
  selector: 'sale-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-table.component.html'
})
export class SaleTableComponent {
  lines = input<Line[]>([]);

  totalQty = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
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
