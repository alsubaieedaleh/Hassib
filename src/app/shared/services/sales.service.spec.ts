import { TestBed } from '@angular/core/testing';

import { SalesService } from './sales.service';
import { SupabaseService } from './supabase.service';
import { Line } from '../models/line.model';

class SupabaseServiceMock {
  isConfigured = jest.fn(() => true);
  ensureClient = jest.fn();
  requireAuthenticatedUserId = jest.fn();
}

describe('SalesService', () => {
  let service: SalesService;
  let supabase: SupabaseServiceMock;

  const orderId = 123;
  let orderInsertPayload: any;
  let lineInsertPayload: any;
  let fromMock: jest.Mock;
  let orderInsert: jest.Mock;
  let orderSelect: jest.Mock;
  let orderSingle: jest.Mock;
  let lineInsert: jest.Mock;

  beforeEach(() => {
    orderInsertPayload = undefined;
    lineInsertPayload = undefined;

    orderSingle = jest.fn().mockResolvedValue({ data: { id: orderId, reference: 'SO-ORDER-REF' }, error: null });
    orderSelect = jest.fn().mockReturnValue({ single: orderSingle });
    orderInsert = jest.fn().mockImplementation(payload => {
      orderInsertPayload = payload;
      return { select: orderSelect };
    });

    lineInsert = jest.fn().mockImplementation(payload => {
      lineInsertPayload = payload;
      return Promise.resolve({ error: null });
    });

    const orderDeleteFinal = jest.fn().mockResolvedValue({ error: null });
    const orderDeleteEq = jest.fn().mockReturnValue({ eq: orderDeleteFinal });
    const orderDelete = jest.fn().mockReturnValue({ eq: orderDeleteEq });

    fromMock = jest.fn().mockImplementation((table: string) => {
      if (table === 'sales_orders') {
        return {
          insert: orderInsert,
          delete: orderDelete,
        };
      }

      if (table === 'sales_lines') {
        return {
          insert: lineInsert,
        };
      }

      throw new Error(`Unexpected table access: ${table}`);
    });

    supabase = new SupabaseServiceMock();
    supabase.ensureClient.mockReturnValue({
      auth: {
        getSession: jest.fn(),
      },
      from: fromMock,
    });
    supabase.requireAuthenticatedUserId.mockResolvedValue('user-1');

    TestBed.configureTestingModule({
      providers: [
        SalesService,
        { provide: SupabaseService, useValue: supabase },
      ],
    });

    service = TestBed.inject(SalesService);
  });

  it('records receipts by linking sales orders and lines to Supabase tables', async () => {
    const lines: Line[] = [
      {
        id: 1,
        barcode: '123456789',
        name: 'Wireless Scanner',
        qty: 2,
        price: 250,
        cost: 150,
        grossTotal: 500,
        vatAmount: 65,
        profit: 135,
        payment: 'Cash',
        phone: '0500123456',
        inventoryItemId: 77,
      },
    ];

    const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const result = await service.recordReceipt({
      lines,
      payment: 'Cash',
      customerPhone: '0500123456',
    });

    expect(fromMock).toHaveBeenNthCalledWith(1, 'sales_orders');
    expect(fromMock).toHaveBeenNthCalledWith(2, 'sales_lines');

    expect(orderInsert).toHaveBeenCalledTimes(1);
    expect(orderInsertPayload).toMatchObject({
      customer_name: '0500123456',
      customer_phone: '0500123456',
      payment_method: 'Cash',
      subtotal: 435,
      vat_amount: 65,
      total: 500,
      user_id: 'user-1',
    });
    expect(orderInsertPayload.reference).toMatch(/^SO-\d{8}-[A-Z0-9]{4}$/);

    expect(lineInsert).toHaveBeenCalledTimes(1);
    expect(Array.isArray(lineInsertPayload)).toBe(true);
    expect(lineInsertPayload).toHaveLength(1);
    expect(lineInsertPayload[0]).toMatchObject({
      sale_id: orderId,
      inventory_item_id: 77,
      barcode: '123456789',
      name: 'Wireless Scanner',
      qty: 2,
      price: 250,
      cost: 150,
      gross_total: 500,
      vat_amount: 65,
      profit: 135,
      payment: 'Cash',
      phone: '0500123456',
      user_id: 'user-1',
    });

    expect(supabase.requireAuthenticatedUserId).toHaveBeenCalled();

    expect(result).toEqual({ id: orderId, reference: 'SO-ORDER-REF' });

    mathRandomSpy.mockRestore();
  });
});
