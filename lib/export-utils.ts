import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export async function exportToPDF(data: any[], columns: string[], title: string) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  // Add timestamp
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

  // Convert data to format expected by autotable
  const tableData = data.map(item => columns.map(col => item[col]));

  // Add table
  doc.autoTable({
    head: [columns],
    body: tableData,
    startY: 35,
  });

  // Save the PDF
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}

export async function exportToExcel(data: any[], filename: string) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.xlsx`);
}

export async function exportToCSV(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  link.href = URL.createObjectURL(blob);
  link.download = `${filename.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.csv`;
  link.click();
}