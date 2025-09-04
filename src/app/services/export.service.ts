import { Injectable } from '@angular/core';
import { Line } from '../models/line.model';

// external libs
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private round(v: number) {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  async exportPDF(lines: Line[], element: HTMLElement) {
    if (lines.length === 0) {
      alert('No lines to export.');
      return;
    }
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const img = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [canvas.width, canvas.height] });
    pdf.addImage(img, 'PNG', 20, 20, canvas.width * 0.72, canvas.height * 0.72);
    pdf.save('session_report.pdf');
  }

exportXLSX(
  lines: Line[],
  totals: { qty: number; cost: number; gross: number; vat: number; profit: number },
  receipts?: Line[][]
) {
  if (lines.length === 0) {
    alert('No lines to export.');
    return;
  }

  // Main "Items" sheet
  const ws_data = [['#','Barcode','Product','Qty','Cost','Sell(Gross)','VAT','Net Profit','Payment','Phone']];
  lines.forEach((ln, idx) => ws_data.push([
    (idx+1).toString(),
    ln.barcode || '',
    ln.name,
    ln.qty.toString(),
    ln.cost.toFixed(2),
    ln.grossTotal.toFixed(2),
    ln.vatAmount.toFixed(2),
    ln.profit.toFixed(2),
    ln.payment,
    ln.phone
  ]));

  // Summary sheet
  const summary = [
    ['Total Lines', lines.length],
    ['Total Qty', totals.qty],
    ['Total Cost', totals.cost],
    ['Total Sales (Gross)', totals.gross.toFixed(2)],
    ['Total VAT', totals.vat.toFixed(2)],
    ['Net Profit', totals.profit.toFixed(2)]
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws_data), 'Items');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  // Receipts sheet (if provided)
  if (receipts && receipts.length) {
    const receiptSheet: any[][] = [];

    receipts.forEach((receipt, i) => {
      receiptSheet.push([`Receipt #${i + 1}`, `Customer: ${receipt[0]?.phone}`, `Payment: ${receipt[0]?.payment}`]);
      receiptSheet.push(['Product', 'Qty', 'Price', 'Total']);
      receipt.forEach(line => {
        receiptSheet.push([
          line.name,
          line.qty,
          line.price.toFixed(2),
          line.grossTotal.toFixed(2)
        ]);
      });
      receiptSheet.push(['', '', 'Receipt Total:', receipt.reduce((sum, l) => sum + l.grossTotal, 0).toFixed(2)]);
      receiptSheet.push([]); // blank row between receipts
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(receiptSheet), 'Receipts');
  }

  XLSX.writeFile(wb, 'session_report.xlsx');
}


 exportCSV(
  lines: Line[],
  totals: { qty: number; cost: number; gross: number; vat: number; profit: number },
  receipts?: Line[][]
) {
  if (lines.length === 0) {
    alert('No lines to export.');
    return;
  }

  let csv = '#,Barcode,Product,Qty,Cost,Sell(Gross),VAT,NetProfit,Payment,Phone\n';
  lines.forEach((ln, idx) => {
    const safe = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    csv += [
      idx + 1,
      safe(ln.barcode || ''),
      safe(ln.name),
      ln.qty,
      ln.cost.toFixed(2),
      ln.grossTotal.toFixed(2),
      ln.vatAmount.toFixed(2),
      ln.profit.toFixed(2),
      ln.payment,
      safe(ln.phone)
    ].join(',') + '\n';
  });

  csv += '\nTotals,,Qty:,' + totals.qty + ',,Cost:,' + totals.cost.toFixed(2) +
         ',Gross:,' + totals.gross.toFixed(2) + ',VAT:,' + totals.vat.toFixed(2) + 
         ',Profit:,' + totals.profit.toFixed(2) + '\n';

  // Receipt breakdowns
  if (receipts && receipts.length) {
    csv += '\n\n--- RECEIPTS ---\n';
    receipts.forEach((receipt, i) => {
      csv += `\nReceipt #${i + 1},Customer: ${receipt[0]?.phone},Payment: ${receipt[0]?.payment}\n`;
      csv += 'Product,Qty,Price,Total\n';
      receipt.forEach(line => {
        csv += [
          `"${line.name}"`,
          line.qty,
          line.price.toFixed(2),
          line.grossTotal.toFixed(2)
        ].join(',') + '\n';
      });
      csv += `,,Receipt Total:,${receipt.reduce((sum, l) => sum + l.grossTotal, 0).toFixed(2)}\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'session_report.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 300);
}

}
