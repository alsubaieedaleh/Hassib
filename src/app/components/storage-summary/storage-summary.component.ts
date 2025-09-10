import { Component, computed, input, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../models/line.model';
import { ExportService } from '../../services/export.service';

type Metric = { label: string; value: () => string };
type Action = { key: 'pdf' | 'xlsx'; label: string; css: string; run: () => void };

@Component({
  selector: 'storage-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './storage-summary.component.html'
})
export class StorageSummaryComponent {
  lines = input<Line[]>([]);

  totalQty = computed(() => this.lines().reduce((sum, line) => sum + line.qty, 0));
  totalCost = computed(() => this.lines().reduce((sum, line) => sum + line.cost * line.qty, 0));
  totalGross = computed(() => this.lines().reduce((sum, line) => sum + line.grossTotal, 0));

  metrics = computed<Metric[]>(() => [
    { label: 'Stored Items', value: () => String(this.lines().length) },
    { label: 'Total Quantity', value: () => String(this.totalQty()) },
    { label: 'Total Cost', value: () => `SAR ${this.totalCost().toFixed(2)}` },
    { label: 'Total Value', value: () => `SAR ${this.totalGross().toFixed(2)}` }
  ]);

  actions = computed<Action[]>(() => [
    {
      key: 'pdf',
      label: 'Export PDF',
      css: 'btn',
      run: () => {
        this.exportSvc.exportSalesTablePDF(this.lines());
      }
    },
    {
      key: 'xlsx',
      label: 'Export Excel',
      css: 'btn',
      run: () => {
        this.exportSvc.exportXLSX(this.lines(), {
          qty: this.totalQty(),
          cost: this.totalCost(),
          gross: this.totalGross(),
          vat: 0,
          profit: 0
        });
      }
    }
  ]);

  reportRoot = viewChild<ElementRef<HTMLDivElement>>('reportRoot');

  constructor(private exportSvc: ExportService) {}
}
