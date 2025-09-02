import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Line, Payment } from '../../models/line.model';

@Component({
  selector: 'sale-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sale-form.component.html'
})
export class SaleFormComponent {
  addLine = output<Line>();

  barcode = signal('');
  name = signal('');
  qty = signal(1);
  price = signal(0);
  cost = signal(0);
  vatrate = signal(15);
  payment = signal<Payment>('Cash');
  phone = signal('');

  private round(v:number){ return Math.round((v + Number.EPSILON) * 100) / 100; }

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

  submit() {
    if (!this.name().trim()) { alert('Please enter product name'); return; }
    const qty = this.qty();
    const price = this.price();
    const cost = this.cost();

    const grossTotal = this.round(price * qty);
    const vatAmount = this.round(grossTotal * (this.vatrate() / (100 + this.vatrate())));
    const profit = this.round((grossTotal - vatAmount) - (cost * qty));

    const line: Line = {
      id: 0,
      barcode: this.barcode(),
      name: this.name(),
      qty, cost, price,
      grossTotal, vatAmount, profit,
      payment: this.payment(),
      phone: this.phone() || 'Walk-in'
    };

    this.addLine.emit(line);
    this.clear();
  }
}
