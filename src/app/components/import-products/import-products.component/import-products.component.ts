// import-products.component.ts
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../shared/services/inventory-service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StorageLocationService } from '../../../shared/services/storage-location.service';

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
  private readonly locationService = inject(StorageLocationService);

  readonly locationsSignal = this.locationService.locations();
  readonly locationLoading = this.locationService.loading();
  readonly locationError = this.locationService.error();

  readonly locationOptions = computed(() => this.locationsSignal());
  readonly selectedLocationId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const options = this.locationOptions();
      if (!options.length) {
        void this.locationService.ensureSeedLocation();
        return;
      }

      if (this.selectedLocationId() == null) {
        this.selectedLocationId.set(options[0]?.id ?? null);
      }
    });
  }

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.inventory.importFromExcel(file, { locationId: this.selectedLocationId() ?? null }).then(count => {
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

  onLocationChange(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    if (raw === '') {
      this.selectedLocationId.set(null);
      return;
    }

    const value = Number(raw);
    this.selectedLocationId.set(Number.isFinite(value) ? value : null);
  }
}
