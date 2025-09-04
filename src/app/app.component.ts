import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleFormComponent } from './components/sale-form/sale-form.component';
import { ProductManagerComponent } from './components/product-manager/product-manager.component';
import { SaleTableComponent } from './components/sale-table/sale-table.component';
import { SessionSummaryComponent } from './components/session-summary/session-summary.component';
import { ReceiptComponent } from './components/receipt/receipt.component';
import { Line } from './models/line.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SaleFormComponent,
    ProductManagerComponent,
    SaleTableComponent,
    SessionSummaryComponent,
    ReceiptComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  lines = signal<Line[]>([]);
  receipts = signal<Line[][]>([]); // list of receipts

  // on new receipt submission from form
  addReceipt = (lines: Line[]) => {
    this.lines.update(s => [...s, ...lines]);
    this.receipts.update(r => [...r, lines]);
  };
}
