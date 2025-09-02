import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

const PROD_KEY = 'circlepos_local_products_v1';

export interface Product {
  barcode?: string;
  name: string;
  price: number;
  cost: number;
  vatrate: number;
}

@Component({
  selector: 'product-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-manager.component.html'
})
export class ProductManagerComponent {
  products = signal<Product[]>(this.loadLocalProducts());

  private loadLocalProducts(): Product[] {
    try {
      const raw = localStorage.getItem(PROD_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  private saveLocalProducts(list: Product[]) {
    localStorage.setItem(PROD_KEY, JSON.stringify(list));
  }

  addLocalProduct(name: string, barcode: string, price: number, cost: number) {
    if (!name.trim()) { alert('Product name is required'); return; }
    const list = [{ barcode, name, price, cost, vatrate: 15 }, ...this.products()];
    this.products.set(list);
    this.saveLocalProducts(list);
  }

  removeProduct(idx: number) {
    if (!confirm('Delete this product?')) return;
    const list = this.products().slice();
    list.splice(idx, 1);
    this.products.set(list);
    this.saveLocalProducts(list);
  }
}
