import {
  ApplicationRef,
  Injectable,
  Injector,
} from '@angular/core';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Line } from '..//models/line.model';
import autoTable from 'jspdf-autotable'; // ✅ NEW
@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private appRef: ApplicationRef, private injector: Injector) { }

  private round(v: number) {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  // ✅ EXPORT PDF (Using SaleTableComponent with Signal Inputs)

  async exportSalesTablePDF(lines: Line[]) {
    if (!lines.length) {
      alert('No lines to export.');
      return;
    }

    const doc = new jsPDF('landscape');

    // ✅ Table Header
    const headers = [[
      '#', 'Barcode', 'Product', 'Qty', 'Cost', 'Sell (Gross)', 'VAT (15% incl)',
      'Net Profit', 'Payment', 'Phone'
    ]];

    // ✅ Table Body
    const rows = lines.map((line, index) => ([
      index + 1,
      line.barcode || '',
      line.name,
      line.qty,
      `SAR ${line.cost.toFixed(2)}`,
      `SAR ${line.grossTotal.toFixed(2)}`,
      `SAR ${line.vatAmount.toFixed(2)}`,
      `SAR ${line.profit.toFixed(2)}`,
      line.payment,
      line.phone || ''
    ]));

    // ✅ Render table
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 123, 255] }, // Optional: Blue header
      theme: 'grid',
    });

    // ✅ Summary section
    const totalQty = lines.reduce((s, l) => s + l.qty, 0);
    const totalCost = lines.reduce((s, l) => s + l.cost * l.qty, 0);
    const totalGross = lines.reduce((s, l) => s + l.grossTotal, 0);
    const totalVAT = lines.reduce((s, l) => s + l.vatAmount, 0);
    const totalProfit = lines.reduce((s, l) => s + l.profit, 0);

    const finalY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(9); // ✅ Smaller font

    const summary = [
      `Total Qty: ${totalQty}`,
      `Total Cost: SAR ${totalCost.toFixed(2)}`,
      `Gross Sales: SAR ${totalGross.toFixed(2)}`,
      `VAT: SAR ${totalVAT.toFixed(2)}`,
      `Net Profit: SAR ${totalProfit.toFixed(2)}`
    ];

    // ✅ Spacing & alignment
    let x = 15;
    const y = finalY + 10;

    summary.forEach(text => {
      doc.text(text, x, y);
      x += doc.getTextWidth(text) + 20; // space between items
    });


    // ✅ Save PDF
    doc.save('sales_table.pdf');
  }



  exportXLSX(
    lines: Line[],
    totals: { qty: number; cost: number; gross: number; vat: number; profit: number },
    receipts?: Line[][]
  ) {
    if (!lines.length) {
      alert('No lines to export.');
      return;
    }

    const ws_data = [['#', 'Barcode', 'Product', 'Qty', 'Cost', 'Sell(Gross)', 'VAT', 'Net Profit', 'Payment', 'Phone']];
    lines.forEach((ln, idx) => ws_data.push([
      (idx + 1).toString(),
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

    if (receipts?.length) {
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
        receiptSheet.push([]);
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
    if (!lines.length) {
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

    if (receipts?.length) {
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
