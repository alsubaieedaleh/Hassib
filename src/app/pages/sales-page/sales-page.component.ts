import { Component, Signal, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { ProductManagerComponent } from '../../components/product-manager/product-manager.component';
import { SaleTableComponent } from '../../components/sale-table/sale-table.component';
import { SessionSummaryComponent } from '../../components/session-summary/session-summary.component';
import { ReceiptComponent } from '../../components/receipt/receipt.component';

import { Line, Payment } from '../../models/line.model';
import { ProductFormValue } from '../../models/product.model';
import { InventoryService } from '../../services/inventory-service';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductFormComponent,
    ProductManagerComponent,
    SaleTableComponent,
    SessionSummaryComponent,
    ReceiptComponent
  ],
  templateUrl: './sales-page.component.html',
  styleUrls: ['./sales-page.component.scss']
})
export class SalesPage {
  private inventory = inject(InventoryService);

  lines = signal<Line[]>([]);
  receipts = signal<Line[][]>([]);

  vatRate = signal(15);
  payment = signal<Payment>('Cash');
  phone = signal<string>('Walk-in');
 
  addReceipt = (receiptSignal: Signal<{ products: ProductFormValue[]; payment: Payment; phone: string }>) => {
    const { products, payment, phone } = receiptSignal();  

    const newLines: Line[] = products.map(p => {
      const grossTotal = this.round(p.price * p.qty);
      const vatAmount = this.round(
        grossTotal * (this.vatRate() / (100 + this.vatRate()))
      );
      const profit = this.round(grossTotal - vatAmount - p.cost * p.qty);

      return {
        id: 0,
        barcode: p.barcode,
        name: p.name,
        qty: p.qty,
        price: p.price,
        cost: p.cost,
        grossTotal,
        vatAmount,
        profit,
        payment,
        phone,
      };
    });

    this.lines.update(prev => [...prev, ...newLines]);
    this.receipts.update(prev => [...prev, newLines]);
  };

  // Optional: Lookup a stored product
  lookupProduct(barcode: string): Line | undefined {
    return this.inventory.getByBarcode(barcode);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
