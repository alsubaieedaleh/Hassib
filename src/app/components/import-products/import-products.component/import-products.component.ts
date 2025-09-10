// import-products.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../shared/services/inventory-service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-import-products',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule],
  templateUrl: './import-products.component.html',
  styleUrls: ['./import-products.component.scss'],
})
export class ImportProductsComponent {
  private inventory = inject(InventoryService);
  private snackBar = inject(MatSnackBar);

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.inventory.importFromExcel(file).then(count => {
      this.snackBar.open(`${count} products imported successfully.`, 'Close', {
        duration: 4000,
        panelClass: ['snackbar-success']
      });
    }).catch(err => {
      this.snackBar.open(`Error importing file: ${err.message || err}`, 'Close', {
        duration: 4000,
        panelClass: ['snackbar-error']
      });
    });

    input.value = '';
  }
}
