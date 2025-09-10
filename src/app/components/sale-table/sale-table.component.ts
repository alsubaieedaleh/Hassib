import {
  Component,
  input,
  computed,
  WritableSignal,
  signal,
  effect,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../shared/models/line.model';

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
  templateUrl: './sale-table.component.html',
})
export class SaleTableComponent {
  /**
   * ✅ Signal Input used by Angular's binding system
   * Do NOT change or remove.
   */
  readonly linesInput = input<Line[]>([]);

  /**
   * ✅ Writable internal signal used by the template
   * Allows both Angular-bound and dynamic (external) updates.
   */
  readonly lines = signal<Line[]>([]);

  constructor() {
    // Sync Angular input() signal to internal signal when used via template
    effect(() => {
      this.lines.set(this.linesInput());
    });
  }

  /**
   * ✅ Public setter for programmatic assignment (e.g., PDF export)
   * Must be called inside a runInInjectionContext()
   */
public setLinesExternally(lines: Line[], injector: Injector) {
  runInInjectionContext(injector, () => {
    this.lines.set(lines); // ✅ Use the internal signal directly here
  });
}


  /**
   * ✅ Table column configuration
   */
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

  /**
   * ✅ Computed totals
   */
  totalQty = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  totalCost = computed(() => this.lines().reduce((s, l) => s + l.cost * l.qty, 0));
  totalGross = computed(() => this.lines().reduce((s, l) => s + l.grossTotal, 0));
  totalVAT = computed(() => this.lines().reduce((s, l) => s + l.vatAmount, 0));
  totalProfit = computed(() => this.lines().reduce((s, l) => s + l.profit, 0));

  /**
   * ✅ Payment breakdown (computed map and formatted string)
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
      : '—';
  });
}
