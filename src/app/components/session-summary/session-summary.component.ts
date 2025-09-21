import { Component, input, computed, viewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../shared/models/line.model';
import { ExportService } from '../../shared/services/export.service';

type Metric = { label: string; value: () => string };
type Action = { key: 'pdf' | 'xlsx' | 'csv'; label: string; css: string; run: () => void };

@Component({
  selector: 'session-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-summary.component.html',
  styleUrls: ['./session-summary.component.scss']
})
export class SessionSummaryComponent {
  lines = input<Line[]>([]);
  receipts = input<Line[][]>([]);

  totalQty = computed(() => this.lines().reduce((sum, l) => sum + l.qty, 0));
  totalCost = computed(() => this.lines().reduce((sum, l) => sum + l.cost * l.qty, 0));
  totalGross = computed(() => this.lines().reduce((sum, l) => sum + l.grossTotal, 0));
  totalVAT = computed(() => this.lines().reduce((sum, l) => sum + l.vatAmount, 0));
  totalProfit = computed(() => this.lines().reduce((sum, l) => sum + l.profit, 0));

  paymentTotals = computed(() => {
    const map: Record<string, number> = {};
    this.lines().forEach(line => {
      map[line.payment] = (map[line.payment] || 0) + line.grossTotal;
    });
    return map;
  });

  paymentBreakdownText = computed(() => {
    const entries = Object.entries(this.paymentTotals());
    return entries.length
      ? entries.map(([method, amount]) => `${method}: SAR ${amount.toFixed(2)}`).join(' | ')
      : '—';
  });

  metrics = computed<Metric[]>(() => [
    { label: 'Lines captured', value: () => String(this.lines().length) },
    { label: 'Total quantity', value: () => String(this.totalQty()) },
    { label: 'Cost basis', value: () => `SAR ${this.totalCost().toFixed(2)}` },
    { label: 'Gross sales', value: () => `SAR ${this.totalGross().toFixed(2)}` },
    { label: 'VAT collected', value: () => `SAR ${this.totalVAT().toFixed(2)}` },
    { label: 'Net profit', value: () => `SAR ${this.totalProfit().toFixed(2)}` }
  ]);

  actions = computed<Action[]>(() => [
    {
      key: 'pdf',
      label: 'Export PDF',
      css: 'btn primary',
      run: () => {
        this.exportSvc.exportSalesTablePDF(this.lines());
      }
    },

    {
      key: 'xlsx',
      label: 'Export Excel',
      css: 'btn',
      run: () => this.exportSvc.exportXLSX(this.lines(), {
        qty: this.totalQty(),
        cost: this.totalCost(),
        gross: this.totalGross(),
        vat: this.totalVAT(),
        profit: this.totalProfit()
      }, this.receipts())
    },
    {
      key: 'csv',
      label: 'Export CSV',
      css: 'btn ghost',
      run: () => this.exportSvc.exportCSV(this.lines(), {
        qty: this.totalQty(),
        cost: this.totalCost(),
        gross: this.totalGross(),
        vat: this.totalVAT(),
        profit: this.totalProfit()
      }, this.receipts())
    }
  ]);

  reportRoot = viewChild<ElementRef<HTMLDivElement>>('reportRoot');

  private readonly exportSvc = inject(ExportService);
}
