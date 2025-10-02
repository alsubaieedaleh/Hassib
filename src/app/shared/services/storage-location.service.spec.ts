import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StorageLocationService } from './storage-location.service';
import { SupabaseService } from './supabase.service';

class SupabaseServiceMock {
  private configured = false;
  private readonly configErrorSignal = signal<string | null>(null);

  readonly isConfigured = jest.fn(() => this.configured);
  readonly ensureClient = jest.fn();
  readonly configurationError = jest.fn(() => this.configErrorSignal.asReadonly());
  readonly getAuthenticatedUserId = jest.fn();
  readonly requireAuthenticatedUserId = jest.fn();

  setConfigured(value: boolean) {
    this.configured = value;
  }
}

describe('StorageLocationService', () => {
  let service: StorageLocationService;
  let supabase: SupabaseServiceMock;

  let fromMock: jest.Mock;
  let selectMock: jest.Mock;
  let orderMock: jest.Mock;
  let eqMock: jest.Mock;
  let insertMock: jest.Mock;
  let insertSelectMock: jest.Mock;
  let insertSingleMock: jest.Mock;
  let recordedInsertPayload: any;

  const storageRows = [
    { id: 1, name: 'Warehouse A', code: 'MAIN', address: 'Riyadh', created_at: '2024-01-01T00:00:00Z' },
  ];

  beforeEach(() => {
    recordedInsertPayload = undefined;

    orderMock = jest.fn().mockResolvedValue({ data: storageRows, error: null });
    eqMock = jest.fn().mockReturnValue({ order: orderMock });
    selectMock = jest.fn().mockReturnValue({ eq: eqMock });

    insertSingleMock = jest.fn().mockResolvedValue({
      data: { id: 2, name: 'Back Room', code: 'BACK', address: 'Second Floor', created_at: '2024-01-02T00:00:00Z' },
      error: null,
    });
    insertSelectMock = jest.fn().mockReturnValue({ single: insertSingleMock });
    insertMock = jest.fn().mockImplementation(payload => {
      recordedInsertPayload = payload;
      return { select: insertSelectMock };
    });

    fromMock = jest.fn().mockImplementation((table: string) => {
      if (table !== 'storage_locations') {
        throw new Error(`Unexpected table access: ${table}`);
      }

      return {
        select: selectMock,
        insert: insertMock,
      };
    });

    supabase = new SupabaseServiceMock();
    supabase.ensureClient.mockReturnValue({ from: fromMock });
    supabase.getAuthenticatedUserId.mockResolvedValue('user-1');
    supabase.requireAuthenticatedUserId.mockResolvedValue('user-1');

    TestBed.configureTestingModule({
      providers: [
        StorageLocationService,
        { provide: SupabaseService, useValue: supabase },
      ],
    });

    service = TestBed.inject(StorageLocationService);
  });

  it('requests storage locations from the Supabase storage table', async () => {
    supabase.setConfigured(true);
    fromMock.mockClear();
    selectMock.mockClear();
    orderMock.mockClear();

    await service.refresh();

    expect(supabase.ensureClient).toHaveBeenCalled();
    expect(fromMock).toHaveBeenCalledWith('storage_locations');
    expect(selectMock).toHaveBeenCalledWith('id, name, code, address, created_at');
    expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');

    const locations = service.locations();
    expect(locations()).toEqual([
      { id: 1, name: 'Warehouse A', code: 'MAIN', address: 'Riyadh', created_at: '2024-01-01T00:00:00Z' },
    ]);
  });

  it('creates new locations by linking inserts to the storage table', async () => {
    supabase.setConfigured(true);
    await service.refresh();

    fromMock.mockClear();
    insertMock.mockClear();
    insertSelectMock.mockClear();
    insertSingleMock.mockClear();

    const result = await service.createLocation({ name: 'Back Room', code: ' BACK ', address: 'Second Floor' });

    expect(fromMock).toHaveBeenCalledWith('storage_locations');
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(recordedInsertPayload).toEqual({
      name: 'Back Room',
      code: 'BACK',
      address: 'Second Floor',
      user_id: 'user-1',
    });
    expect(insertSelectMock).toHaveBeenCalledWith('id, name, code, address, created_at');
    expect(insertSingleMock).toHaveBeenCalled();

    expect(result).toEqual({
      id: 2,
      name: 'Back Room',
      code: 'BACK',
      address: 'Second Floor',
      created_at: '2024-01-02T00:00:00Z',
    });

    const locations = service.locations();
    expect(locations().map(location => location.name)).toEqual(['Back Room', 'Warehouse A']);
  });
});
