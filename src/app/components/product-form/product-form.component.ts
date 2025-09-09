import { Component, signal, input, output, WritableSignal, Signal } from '@angular/core';
import { ProductFormValue } from '../../models/product.model';
import { Payment } from '../../models/line.model';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { InventoryService } from '../../services/inventory-service';


interface ProductSignals {
  barcode: WritableSignal<string>;
  name: WritableSignal<string>;
  qty: WritableSignal<number>;
  price: WritableSignal<number>;
  cost: WritableSignal<number>;
}

@Component({
  selector: 'product-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent {
  private inventory = inject(InventoryService);

  showPayment = input<boolean>(true);
  showPhone = input<boolean>(true);
  showVAT = input<boolean>(true);
  fixedVATRate = input<number>(15);
  submitLabel = input<string>('Submit');

  // OUTPUT SIGNAL
  submitted = output<Signal<{ products: ProductFormValue[]; payment: Payment; phone: string }>>();

  // FORM STATE
  productForms = signal<ProductSignals[]>([this.createProductForm()]);
  payment = signal<Payment>('Cash');
  phone = signal<string>('');

  paymentOptions: Payment[] = ['Cash', 'Mada', 'Credit Card', 'On Account'];


productFields = [
  {
    key: 'barcode',
    label: 'Barcode',
    type: 'text',
    placeholder: 'example: 43423344',
    icon: [
      { d: 'M4 4h2v16H4z' },
      { d: 'M10 4h2v16h-2z' },
      { d: 'M16 4h2v16h-2z' },
    ],
    getter: (f: ProductSignals) => f.barcode(),
  onInput: (f: ProductSignals, e: Event) => this.onBarcodeInput(f, e),
  },
  {
    key: 'name',
    label: 'Product Name',
    type: 'text',
    placeholder: 'example: water bottle',
    icon: [
      { d: 'M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7' },
      { d: 'M17 8 12 3 7 8' },
      { d: 'M12 3v12' },
    ],
    getter: (f: ProductSignals) => f.name(),
    onInput: (f: ProductSignals, e: Event) => this.onStringInput(f.name, e),
  },
  {
    key: 'qty',
    label: 'Quantity',
    type: 'number',
    placeholder: '1',
    min: 1,
    icon: [
      { d: 'M12 5v14' },
      { d: 'M5 12h14' },
    ],
    getter: (f: ProductSignals) => f.qty(),
    onInput: (f: ProductSignals, e: Event) => f.qty.set(this.parseInputNumber(e)),
  },
  {
    key: 'price',
    label: 'Sell Price (SAR)',
    type: 'number',
    placeholder: '0.00',
    min: 0,
    step: '0.01',
    icon: [
      { d: 'M12 1v22' },
      { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    ],
    getter: (f: ProductSignals) => f.price(),
    onInput: (f: ProductSignals, e: Event) => f.price.set(this.parseInputNumber(e)),
  },
  {
    key: 'cost',
    label: 'Cost Price (SAR)',
    type: 'number',
    placeholder: '0.00',
    min: 0,
    step: '0.01',
    icon: [
      { d: 'M2 5h20v14H2z' },
      { d: 'M2 10h20' },
    ],
    getter: (f: ProductSignals) => f.cost(),
    onInput: (f: ProductSignals, e: Event) => f.cost.set(this.parseInputNumber(e)),
  },
];


  private createProductForm(): ProductSignals {
    return {
      barcode: signal(''),
      name: signal(''),
      qty: signal(1),
      price: signal(0),
      cost: signal(0),
    };
  }

  addProduct() {
    this.productForms.set([...this.productForms(), this.createProductForm()]);
  }

  clear() {
    this.productForms.set([this.createProductForm()]);
    this.phone.set('');
    this.payment.set('Cash');
  }
onBarcodeInput(f: ProductSignals, event: Event): void {
  const value = (event.target as HTMLInputElement).value.trim();
  f.barcode.set(value);

  const storedProduct = this.inventory.getByBarcode(value);
  if (storedProduct) {
    f.name.set(storedProduct.name);
    f.price.set(storedProduct.price);
    f.cost.set(storedProduct.cost);
  }
}

  submit() {
    const products: ProductFormValue[] = this.productForms()
      .filter(p => p.name().trim())
      .map(p => ({
        barcode: p.barcode().trim(),
        name: p.name().trim(),
        qty: Math.max(1, p.qty()),
        price: Math.max(0, p.price()),
        cost: Math.max(0, p.cost()),
      }));

    if (products.length > 0) {
      this.submitted.emit(signal({
        products,
        payment: this.payment(),
        phone: this.phone()
      }));
      this.clear();
    } else {
      alert('No products to add.');
    }
  }

  // Reusable handlers
  parseInputNumber(event: Event): number {
    const value = (event.target as HTMLInputElement).value;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  onStringInput(sig: WritableSignal<string>, event: Event): void {
    sig.set((event.target as HTMLInputElement).value);
  }

  onPhoneInput(ev: Event) {
    this.phone.set((ev.target as HTMLInputElement).value);
  }

  onPaymentChange(ev: Event) {
    this.payment.set((ev.target as HTMLSelectElement).value as Payment);
  }
  removeProduct(index: number) {
    const forms = this.productForms();
    const updated = forms.slice(0, index).concat(forms.slice(index + 1));
    this.productForms.set(updated);
  }

}
