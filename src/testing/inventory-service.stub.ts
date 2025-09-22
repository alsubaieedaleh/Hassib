import { Signal, signal } from '@angular/core';

import { Line } from '../app/shared/models/line.model';

export class InventoryServiceStub {
  private readonly productsSignal = signal<Line[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  get products(): Signal<Line[]> {
    return this.productsSignal.asReadonly();
  }

  get loading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  get error(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  refresh(): Promise<void> {
    return Promise.resolve();
  }

  removeProduct(): Promise<void> {
    return Promise.resolve();
  }

  importFromExcel(): Promise<number> {
    return Promise.resolve(0);
  }

  addProducts(): Promise<number> {
    return Promise.resolve(0);
  }

  getByBarcode(_barcode: string): Line | undefined {
    return undefined;
  }
}
