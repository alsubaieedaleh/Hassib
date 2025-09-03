import { Component, input, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../models/line.model';
import { ExportService } from '../../services/export.service';

type Metric = { label: string; value: () => string };
type Action = { key: 'pdf'|'xlsx'|'csv'; label: string; css: string; run: () => void };

@Component({
  selector: 'session-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-summary.component.html'
})
export class SessionSummaryComponent {
  lines = input<Line[]>([]);

  // totals
  totalQty   = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  totalCost  = computed(() => this.lines().reduce((s, l) => s + (l.cost * l.qty), 0));
  totalGross = computed(() => this.lines().reduce((s, l) => s + l.grossTotal, 0));
  totalVAT   = computed(() => this.lines().reduce((s, l) => s + l.vatAmount, 0));
  totalProfit= computed(() => this.lines().reduce((s, l) => s + l.profit, 0));

  // payment breakdown map
  paymentTotals = computed(() => {
    const map: Record<string, number> = {};
    this.lines().forEach(l => { map[l.payment] = (map[l.payment] || 0) + l.grossTotal; });
    return map;
  });

  // text formatter
  paymentBreakdownText = computed(() => {
    const entries = Object.entries(this.paymentTotals());
    return entries.length
      ? entries.map(([k, v]) => `${k}: SAR ${v.toFixed(2)}`).join(' | ')
      : '—';
  });

  // metrics list (labels + value getters)
  metrics = computed<Metric[]>(() => [
    { label: 'Lines',              value: () => String(this.lines().length) },
    { label: 'Total Qty',          value: () => String(this.totalQty()) },
    { label: 'Total Cost',         value: () => `SAR ${this.totalCost().toFixed(2)}` },
    { label: 'Total Sales (Gross)',value: () => `SAR ${this.totalGross().toFixed(2)}` },
    { label: 'Total VAT',          value: () => `SAR ${this.totalVAT().toFixed(2)}` },
    { label: 'Net Profit',         value: () => `SAR ${this.totalProfit().toFixed(2)}` },
  ]);

  // actions list (button label + handler)
  actions = computed<Action[]>(() => [
    {
      key: 'pdf',
      label: 'Export PDF',
      css: 'btn',
      run: () => {
        const root = this.reportRoot()?.nativeElement;
        if (root) this.exportSvc.exportPDF(this.lines(), root);
      }
    },
    {
      key: 'xlsx',
      label: 'Export Excel',
      css: 'btn',
      run: () => this.exportSvc.exportXLSX(this.lines(), {
        qty: this.totalQty(), cost: this.totalCost(), gross: this.totalGross(), vat: this.totalVAT(), profit: this.totalProfit()
      }),
    },
    {
      key: 'csv',
      label: 'Export CSV',
      css: 'ghost',
      run: () => this.exportSvc.exportCSV(this.lines(), {
        qty: this.totalQty(), cost: this.totalCost(), gross: this.totalGross(), vat: this.totalVAT(), profit: this.totalProfit()
      })
    }
  ]);

  reportRoot = viewChild<ElementRef<HTMLDivElement>>('reportRoot');

  constructor(private exportSvc: ExportService) {}
}
