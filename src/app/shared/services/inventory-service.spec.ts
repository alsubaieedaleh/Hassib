import { TestBed } from '@angular/core/testing';

import { InventoryService, ProductDto } from './inventory-service';
import { SupabaseService } from './supabase.service';

class SupabaseServiceMock {
  isConfigured = jest.fn(() => true);
  ensureClient = jest.fn();
  requireAuthenticatedUserId = jest.fn();
  configurationError = jest.fn(() => null);
}

describe('InventoryService', () => {
  let service: InventoryService;
  let supabase: SupabaseServiceMock;

  beforeEach(() => {
    supabase = new SupabaseServiceMock();
    supabase.isConfigured.mockReturnValue(false);

    TestBed.configureTestingModule({
      providers: [
        InventoryService,
        { provide: SupabaseService, useValue: supabase },
      ],
    });

    service = TestBed.inject(InventoryService);
    jest.spyOn(service, 'refresh').mockResolvedValue();
    supabase.isConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('imports products by aggregating duplicates and recording inventory movements', async () => {
    const aggregatedInsert: any[] = [];
    const movementPayload: any[] = [];

    const inventoryInMock = jest.fn().mockResolvedValue({
      data: [
        { id: 41, sku: 'SKU-001', name: 'Scanner', quantity: 5, unit: 'pcs', location_id: 1 },
      ],
      error: null,
    });
    const inventoryEqMock = jest.fn().mockReturnValue({ in: inventoryInMock });
    const inventorySelectMock = jest.fn().mockReturnValue({ eq: inventoryEqMock });

    const upsertSelectMock = jest.fn().mockResolvedValue({
      data: [
        { id: 41, sku: 'SKU-001', quantity: 9, unit: 'pcs', location_id: 2, name: 'Scanner' },
        { id: 88, sku: 'SKU-002', quantity: 3, unit: 'box', location_id: null, name: 'Cable' },
      ],
      error: null,
    });
    const upsertMock = jest.fn().mockImplementation((payload: any[]) => {
      aggregatedInsert.push(...payload);
      return { select: upsertSelectMock };
    });

    const movementInsertMock = jest.fn().mockImplementation((payload: any[]) => {
      movementPayload.push(...payload);
      return Promise.resolve({ error: null });
    });

    supabase.ensureClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'inventory_items') {
          return {
            select: inventorySelectMock,
            upsert: upsertMock,
          } as any;
        }

        if (table === 'inventory_movements') {
          return {
            insert: movementInsertMock,
          } as any;
        }

        throw new Error(`Unexpected table ${table}`);
      },
    });

    supabase.requireAuthenticatedUserId.mockResolvedValue('user-1');

    const products: ProductDto[] = [
      { name: 'Scanner', sku: 'SKU-001', quantity: 2, unit: 'pcs' },
      { name: 'Scanner Bundle', sku: 'SKU-001', quantity: 2, unit: 'pcs', locationId: 2 },
      { name: 'Cable', sku: 'SKU-002', quantity: 3, unit: 'box' },
    ];

    const result = await service.importProducts(products);

    expect(result).toBe(2);

    expect(inventorySelectMock).toHaveBeenCalledWith('id, sku, name, quantity, unit, location_id');
    expect(inventoryEqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(inventoryInMock).toHaveBeenCalledWith('sku', ['SKU-001', 'SKU-002']);

    expect(aggregatedInsert).toEqual([
      {
        id: 41,
        name: 'Scanner Bundle',
        sku: 'SKU-001',
        quantity: 9,
        unit: 'pcs',
        location_id: 2,
        user_id: 'user-1',
      },
      {
        id: undefined,
        name: 'Cable',
        sku: 'SKU-002',
        quantity: 3,
        unit: 'box',
        location_id: null,
        user_id: 'user-1',
      },
    ]);

    expect(movementInsertMock).toHaveBeenCalledTimes(1);
    expect(movementPayload).toEqual([
      {
        inventory_item_id: 41,
        movement_type: 'IN',
        change_qty: 4,
        location_id: 2,
        user_id: 'user-1',
      },
      {
        inventory_item_id: 88,
        movement_type: 'IN',
        change_qty: 3,
        location_id: null,
        user_id: 'user-1',
      },
    ]);
  });

  it('adds inventory to storage and records the movement', async () => {
    const singleMock = jest.fn().mockResolvedValue({
      data: { id: 99, quantity: 5, location_id: 1 },
      error: null,
    });

    const selectSecondEqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectFirstEqMock = jest.fn().mockReturnValue({ eq: selectSecondEqMock });
    const selectMock = jest.fn().mockReturnValue({ eq: selectFirstEqMock });

    const updateUserEqMock = jest.fn().mockResolvedValue({ error: null });
    const updateIdEqMock = jest.fn().mockReturnValue({ eq: updateUserEqMock });
    const updateMock = jest.fn().mockReturnValue({ eq: updateIdEqMock });

    const movementPayload: any[] = [];
    const movementInsertMock = jest.fn().mockImplementation((payload: any[]) => {
      movementPayload.push(...payload);
      return Promise.resolve({ error: null });
    });

    supabase.ensureClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'inventory_items') {
          return {
            select: selectMock,
            update: updateMock,
          } as any;
        }

        if (table === 'inventory_movements') {
          return {
            insert: movementInsertMock,
          } as any;
        }

        throw new Error(`Unexpected table ${table}`);
      },
    });

    supabase.requireAuthenticatedUserId.mockResolvedValue('user-1');

    await service.addToStorage(99, 7, 3);

    expect(selectMock).toHaveBeenCalledWith('id, quantity, location_id');
    expect(selectFirstEqMock).toHaveBeenCalledWith('user_id', 'user-1');
    expect(selectSecondEqMock).toHaveBeenCalledWith('id', 99);
    expect(singleMock).toHaveBeenCalled();

    expect(updateMock).toHaveBeenCalledWith({ quantity: 12, location_id: 3 });
    expect(updateIdEqMock).toHaveBeenCalledWith('id', 99);
    expect(updateUserEqMock).toHaveBeenCalledWith('user_id', 'user-1');

    expect(movementPayload).toEqual([
      {
        inventory_item_id: 99,
        movement_type: 'IN',
        change_qty: 7,
        location_id: 3,
        user_id: 'user-1',
      },
    ]);
  });
});

