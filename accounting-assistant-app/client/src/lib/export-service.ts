import * as XLSX from 'xlsx';
import { utils, write } from 'xlsx';
import * as Papa from 'papaparse';
import { Invoice, Payment, Report } from '@shared/schema';
import { invoiceToCSV, reportToCSV } from './pdf-service';

// Export data to Excel
export const exportToExcel = (data: any[][], filename: string) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export data to CSV
export const exportToCSV = (data: any[][], filename: string) => {
  // Convert array of arrays to CSV string
  const csv = Papa.unparse(data);
  
  // Create a blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export invoice to Excel
export const exportInvoiceToExcel = (invoice: Invoice, payments: Payment[] = []) => {
  const data = invoiceToCSV(invoice, payments);
  exportToExcel(data, `invoice_${invoice.id}`);
};

// Export invoice to CSV
export const exportInvoiceToCSV = (invoice: Invoice, payments: Payment[] = []) => {
  const data = invoiceToCSV(invoice, payments);
  exportToCSV(data, `invoice_${invoice.id}`);
};

// Export report to Excel
export const exportReportToExcel = (report: Report, reportData: any[] = []) => {
  const data = reportToCSV(report, reportData);
  exportToExcel(data, `report_${report.id}_${report.type}`);
};

// Export report to CSV
export const exportReportToCSV = (report: Report, reportData: any[] = []) => {
  const data = reportToCSV(report, reportData);
  exportToCSV(data, `report_${report.id}_${report.type}`);
};

// Generic data import from CSV
export const importFromCSV = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Generic data import from Excel
export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};

// Import invoices from CSV or Excel
export const importInvoices = async (file: File): Promise<Partial<Invoice>[]> => {
  try {
    let data: any[];
    
    if (file.name.endsWith('.csv')) {
      data = await importFromCSV(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      data = await importFromExcel(file);
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }
    
    // Map and validate the data
    return data.map(item => ({
      title: item.title || item.Title || '',
      clientName: item.clientName || item.client || item.Client || item.clientName || '',
      amount: (parseFloat(item.amount || item.Amount || '0')).toString(),
      date: new Date(item.date || item.Date || new Date()).toISOString(),
      status: (item.status || item.Status || 'pending') as 'paid' | 'pending' | 'overdue',
      userId: parseInt(item.userId || item.UserId || '1'),
    }));
  } catch (error) {
    console.error('Error importing invoices:', error);
    throw error;
  }
};

// Import payments from CSV or Excel
export const importPayments = async (file: File): Promise<Partial<Payment>[]> => {
  try {
    let data: any[];
    
    if (file.name.endsWith('.csv')) {
      data = await importFromCSV(file);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      data = await importFromExcel(file);
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }
    
    // Map and validate the data
    return data.map(item => ({
      invoiceId: parseInt(item.invoiceId || item.InvoiceId || '0'),
      amount: (parseFloat(item.amount || item.Amount || '0')).toString(),
      date: new Date(item.date || item.Date || new Date()).toISOString(),
      receiptGenerated: item.receiptGenerated === 'true' || item.receiptGenerated === true || item.ReceiptGenerated === 'true' || item.ReceiptGenerated === true,
      userId: parseInt(item.userId || item.UserId || '1'),
    }));
  } catch (error) {
    console.error('Error importing payments:', error);
    throw error;
  }
};