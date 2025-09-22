import { Signal, signal } from '@angular/core';

import { StorageLocation } from '../app/shared/models/storage-location.model';

export class StorageLocationServiceStub {
  private readonly locationsSignal = signal<StorageLocation[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  locations(): Signal<StorageLocation[]> {
    return this.locationsSignal.asReadonly();
  }

  loading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  error(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  refresh(): Promise<void> {
    return Promise.resolve();
  }

  ensureSeedLocation(): Promise<void> {
    return Promise.resolve();
  }

  createLocation(): Promise<StorageLocation> {
    const location: StorageLocation = {
      id: 1,
      name: 'Test Location',
      code: 'TEST',
      address: null,
      created_at: new Date().toISOString(),
    };
    this.locationsSignal.set([location]);
    return Promise.resolve(location);
  }
}
