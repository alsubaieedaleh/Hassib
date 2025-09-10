export type Payment = 'Cash' | 'Mada' | 'Credit Card' | 'On Account';

export interface Line {
  id: number;
  barcode: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  grossTotal: number;
  vatAmount: number;
  profit: number;
  payment: Payment;
  phone: string;
}
