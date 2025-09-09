// storage-page.ts
import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory-service';

import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { ProductManagerComponent } from '../../components/product-manager/product-manager.component';
import { SaleTableComponent } from '../../components/sale-table/sale-table.component';
import { StorageSummaryComponent } from '../../components/storage-summary/storage-summary.component';

import { ProductFormValue } from '../../models/product.model';
import { Line } from '../../models/line.model';

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
  templateUrl: './storage-page.component.html',
  styleUrls: ['./storage-page.scss']
})
export class StoragePage {
  constructor(public inventory: InventoryService) {}

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

    this.inventory.addProducts(newLines);
  };

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  importFile(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  this.inventory.importFromExcel(file).then(count => {
    alert(`${count} products imported successfully.`);
  }).catch(err => {
    alert(`Error importing file: ${err.message || err}`);
  });

   input.value = '';
}

}
