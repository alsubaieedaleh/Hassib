export type Payment = 'Cash' | 'Mada' | 'Credit Card' | 'On Account';

export interface Line {
  id: number;
  barcode: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  grossTotal: number;
  vatAmount: number;
  profit: number;
  payment: Payment;
  phone: string;
  /**
   * Inventory item identifier when the line is linked to a stored product.
   * Sales lines may not have an associated inventory record and leave this null.
   */
  inventoryItemId?: number | null;
  /** Storage location identifier if the item is stored in a specific warehouse. */
  locationId?: number | null;
  /** Optional friendly storage location name for UI display. */
  locationName?: string | null;
  /** Related sales order identifier when the line belongs to an order. */
  saleId?: number | null;
}
