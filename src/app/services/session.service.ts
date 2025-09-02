// src/app/services/session.service.ts
import { Injectable } from '@angular/core';

export interface SessionLine {
  id: number;
  barcode: string;
  name: string;
  qty: number;
  cost: number;
  price: number;
  vatAmount: number;
  profit: number;
  payment: string;
  phone: string;
  grossTotal: number;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private lines: SessionLine[] = [];

  getLines() {
    return this.lines;
  }

  reset() {
    this.lines = [];
  }

  addLine(line: Omit<SessionLine, 'id'>) {
    const id = this.lines.length + 1;
    this.lines.push({ id, ...line });
  }

  getSummary() {
    let totalQty = 0, totalGross = 0, totalVAT = 0, totalProfit = 0;
    const paymentTotals: Record<string, number> = {};

    this.lines.forEach(l => {
      totalQty += l.qty;
      totalGross += l.grossTotal;
      totalVAT += l.vatAmount;
      totalProfit += l.profit;
      paymentTotals[l.payment] = (paymentTotals[l.payment] || 0) + l.grossTotal;
    });

    return { totalQty, totalGross, totalVAT, totalProfit, paymentTotals };
  }
}
