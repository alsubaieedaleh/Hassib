import { Component, Signal, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { ProductManagerComponent } from '../../components/product-manager/product-manager.component';
import { SaleTableComponent } from '../../components/sale-table/sale-table.component';
import { SessionSummaryComponent } from '../../components/session-summary/session-summary.component';
import { ReceiptComponent } from '../../components/receipt/receipt.component';

import { Line, Payment } from '../../shared/models/line.model';
import { ProductFormValue } from '../../shared/models/product.model';
import { InventoryService } from "../../shared/services/inventory-service";
import { SalesService } from "../../shared/services/sales.service";

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
  private readonly sales = inject(SalesService);

  lines = signal<Line[]>([]);
  receipts = signal<Line[][]>([]);

  vatRate = signal(15);
  payment = signal<Payment>('Cash');
  phone = signal<string>('Walk-in');
 
  addReceipt = (
    receiptSignal: Signal<{
      products: ProductFormValue[];
      payment: Payment;
      phone: string;
      locationId: number | null;
      locationName: string | null;
    }>
  ) => {
    const { products, payment, phone } = receiptSignal();

    const newLines: Line[] = products.map(p => {
      const storedProduct = p.barcode ? this.inventory.getByBarcode(p.barcode) : undefined;
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
        inventoryItemId: storedProduct?.id ?? storedProduct?.inventoryItemId ?? null,
        locationId: storedProduct?.locationId ?? null,
        locationName: storedProduct?.locationName ?? null,
      };
    });

    this.lines.update(prev => [...prev, ...newLines]);
    this.receipts.update(prev => [...prev, newLines]);

    void this.persistSales(newLines, payment, phone);
  };

  // Optional: Lookup a stored product
  lookupProduct(barcode: string): Line | undefined {
    return this.inventory.getByBarcode(barcode);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async persistSales(originalLines: Line[], payment: Payment, phone: string): Promise<void> {
    let processedLines = originalLines;

    try {
      const order = await this.sales.recordReceipt({
        lines: originalLines,
        payment,
        customerPhone: phone,
      });

      if (order) {
        processedLines = originalLines.map(line => ({ ...line, saleId: order.id }));

        this.lines.update(prev =>
          prev.map(item => {
            const index = originalLines.indexOf(item);
            return index !== -1 ? processedLines[index] : item;
          })
        );

        this.receipts.update(prev =>
          prev.map(receipt => (receipt === originalLines ? processedLines : receipt))
        );
      }

      await this.inventory.recordSale(processedLines, order ?? undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record sale in Supabase.';
      console.error(message, error);
      alert(message);
    }
  }

}
