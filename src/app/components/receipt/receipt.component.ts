import { Component, inject, input } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Line } from '../../shared/models/line.model';
import { toQRCodeBase64 } from '../../shared/utils/qrcode-generator.util';
import { UiButtonComponent, UiCardComponent } from '../../ui';

@Component({
  selector: 'receipt',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent],
  templateUrl: './receipt.component.html',
  providers: [DatePipe, CurrencyPipe]
})
export class ReceiptComponent {
  lines = input<Line[]>([]);

  sellerName = 'My Store';
  sellerVat = '123456789000003'; // Replace with real VAT #
  invoiceDate = new Date();
  invoiceUUID = crypto.randomUUID(); // For testing; ZATCA systems assign real UUIDs

  private readonly date = inject(DatePipe);
  private readonly currency = inject(CurrencyPipe);

  get phone(): string {
    return this.lines()[0]?.phone || 'Walk-in';
  } 
  
  get payment(): string {
    return this.lines()[0]?.payment || '-';
  }

  get totalVAT(): number {
    return this.lines().reduce((sum, l) => sum + l.vatAmount, 0);
  }

  get total(): number {
    return this.lines().reduce((sum, l) => sum + l.grossTotal, 0);
  }

  async print() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qr = await toQRCodeBase64({
      sellerName: this.sellerName,
      vatNumber: this.sellerVat,
      timestamp: this.invoiceDate.toISOString(),
      totalAmount: this.total,
      vatAmount: this.totalVAT
    });

    const rows = this.lines().map(l => {
  const netPrice = l.price / 1.15;
  const netTotal = netPrice * l.qty;
  return `
    <tr>
      <td>${l.name}</td>
      <td>${l.qty}</td>
      <td>SAR ${netPrice.toFixed(2)}</td>
      <td>SAR ${netTotal.toFixed(2)}</td>
    </tr>
  `;
}).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 16px; max-width: 600px;">
        <h2>${this.sellerName}</h2>
        <p>VAT Number: ${this.sellerVat}</p>
        <p>Invoice #: ${this.invoiceUUID}</p>
        <p>Date: ${this.date.transform(this.invoiceDate, 'medium')}</p>
        <p>Customer: ${this.phone}</p>
        <p>Payment Method: ${this.payment}</p>

        <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; margin-top: 12px; border-collapse: collapse;">
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <p style="margin-top: 12px;"><strong>Total (incl. VAT): SAR ${this.total.toFixed(2)}</strong></p>
        <p>VAT Amount: SAR ${this.totalVAT.toFixed(2)}</p>

        <img src="${qr}" alt="QR Code" style="margin-top: 16px;" />
      </div>
    `;

    const doc = printWindow.document;
    doc.write(`<html><head><title>Receipt</title></head><body>${html}</body></html>`);
    doc.close();
    printWindow.print();
  }
}
 