import { toCanvas } from 'qrcode';

function encodeTLV(tag: number, value: string): Uint8Array {
  const textEncoder = new TextEncoder();
  const valueBytes = textEncoder.encode(value);
  const result = new Uint8Array(2 + valueBytes.length);
  result[0] = tag;
  result[1] = valueBytes.length;
  result.set(valueBytes, 2);
  return result;
}

export async function toQRCodeBase64(fields: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalAmount: number;
  vatAmount: number;
}): Promise<string> {
  const { sellerName, vatNumber, timestamp, totalAmount, vatAmount } = fields;

  const tlvBytes = new Uint8Array([
    ...encodeTLV(1, sellerName),
    ...encodeTLV(2, vatNumber),
    ...encodeTLV(3, timestamp),
    ...encodeTLV(4, totalAmount.toFixed(2)),
    ...encodeTLV(5, vatAmount.toFixed(2)),
  ]);

  const base64 = btoa(String.fromCharCode(...tlvBytes));
  const canvas = document.createElement('canvas');
  await toCanvas(canvas, base64, { width: 120 });
  return canvas.toDataURL();
}
