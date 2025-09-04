import { Component, signal, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line, Payment } from '../../models/line.model';
type ProductSignals = {
  barcode: WritableSignal<string>;
  name: WritableSignal<string>;
  qty: WritableSignal<number>;
  price: WritableSignal<number>;
  cost: WritableSignal<number>;
};

// Define FieldConf type for onFieldInput
type FieldConf = {
  type: 'number' | 'text';
  sig: WritableSignal<any>;
};

@Component({
  selector: 'sale-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-form.component.html',
})
export class SaleFormComponent {
  addLine = output<Line>();
addReceipt = output<Line[]>();

  // Payment and general info (shared)
  vatrate = signal<number>(15);
  payment = signal<Payment>('Cash');
  phone = signal<string>('');
  paymentOptions: Payment[] = ['Cash', 'Mada', 'Credit Card', 'On Account'];

  // Array of product form entries
  productForms = signal<ProductSignals[]>([this.createProductForm()]);

  // Utility: create a new form instance
  private createProductForm(): ProductSignals {
    return {
      barcode: signal(''),
      name: signal(''),
      qty: signal(1),
      price: signal(0),
      cost: signal(0),
    };
  }

  // Add another product line
  addProduct() {
    const updated = [...this.productForms()];
    updated.push(this.createProductForm());
    this.productForms.set(updated);
  }

  // Clear all product forms
  clear() {
    this.productForms.set([this.createProductForm()]);
    this.phone.set('');
    this.payment.set('Cash');
  }

  // Submit all products in the session
 submit() {
  const receiptLines: Line[] = [];

  for (const form of this.productForms()) {
    if (!form.name().trim()) continue;  

    const qty = Math.max(1, Number(form.qty()) || 1);
    const price = Math.max(0, Number(form.price()) || 0);
    const cost = Math.max(0, Number(form.cost()) || 0);

    const grossTotal = this.round(price * qty);
    const vatAmount = this.round(
      grossTotal * (this.vatrate() / (100 + this.vatrate()))
    );
    const profit = this.round(grossTotal - vatAmount - cost * qty);

    receiptLines.push({
      id: 0,
      barcode: form.barcode().trim(),
      name: form.name().trim(),
      qty,
      cost,
      price,
      grossTotal,
      vatAmount,
      profit,
      payment: this.payment(),
      phone: this.phone().trim() || 'Walk-in',
    });
  }

  // ✅ Emit one complete receipt only if it has products
  if (receiptLines.length > 0) {
    this.addReceipt.emit(receiptLines);
    this.clear();
  } else {
    alert('No products to add. Please enter at least one.');
  }
}


  private round(v: number) {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }
  onFieldInput(field: FieldConf, ev: Event) {
    const el = ev.target as HTMLInputElement;
    if (field.type === 'number') {
      const n = el.value.trim() === '' ? 0 : Number(el.value);
      field.sig.set(Number.isFinite(n) ? n : 0);
    } else {
      field.sig.set(el.value);
    }
  }
  onPhoneInput(ev: Event) {
    this.phone.set((ev.target as HTMLInputElement).value);
  }
  onPaymentChange(ev: Event) {
    const val = (ev.target as HTMLSelectElement).value as Payment;
    this.payment.set(val);
  }
parseInputNumber(event: Event): number {
  const value = (event.target as HTMLInputElement).value;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}
onStringInput(sig: WritableSignal<string>, event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  sig.set(value);
}



}
