import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryService } from '../../shared/services/inventory-service';
import { Line } from '../../shared/models/line.model';

@Component({
  selector: 'product-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-manager.component.html'
})
export class ProductManagerComponent {
  readonly inventory = inject(InventoryService);

  trackByLineId(index: number, line: Line): number {
    return line.id;
  }

  async refreshInventory(): Promise<void> {
    await this.inventory.refresh();
  }

  async removeProduct(line: Line): Promise<void> {
    if (!confirm(`Delete ${line.name}?`)) {
      return;
    }

    try {
      await this.inventory.removeProduct(line.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete product.';
      alert(message);
    }
  }
}
