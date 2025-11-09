import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { Invoice, Payment, Report } from '@shared/schema';

// Initialize autoTable plugin
(jsPDF as any).API.autoTable = autoTable;

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Helper to convert an HTML element to an image for embedding in PDF
export const elementToImage = async (element: HTMLElement): Promise<string> => {
  try {
    return await toPng(element);
  } catch (error) {
    console.error('Error generating image from element:', error);
    throw error;
  }
};

interface InvoicePdfOptions {
  includePayments?: boolean;
  includeLogo?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

// Generate invoice PDF
export const generateInvoicePdf = (invoice: Invoice, payments: Payment[] = [], options: InvoicePdfOptions = {}) => {
  const {
    includePayments = true,
    includeLogo = true,
    includeHeader = true,
    includeFooter = true
  } = options;

  const doc = new jsPDF();
  
  // Add header
  if (includeHeader) {
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 128);
    doc.text('Accounting Assistant', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 105, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
  }

  // Invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.id}`, 20, 50);
  doc.text(`Title: ${invoice.title}`, 20, 60);
  doc.text(`Client: ${invoice.clientName}`, 20, 70);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 20, 80);
  doc.text(`Status: ${invoice.status}`, 20, 90);
  doc.text(`Amount: $${Number(invoice.amount).toFixed(2)}`, 20, 100);

  // Add payments if requested
  if (includePayments && payments.length > 0) {
    doc.text('Payment History', 20, 120);
    
    const tableColumn = ["ID", "Date", "Amount", "Receipt"];
    const tableRows: any[] = [];

    payments.forEach(payment => {
      const paymentData = [
        payment.id,
        new Date(payment.date).toLocaleDateString(),
        `$${Number(payment.amount).toFixed(2)}`,
        payment.receiptGenerated ? "Yes" : "No"
      ];
      tableRows.push(paymentData);
    });

    doc.autoTable({
      startY: 125,
      head: [tableColumn],
      body: tableRows,
    });
  }

  // Add footer
  if (includeFooter) {
    const pageCount = doc.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount} - Generated on ${new Date().toLocaleString()}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  }

  return doc;
};

interface ReportPdfOptions {
  includeCharts?: boolean;
  includeLogo?: boolean;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

// Generate report PDF
export const generateReportPdf = async (
  report: Report, 
  reportData: any[] = [],
  chartElement?: HTMLElement | null,
  options: ReportPdfOptions = {}
) => {
  try {
    console.log('Starting PDF generation...');
    const doc = new jsPDF();
    console.log('PDF document created');

    // Basic document setup
    doc.setFont('helvetica');
    doc.setFontSize(12);
    console.log('Font initialized');

    // Add cover page
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 128);
    doc.text('Accounting Assistant', 105, 30, { align: 'center' });
    console.log('Cover page title added');

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(report.title, 105, 45, { align: 'center' });
    console.log('Report title added');

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date(report.generatedAt).toLocaleDateString()}`, 105, 55, { align: 'center' });
    doc.text(`Report Type: ${report.type.replace('_', ' ').toUpperCase()}`, 105, 65, { align: 'center' });
    console.log('Cover page metadata added');

    // Add basic financial summary
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Financial Summary', 20, 20);
    console.log('Summary page added');

    // Add a simple table with the data
    try {
      console.log('Attempting to add table...');
      const tableData = reportData.map(item => [
        item.name || item.description || 'N/A',
        `$${Number(item.amount || item.revenue || 0).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 30,
        head: [['Description', 'Amount']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: {
          1: { halign: 'right' }
        }
      });
      console.log('Table added successfully');
    } catch (tableError) {
      console.error('Error adding table:', tableError);
      // Fallback to simple text if table fails
      doc.setFontSize(12);
      doc.text('Financial data could not be displayed in table format.', 20, 30);
    }

    // Add footer
    const pageCount = doc.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    console.log('Footer added');

    console.log('PDF generation completed successfully');
    return doc;
  } catch (error: any) {
    console.error('Detailed PDF generation error:', error);
    throw new Error(`Failed to generate PDF report: ${error?.message || 'Unknown error'}`);
  }
};

// Export PDF functions
export const exportPdf = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};

// Convert invoice to CSV data
export const invoiceToCSV = (invoice: Invoice, payments: Payment[] = []) => {
  const invoiceData = [
    ['Invoice ID', 'Title', 'Client', 'Amount', 'Date', 'Status'],
    [invoice.id, invoice.title, invoice.clientName, invoice.amount, new Date(invoice.date).toLocaleDateString(), invoice.status]
  ];
  
  if (payments.length > 0) {
    invoiceData.push([]);
    invoiceData.push(['Payment ID', 'Date', 'Amount', 'Receipt Generated']);
    payments.forEach(payment => {
      invoiceData.push([
        payment.id, 
        new Date(payment.date).toLocaleDateString(), 
        payment.amount, 
        payment.receiptGenerated ? 'Yes' : 'No'
      ]);
    });
  }
  
  return invoiceData;
};

// Convert report data to CSV
export const reportToCSV = (report: Report, reportData: any[] = []) => {
  const headerData = [
    ['Report ID', 'Title', 'Type', 'Generated At'],
    [report.id, report.title, report.type, new Date(report.generatedAt).toLocaleDateString()]
  ];
  
  if (reportData.length > 0) {
    headerData.push([]);
    const dataHeaders = Object.keys(reportData[0]);
    headerData.push(dataHeaders);
    
    reportData.forEach(item => {
      headerData.push(Object.values(item));
    });
  }
  
  return headerData;
};