import { Component, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { ProductManagerComponent } from '../../components/product-manager/product-manager.component';
import { SaleTableComponent } from '../../components/sale-table/sale-table.component';

import { ProductFormValue } from '../../models/product.model';
import { Line } from '../../models/line.model';
import { StorageSummaryComponent } from '../../components/storage-summary/storage-summary.component';

@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductFormComponent,
    ProductManagerComponent,
    SaleTableComponent,
    StorageSummaryComponent
  ],
  templateUrl: './storage-page.html',
  styleUrls: ['./storage-page.scss']
})
export class StoragePage {
  // Estado reactivo
  lines = signal<Line[]>([]);

  // Agregar productos desde el formulario
  addProduct = (productSignal: Signal<{ products: ProductFormValue[] }>) => {
    const { products } = productSignal();

    const newLines: Line[] = products.map(p => ({
      id: 0,
      barcode: p.barcode,
      name: p.name,
      qty: p.qty,
      price: p.price,
      cost: p.cost,
      grossTotal: this.round(p.price * p.qty),
      vatAmount: 0,
      profit: 0,
      payment: 'Cash',
      phone: '',
    }));

    this.lines.update(prev => [...prev, ...newLines]);
  };

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
