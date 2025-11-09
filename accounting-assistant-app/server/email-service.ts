import { MailService } from '@sendgrid/mail';
import { Invoice, Payment, User, Report } from '@shared/schema';

// Check SendGrid configuration on startup
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found. Email functionality will not work.');
} else {
  console.log('SendGrid API key is configured. Email service is ready.');
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Sender email
const FROM_EMAIL = 'adalzuhairi@gmail.com';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }[];
  from?: string;
}

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Email not sent: SENDGRID_API_KEY not configured.');
    return false;
  }

  try {
    const { to, subject, text, html, attachments, from = FROM_EMAIL } = options;
    
    console.log(`Attempting to send email to ${to} from ${from}`);
    
    await mailService.send({
      to,
      from,
      subject,
      text: text || '',
      html: html || '',
      attachments,
    });
    
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', {
      error: error?.message || 'Unknown error',
      code: error?.code,
      response: error?.response?.body,
      to: options.to,
      from: options.from || FROM_EMAIL,
      subject: options.subject
    });
    return false;
  }
};

// Format currency for email
const formatCurrency = (amount: number | string): string => {
  return `$${Number(amount).toFixed(2)}`;
};

// Send invoice notification to client
export const sendInvoiceNotification = async (
  invoice: Invoice, 
  user: User, 
  clientEmail: string,
  pdfBuffer?: Buffer
): Promise<boolean> => {
  const subject = `Invoice #${invoice.id} from ${user.name}`;
  
  const text = `
    Dear ${invoice.clientName},
    
    Please find attached your invoice #${invoice.id}.
    
    Invoice Details:
    - Invoice #: ${invoice.id}
    - Title: ${invoice.title}
    - Amount: ${formatCurrency(invoice.amount)}
    - Date: ${new Date(invoice.date).toLocaleDateString()}
    - Status: ${invoice.status}
    
    Thank you for your trust.
    
    Best regards,
    ${user.name}
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invoice Notification</h2>
      <p>Dear ${invoice.clientName},</p>
      
      <p>Please find attached your invoice #${invoice.id}.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Invoice Details:</h3>
        <p><strong>Invoice #:</strong> ${invoice.id}</p>
        <p><strong>Title:</strong> ${invoice.title}</p>
        <p><strong>Amount:</strong> ${formatCurrency(invoice.amount)}</p>
        <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span style="text-transform: capitalize;">${invoice.status}</span></p>
      </div>
      
      <p>Thank you for your trust.</p>
      
      <p>Best regards,<br>${user.name}</p>
      
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
  
  const attachments = pdfBuffer ? [{
    content: pdfBuffer.toString('base64'),
    filename: `invoice_${invoice.id}.pdf`,
    type: 'application/pdf',
    disposition: 'attachment'
  }] : undefined;
  
  return sendEmail({
    to: clientEmail,
    subject,
    text,
    html,
    attachments
  });
};

// Send payment receipt to client
export const sendPaymentReceiptNotification = async (
  payment: Payment,
  invoice: Invoice,
  user: User,
  clientEmail: string
): Promise<boolean> => {
  const subject = `Payment Receipt for Invoice #${invoice.id}`;
  
  const text = `
    Dear ${invoice.clientName},
    
    Thank you for your payment. This email serves as a receipt for your recent payment.
    
    Payment Details:
    - Payment #: ${payment.id}
    - Invoice #: ${invoice.id}
    - Amount Paid: ${formatCurrency(payment.amount)}
    - Date Paid: ${new Date(payment.date).toLocaleDateString()}
    
    Invoice Details:
    - Title: ${invoice.title}
    - Total Amount: ${formatCurrency(invoice.amount)}
    - Date: ${new Date(invoice.date).toLocaleDateString()}
    - Status: ${invoice.status}
    
    Thank you for your business.
    
    Best regards,
    ${user.name}
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Receipt</h2>
      <p>Dear ${invoice.clientName},</p>
      
      <p>Thank you for your payment. This email serves as a receipt for your recent payment.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Payment Details:</h3>
        <p><strong>Payment #:</strong> ${payment.id}</p>
        <p><strong>Invoice #:</strong> ${invoice.id}</p>
        <p><strong>Amount Paid:</strong> ${formatCurrency(payment.amount)}</p>
        <p><strong>Date Paid:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
      </div>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Invoice Details:</h3>
        <p><strong>Title:</strong> ${invoice.title}</p>
        <p><strong>Total Amount:</strong> ${formatCurrency(invoice.amount)}</p>
        <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
        <p><strong>Status:</strong> <span style="text-transform: capitalize;">${invoice.status}</span></p>
      </div>
      
      <p>Thank you for your business.</p>
      
      <p>Best regards,<br>${user.name}</p>
      
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
  
  return sendEmail({
    to: clientEmail,
    subject,
    text,
    html,
  });
};

// Send payment reminder to client
export const sendPaymentReminderNotification = async (
  invoice: Invoice,
  user: User,
  clientEmail: string,
  daysOverdue: number
): Promise<boolean> => {
  const subject = `Payment Reminder: Invoice #${invoice.id} is ${daysOverdue} days overdue`;
  
  const text = `
    Dear ${invoice.clientName},
    
    We hope this email finds you well. This is a friendly reminder that the payment for invoice #${invoice.id} is overdue by ${daysOverdue} days.
    
    Invoice Details:
    - Invoice #: ${invoice.id}
    - Title: ${invoice.title}
    - Amount: ${formatCurrency(invoice.amount)}
    - Due Date: ${new Date(invoice.date).toLocaleDateString()}
    - Days Overdue: ${daysOverdue}
    
    Please remit payment at your earliest convenience. If you have any questions or if you have already made the payment, please disregard this reminder.
    
    Thank you for your prompt attention to this matter.
    
    Best regards,
    ${user.name}
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Reminder</h2>
      <p>Dear ${invoice.clientName},</p>
      
      <p>We hope this email finds you well. This is a friendly reminder that the payment for invoice #${invoice.id} is overdue by ${daysOverdue} days.</p>
      
      <div style="background-color: #fff3f3; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
        <h3 style="margin-top: 0; color: #e74c3c;">Invoice Details:</h3>
        <p><strong>Invoice #:</strong> ${invoice.id}</p>
        <p><strong>Title:</strong> ${invoice.title}</p>
        <p><strong>Amount:</strong> ${formatCurrency(invoice.amount)}</p>
        <p><strong>Due Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
        <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
      </div>
      
      <p>Please remit payment at your earliest convenience. If you have any questions or if you have already made the payment, please disregard this reminder.</p>
      
      <p>Thank you for your prompt attention to this matter.</p>
      
      <p>Best regards,<br>${user.name}</p>
      
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
  
  return sendEmail({
    to: clientEmail,
    subject,
    text,
    html,
  });
};

// Send report notification to team member
export const sendReportNotification = async (
  report: Report,
  user: User,
  recipientEmail: string
): Promise<boolean> => {
  const subject = `New Report Generated: ${report.title}`;
  
  const text = `
    Hello,
    
    A new financial report has been generated by ${user.name}.
    
    Report Details:
    - Report ID: ${report.id}
    - Title: ${report.title}
    - Type: ${report.type}
    - Generated At: ${new Date(report.generatedAt).toLocaleDateString()}
    
    You can view the full report by logging into the Accounting Assistant Application.
    
    Best regards,
    Accounting Assistant
  `;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Report Generated</h2>
      <p>Hello,</p>
      
      <p>A new financial report has been generated by ${user.name}.</p>
      
      <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3498db;">
        <h3 style="margin-top: 0; color: #3498db;">Report Details:</h3>
        <p><strong>Report ID:</strong> ${report.id}</p>
        <p><strong>Title:</strong> ${report.title}</p>
        <p><strong>Type:</strong> ${report.type}</p>
        <p><strong>Generated At:</strong> ${new Date(report.generatedAt).toLocaleDateString()}</p>
      </div>
      
      <p>You can view the full report by logging into the Accounting Assistant Application.</p>
      
      <p>Best regards,<br>Accounting Assistant</p>
      
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">This is an automated email. Please do not reply to this message.</p>
    </div>
  `;
  
  return sendEmail({
    to: recipientEmail,
    subject,
    text,
    html,
  });
};