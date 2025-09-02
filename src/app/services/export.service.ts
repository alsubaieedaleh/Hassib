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

  exportXLSX(lines: Line[], totals: { qty: number; gross: number; vat: number; profit: number }) {
    if (lines.length === 0) {
      alert('No lines to export.');
      return;
    }
    const ws_data = [['#','Barcode','Product','Qty','Cost','Sell(Gross)','VAT','Net Profit','Payment','Phone']];
    lines.forEach((ln, idx) => ws_data.push([
      (idx+1).toString(),
      ln.barcode||'',
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
      ['Total Sales (Gross)', totals.gross.toFixed(2)],
      ['Total VAT', totals.vat.toFixed(2)],
      ['Net Profit', totals.profit.toFixed(2)]
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ws_data), 'Items');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    XLSX.writeFile(wb, 'session_report.xlsx');
  }

  exportCSV(lines: Line[], totals: { qty: number; gross: number; vat: number; profit: number }) {
    if (lines.length === 0) {
      alert('No lines to export.');
      return;
    }
    let csv = '#,Barcode,Product,Qty,Cost,Sell(Gross),VAT,NetProfit,Payment,Phone\n';
    lines.forEach((ln, idx) => {
      const safe = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
      csv += [
        idx+1, safe(ln.barcode||''), safe(ln.name), ln.qty,
        ln.cost.toFixed(2), ln.grossTotal.toFixed(2), ln.vatAmount.toFixed(2),
        ln.profit.toFixed(2), ln.payment, safe(ln.phone)
      ].join(',') + '\n';
    });
    csv += '\nTotals,,'+totals.qty+',,'+totals.gross.toFixed(2)+','+totals.vat.toFixed(2)+','+totals.profit.toFixed(2)+'\n';
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
