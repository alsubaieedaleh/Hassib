export type Payment = 'Cash'|'Mada'|'Credit Card'|'On Account';

export interface Line {
  id: number;
  barcode: string;
  name: string;
  qty: number;
  cost: number;
  price: number;
  grossTotal: number;
  vatAmount: number;
  profit: number;
  payment: Payment;
  phone: string;
}
