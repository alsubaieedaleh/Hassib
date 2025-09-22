import { TestBed } from '@angular/core/testing';

import { Line } from '../models/line.model';
import { SalesService } from './sales.service';
import { SupabaseService } from './supabase.service';

type OrderPayload = {
  reference: string;
  customer_name: string;
  customer_phone: string | null;
  payment_method: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  user_id: string | null;
};

type LinePayload = {
  sale_id: number | null;
  inventory_item_id: number | null;
  barcode: string | null;
  name: string;
  qty: number;
  price: number;
  cost: number;
  gross_total: number;
  vat_amount: number;
  profit: number;
  payment: string;
  phone: string | null;
};

class SupabaseClientMock {
  insertedOrders: OrderPayload[] = [];
  insertedLines: LinePayload[][] = [];
  deletedOrderIds: number[] = [];
  failLines = false;
  nextOrderId = 101;

  readonly auth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'user-1', email: 'user@example.com', user_metadata: {} } } },
    }),
  };

  from(table: string) {
    if (table === 'sales_orders') {
      return {
        insert: (payload: OrderPayload) => {
          this.insertedOrders.push(payload);
          const orderId = this.nextOrderId++;
          return {
            select: () => ({
              single: async () => ({ data: { id: orderId, reference: payload.reference }, error: null }),
            }),
          };
        },
        delete: () => ({
          eq: async (_column: string, value: number) => {
            this.deletedOrderIds.push(value);
            return { error: null };
          },
        }),
      };
    }

    if (table === 'sales_lines') {
      return {
        insert: async (payload: LinePayload[]) => {
          this.insertedLines.push(payload);
          if (this.failLines) {
            return { error: new Error('Failed to insert sales lines') };
          }
          return { error: null };
        },
      };
    }

    return {
      insert: async () => ({ error: null }),
    };
  }
}

describe('SalesService', () => {
  let client: SupabaseClientMock;
  let service: SalesService;

  const createLine = (overrides: Partial<Line> = {}): Line => ({
    id: 0,
    barcode: '123456789',
    name: 'Test product',
    qty: 2,
    price: 50,
    cost: 20,
    grossTotal: 100,
    vatAmount: 15,
    profit: 65,
    payment: 'Cash',
    phone: '0500000000',
    inventoryItemId: 55,
    locationId: null,
    locationName: null,
    ...overrides,
  });

  beforeEach(() => {
    client = new SupabaseClientMock();

    TestBed.configureTestingModule({
      providers: [
        SalesService,
        {
          provide: SupabaseService,
          useValue: {
            isConfigured: () => true,
            ensureClient: () => client,
          },
        },
      ],
    });

    service = TestBed.inject(SalesService);
  });

  it('records the order header and links lines to the sale', async () => {
    const lines = [createLine(), createLine({ barcode: '987654321', qty: 1, grossTotal: 50, vatAmount: 7.5, profit: 27.5 })];

    const result = await service.recordReceipt({
      lines,
      payment: 'Cash',
      customerPhone: '0581112222',
    });

    expect(result).toBeTruthy();
    expect(client.insertedOrders).toHaveLength(1);
    expect(client.insertedLines).toHaveLength(1);

    const insertedOrder = client.insertedOrders[0];
    expect(insertedOrder.payment_method).toBe('Cash');
    expect(insertedOrder.customer_phone).toBe('0581112222');
    expect(insertedOrder.user_id).toBe('user-1');
    expect(insertedOrder.total).toBeCloseTo(150);
    expect(insertedOrder.vat_amount).toBeCloseTo(22.5);
    expect(insertedOrder.subtotal).toBeCloseTo(127.5);

    const insertedLines = client.insertedLines[0];
    expect(insertedLines).toHaveLength(2);
    expect(insertedLines[0]).toMatchObject({
      sale_id: result?.id ?? null,
      inventory_item_id: 55,
      barcode: '123456789',
      qty: 2,
      payment: 'Cash',
    });
    expect(insertedLines[1]).toMatchObject({
      sale_id: result?.id ?? null,
      barcode: '987654321',
      qty: 1,
    });
  });

  it('rolls back the order when inserting lines fails', async () => {
    client.failLines = true;
    const lines = [createLine()];

    await expect(
      service.recordReceipt({
        lines,
        payment: 'Cash',
        customerPhone: '0500000000',
      })
    ).rejects.toThrow('Failed to insert sales lines');

    expect(client.deletedOrderIds).toHaveLength(1);
    expect(client.deletedOrderIds[0]).toBe(101);
  });
});
