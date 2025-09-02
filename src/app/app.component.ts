import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleFormComponent } from './components/sale-form/sale-form.component';
import { ProductManagerComponent } from './components/product-manager/product-manager.component';
import { SaleTableComponent } from './components/sale-table/sale-table.component';
import { SessionSummaryComponent } from './components/session-summary/session-summary.component';
import { Line } from './models/line.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SaleFormComponent,
    ProductManagerComponent,
    SaleTableComponent,
    SessionSummaryComponent
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
  lines = signal<Line[]>([]);

  addLine(line: Line) {
    this.lines.update(lines => [...lines, line]);
  }
}
