import { Component, signal, input, output, WritableSignal, Signal } from '@angular/core';
import { ProductFormValue } from '../../models/product.model';
import { Payment } from '../../models/line.model';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
 

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
  // CONFIG SIGNAL INPUTS
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
