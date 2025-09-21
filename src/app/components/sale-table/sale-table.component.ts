import {
  Component,
  input,
  computed,
  signal,
  effect,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../shared/models/line.model';

interface ColumnFormatArgs {
  line: Line;
  index: number;
}

interface Column {
  key: string;
  label: string;
  format?: (payload: ColumnFormatArgs) => string;
  class?: string;
}

@Component({
  selector: 'sale-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-table.component.html',
})
export class SaleTableComponent {
  /**
   * Signal input used by Angular's binding system. Do NOT change or remove.
   */
  readonly linesInput = input<Line[]>([]);

  /**
   * Writable internal signal used by the template for both bound and dynamic updates.
   */
  readonly lines = signal<Line[]>([]);

  constructor() {
    // Sync Angular input() signal to internal signal when used via template
    effect(() => {
      this.lines.set(this.linesInput());
    });
  }

  /**
   * Public setter for programmatic assignment (e.g., PDF export).
   * Must be called inside a runInInjectionContext().
   */
  public setLinesExternally(lines: Line[], injector: Injector) {
    runInInjectionContext(injector, () => {
      this.lines.set(lines);
    });
  }

  columns: Column[] = [
    { key: 'index', label: '#', format: ({ index }) => String(index + 1) },
    { key: 'barcode', label: 'Barcode', format: ({ line }) => line.barcode },
    { key: 'name', label: 'Product', format: ({ line }) => line.name, class: 'text-left pl-2' },
    { key: 'qty', label: 'Qty', format: ({ line }) => String(line.qty) },
    { key: 'cost', label: 'Cost', format: ({ line }) => `SAR ${line.cost.toFixed(2)}` },
    { key: 'grossTotal', label: 'Sell (Gross)', format: ({ line }) => `SAR ${line.grossTotal.toFixed(2)}` },
    { key: 'vatAmount', label: 'VAT (15% incl)', format: ({ line }) => `SAR ${line.vatAmount.toFixed(2)}` },
    { key: 'profit', label: 'Net Profit', format: ({ line }) => `SAR ${line.profit.toFixed(2)}` },
    { key: 'payment', label: 'Payment', format: ({ line }) => line.payment },
    { key: 'phone', label: 'Phone', format: ({ line }) => line.phone }
  ];

  totalQty = computed(() => this.lines().reduce((sum, line) => sum + line.qty, 0));
  totalCost = computed(() => this.lines().reduce((sum, line) => sum + line.cost * line.qty, 0));
  totalGross = computed(() => this.lines().reduce((sum, line) => sum + line.grossTotal, 0));
  totalVAT = computed(() => this.lines().reduce((sum, line) => sum + line.vatAmount, 0));
  totalProfit = computed(() => this.lines().reduce((sum, line) => sum + line.profit, 0));

  /**
   * Payment breakdown (computed map and formatted string).
   */
  paymentBreakdown = computed(() => {
    const map: Record<string, number> = {};
    this.lines().forEach(line => {
      map[line.payment] = (map[line.payment] || 0) + line.grossTotal;
    });
    return map;
  });

  paymentBreakdownText = computed(() => {
    const entries = Object.entries(this.paymentBreakdown());
    return entries.length
      ? entries.map(([method, amount]) => `${method}: SAR ${amount.toFixed(2)}`).join(' | ')
      : '';
  });
}

