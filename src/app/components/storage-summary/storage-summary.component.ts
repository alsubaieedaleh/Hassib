import { Component, computed, input, viewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../shared/models/line.model';
import { ExportService } from '../../shared/services/export.service';
import { UiButtonComponent, UiCardComponent, UiButtonVariant } from '../../ui';

type Metric = { label: string; value: () => string; hint?: string };
type Action = { key: 'pdf' | 'xlsx'; label: string; variant: UiButtonVariant; run: () => void };

@Component({
  selector: 'storage-summary',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent],
  templateUrl: './storage-summary.component.html',
  styleUrls: ['./storage-summary.component.scss']
})
export class StorageSummaryComponent {
  lines = input<Line[]>([]);

  totalQty = computed(() => this.lines().reduce((sum, line) => sum + line.qty, 0));
  totalCost = computed(() => this.lines().reduce((sum, line) => sum + line.cost * line.qty, 0));
  totalGross = computed(() => this.lines().reduce((sum, line) => sum + line.grossTotal, 0));

  metrics = computed<Metric[]>(() => [
    { label: 'Stored items', value: () => String(this.lines().length), hint: 'Unique SKUs available today' },
    { label: 'Total quantity', value: () => String(this.totalQty()), hint: 'Across all storage locations' },
    { label: 'Inventory cost', value: () => `SAR ${this.totalCost().toFixed(2)}`, hint: 'Current cost basis' },
    { label: 'Stock value', value: () => `SAR ${this.totalGross().toFixed(2)}`, hint: 'Estimated retail price' }
  ]);

  actions = computed<Action[]>(() => [
    {
      key: 'pdf',
      label: 'Export PDF',
      variant: 'primary',
      run: () => {
        this.exportSvc.exportSalesTablePDF(this.lines());
      }
    },
    {
      key: 'xlsx',
      label: 'Export Excel',
      variant: 'outline',
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

  reportRoot = viewChild<ElementRef<HTMLElement>>('reportRoot');

  private readonly exportSvc = inject(ExportService);
}
