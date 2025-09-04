import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line } from '../../models/line.model';

@Component({
  selector: 'receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html'
})
export class ReceiptComponent {
  lines = input<Line[]>([]);

  get phone(): string {
    return this.lines()[0]?.phone ?? 'Walk-in';
  }

  get payment(): string {
    return this.lines()[0]?.payment ?? '-';
  }

  get total(): number {
    return this.lines().reduce((sum, l) => sum + l.grossTotal, 0);
  }

  print() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const doc = printWindow.document;
    doc.write(`<html><head><title>Receipt</title></head><body>${this.generateHTML()}</body></html>`);
    doc.close();
    printWindow.print();
  }

  private generateHTML(): string {
    const rows = this.lines().map(l => `<tr>
      <td>${l.name}</td>
      <td>${l.qty}</td>
      <td>SAR ${l.price.toFixed(2)}</td>
      <td>SAR ${l.grossTotal.toFixed(2)}</td>
    </tr>`).join('');

    return `
      <h3>Customer: ${this.phone}</h3>
      <h4>Payment: ${this.payment}</h4>
      <table border="1" cellpadding="6">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <h3>Total: SAR ${this.total.toFixed(2)}</h3>
    `;
  }
}
