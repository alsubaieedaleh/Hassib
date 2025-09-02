import { Component, input, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../models/line.model';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'session-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-summary.component.html'
})
export class SessionSummaryComponent {
  lines = input<Line[]>([]);

  // totals
  totalQty = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  totalGross = computed(() => this.lines().reduce((s, l) => s + l.grossTotal, 0));
  totalVAT = computed(() => this.lines().reduce((s, l) => s + l.vatAmount, 0));
  totalProfit = computed(() => this.lines().reduce((s, l) => s + l.profit, 0));

  // payment breakdown map
  paymentTotals = computed(() => {
    const map: Record<string, number> = {};
    this.lines().forEach(l => {
      map[l.payment] = (map[l.payment] || 0) + l.grossTotal;
    });
    return map;
  });

  // text formatter
  paymentBreakdownText = computed(() => {
    const entries = Object.entries(this.paymentTotals());
    return entries.length
      ? entries.map(([k, v]) => `${k}: SAR ${v.toFixed(2)}`).join(' | ')
      : '—';
  });

  reportRoot = viewChild<ElementRef<HTMLDivElement>>('reportRoot');

  constructor(private exportSvc: ExportService) {}

  exportPDF() {
    if (this.reportRoot()?.nativeElement) {
      this.exportSvc.exportPDF(this.lines(), this.reportRoot()!.nativeElement);
    }
  }

  exportXLSX() {
    this.exportSvc.exportXLSX(this.lines(), {
      qty: this.totalQty(),
      gross: this.totalGross(),
      vat: this.totalVAT(),
      profit: this.totalProfit()
    });
  }

  exportCSV() {
    this.exportSvc.exportCSV(this.lines(), {
      qty: this.totalQty(),
      gross: this.totalGross(),
      vat: this.totalVAT(),
      profit: this.totalProfit()
    });
  }
}
