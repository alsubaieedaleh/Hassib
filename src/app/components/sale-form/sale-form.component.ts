import { Component, signal, output, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Line, Payment } from '../../models/line.model';

type FieldType = 'text' | 'number';

interface FieldConf<T extends string | number = string | number> {
  key: 'barcode' | 'name' | 'qty' | 'price' | 'cost';
  label: string;
  placeholder?: string;
  type: FieldType;
  colSpan?: 1 | 2;
  sig: WritableSignal<T>;
  min?: number;
  step?: number;
}

@Component({
  selector: 'sale-form',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-form.component.html'
})
export class SaleFormComponent {
  addLine = output<Line>();

  // form signals
  barcode = signal<string>('');
  name = signal<string>('');
  qty = signal<number>(1);
  price = signal<number>(0);
  cost = signal<number>(0);
  vatrate = signal<number>(15);
  payment = signal<Payment>('Cash');
  phone = signal<string>('');

  // config list for row 1
  fieldsRow1: FieldConf[] = [
    {
      key: 'barcode',
      label: 'Barcode (scan or type)',
      placeholder: '1234567890',
      type: 'text',
      colSpan: 1,
      sig: this.barcode
    },
    {
      key: 'name',
      label: 'Product name',
      placeholder: 'e.g. Acme Honey 500g',
      type: 'text',
      colSpan: 1,
      sig: this.name
    },
    {
      key: 'qty',
      label: 'Qty',
      type: 'number',
      colSpan: 1,
      sig: this.qty,
      min: 1
    },
    {
      key: 'price',
      label: 'Sell Price (SAR)',
      placeholder: '0.00',
      type: 'number',
      colSpan: 1,
      sig: this.price,
      min: 0,
      step: 0.01
    },
    {
      key: 'cost',
      label: 'Cost Price (SAR)',
      placeholder: '0.00',
      type: 'number',
      colSpan: 1,
      sig: this.cost,
      min: 0,
      step: 0.01
    }
  ];

  // generic input handler (signals only)
  onInput(field: FieldConf, ev: Event) {
    const el = ev.target as HTMLInputElement;
    if (field.type === 'number') {
      const n = el.value === '' ? 0 : Number(el.value);
      const clamped = Number.isFinite(n) ? n : 0;
      field.sig.set(clamped);
    } else {
      field.sig.set(el.value);
    }
  }

  clear() {
    this.barcode.set('');
    this.name.set('');
    this.qty.set(1);
    this.price.set(0);
    this.cost.set(0);
    this.vatrate.set(15);
    this.phone.set('');
    this.payment.set('Cash');
  }

  private round(v: number) {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  submit() {
    if (!this.name().trim()) { alert('Please enter product name'); return; }

    const qty = Math.max(1, Number(this.qty()) || 1);
    const price = Math.max(0, Number(this.price()) || 0);
    const cost = Math.max(0, Number(this.cost()) || 0);

    const grossTotal = this.round(price * qty);
    const vatAmount = this.round(grossTotal * (this.vatrate() / (100 + this.vatrate())));
    const profit = this.round((grossTotal - vatAmount) - (cost * qty));

    const line: Line = {
      id: 0,
      barcode: this.barcode().trim(),
      name: this.name().trim(),
      qty, cost, price,
      grossTotal, vatAmount, profit,
      payment: this.payment(),
      phone: this.phone().trim() || 'Walk-in'
    };

    this.addLine.emit(line);
    this.clear();
  }
}
