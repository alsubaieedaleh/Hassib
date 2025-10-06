import { TestBed } from '@angular/core/testing';

import { SalesOrderDto, SalesService } from './sales.service';
import { SupabaseService } from './supabase.service';

class SupabaseServiceMock {
  isConfigured = jest.fn(() => true);
  ensureClient = jest.fn();
  requireAuthenticatedUserId = jest.fn();
}

describe('SalesService', () => {
  let service: SalesService;
  let supabase: SupabaseServiceMock;

  beforeEach(() => {
    supabase = new SupabaseServiceMock();

    TestBed.configureTestingModule({
      providers: [
        SalesService,
        { provide: SupabaseService, useValue: supabase },
      ],
    });

    service = TestBed.inject(SalesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a sales order, inserts lines, updates inventory and records movements', async () => {
    const orderInsertPayload: any[] = [];
    let lineInsertPayload: any[] = [];
    let movementPayload: any[] = [];

    const orderSingle = jest.fn().mockResolvedValue({ data: { id: 55, order_number: 'SO-1001' }, error: null });
    const orderSelect = jest.fn().mockReturnValue({ single: orderSingle });
    const orderInsert = jest.fn().mockImplementation(payload => {
      orderInsertPayload.push(payload);
      return { select: orderSelect };
    });
    const orderDeleteUserEq = jest.fn().mockResolvedValue({ error: null });
    const orderDeleteEq = jest.fn().mockReturnValue({ eq: orderDeleteUserEq });
    const orderDelete = jest.fn().mockReturnValue({ eq: orderDeleteEq });

    const lineInsert = jest.fn().mockImplementation(payload => {
      lineInsertPayload = payload;
      return Promise.resolve({ error: null });
    });
    const lineDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const lineDelete = jest.fn().mockReturnValue({ eq: lineDeleteEq });

    const inventoryIn = jest.fn().mockResolvedValue({
      data: [{ id: 7, quantity: 10, location_id: 3 }],
      error: null,
    });
    const inventoryEq = jest.fn().mockReturnValue({ in: inventoryIn });
    const inventorySelect = jest.fn().mockReturnValue({ eq: inventoryEq });

    const inventoryUpdateUserEq = jest.fn().mockResolvedValue({ error: null });
    const inventoryUpdateIdEq = jest.fn().mockReturnValue({ eq: inventoryUpdateUserEq });
    const inventoryUpdate = jest.fn().mockReturnValue({ eq: inventoryUpdateIdEq });

    const movementInsert = jest.fn().mockImplementation(payload => {
      movementPayload = payload;
      return Promise.resolve({ error: null });
    });

    supabase.ensureClient.mockReturnValue({
      from: (table: string) => {
        if (table === 'sales_orders') {
          return { insert: orderInsert, delete: orderDelete } as any;
        }

        if (table === 'sales_lines') {
          return { insert: lineInsert, delete: lineDelete } as any;
        }

        if (table === 'inventory_items') {
          return { select: inventorySelect, update: inventoryUpdate } as any;
        }

        if (table === 'inventory_movements') {
          return { insert: movementInsert } as any;
        }

        throw new Error(`Unexpected table ${table}`);
      },
    });

    supabase.requireAuthenticatedUserId.mockResolvedValue('user-1');

    const order: SalesOrderDto = {
      orderNumber: 'SO-1001',
      status: 'CONFIRMED',
      customerName: 'Acme Trading',
      orderDate: '2024-05-01',
      lines: [
        { inventoryItemId: 7, quantity: 4, unitPrice: 125 },
      ],
    };

    const result = await service.createSalesOrder(order);

    expect(orderInsert).toHaveBeenCalledTimes(1);
    expect(orderInsertPayload[0]).toMatchObject({
      order_number: 'SO-1001',
      status: 'CONFIRMED',
      customer_name: 'Acme Trading',
      user_id: 'user-1',
    });

    expect(lineInsert).toHaveBeenCalledTimes(1);
    expect(lineInsertPayload).toEqual([
      {
        sale_id: 55,
        inventory_item_id: 7,
        quantity: 4,
        unit_price: 125,
      },
    ]);

    expect(inventorySelect).toHaveBeenCalledWith('id, quantity, location_id');
    expect(inventoryEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(inventoryIn).toHaveBeenCalledWith('id', [7]);

    expect(inventoryUpdate).toHaveBeenCalledWith({ quantity: 6 });
    expect(inventoryUpdateIdEq).toHaveBeenCalledWith('id', 7);
    expect(inventoryUpdateUserEq).toHaveBeenCalledWith('user_id', 'user-1');

    expect(movementInsert).toHaveBeenCalledTimes(1);
    expect(movementPayload).toEqual([
      {
        inventory_item_id: 7,
        movement_type: 'OUT',
        change_qty: 4,
        location_id: 3,
        user_id: 'user-1',
      },
    ]);

    expect(result).toEqual({ id: 55, orderNumber: 'SO-1001' });
  });
});

