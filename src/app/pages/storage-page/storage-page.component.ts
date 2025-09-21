 
import { Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../shared/services/inventory-service';

import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { ProductManagerComponent } from '../../components/product-manager/product-manager.component';
import { SaleTableComponent } from '../../components/sale-table/sale-table.component';
import { StorageSummaryComponent } from '../../components/storage-summary/storage-summary.component';

import { ProductFormValue } from '../../shared/models/product.model';
import { Line } from '../../shared/models/line.model';
import { ImportProductsComponent } from '../../components/import-products/import-products.component/import-products.component';

@Component({
  selector: 'app-storage-page',
  standalone: true,
  imports: [
    CommonModule,
    ProductFormComponent,
    ProductManagerComponent,
    SaleTableComponent,
    StorageSummaryComponent,
    ImportProductsComponent 
  ],
  templateUrl: './storage-page.component.html',
  styleUrls: ['./storage-page.scss']
})
export class StoragePage {
  readonly inventory = inject(InventoryService);

  addProduct = async (productSignal: Signal<{ products: ProductFormValue[] }>) => {
    const { products } = productSignal();

    const newLines: Line[] = products.map(p => ({
      id: 0,
      barcode: p.barcode,
      name: p.name,
      qty: p.qty,
      price: p.price,
      cost: p.cost,
      grossTotal: this.round(p.price * p.qty),
      vatAmount: this.round(p.price * p.qty * 0.15),
      profit: 0,
      payment: 'Cash',
      phone: '',
    }));

    if (!newLines.length) {
      return;
    }

    try {
      await this.inventory.addProducts(newLines);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add products to Supabase.';
      alert(message);
    }
  };

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
 
}
