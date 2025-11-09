import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { 
  insertInvoiceSchema, 
  insertPaymentSchema, 
  insertReportSchema, 
  insertUserSchema,
  insertClientSchema 
} from "@shared/schema";
import { sendInvoiceNotification } from "./email-service";
import { generateInvoicePdf } from "../client/src/lib/pdf-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Invoice routes
  app.get("/api/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user?.role === "admin" ? undefined : req.user?.id;
      const invoices = await storage.getInvoices(userId);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invoice = await storage.getInvoice(Number(req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if user has access to this invoice
      if (req.user?.role !== "admin" && invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const parsedData = insertInvoiceSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid invoice data", 
          errors: parsedData.error.errors 
        });
      }
      
      // Create the invoice
      const invoice = await storage.createInvoice(parsedData.data);
      
      // Get client email from the database
      if (!invoice.clientId) {
        console.warn('No client ID found for invoice');
        return res.status(201).json(invoice);
      }
      const client = await storage.getClient(invoice.clientId);
      if (!client?.email) {
        console.warn(`No email found for client ${invoice.clientName}`);
        return res.status(201).json(invoice);
      }

      try {
        // Generate PDF
        const pdfDoc = generateInvoicePdf(invoice);
        const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

        // Send email with PDF attachment
        const emailSent = await sendInvoiceNotification(
          invoice,
          req.user,
          client.email,
          pdfBuffer
        );

        if (!emailSent) {
          console.error(`Failed to send email to ${client.email}`);
        }
      } catch (error) {
        console.error('Error generating PDF or sending email:', error);
        // Continue with the response even if email fails
      }
      
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invoice = await storage.getInvoice(Number(req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if user has access to update this invoice
      if (req.user?.role !== "admin" && invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate update data
      const parsedData = insertInvoiceSchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid invoice data", 
          errors: parsedData.error.errors 
        });
      }
      
      const updatedInvoice = await storage.updateInvoice(
        Number(req.params.id),
        parsedData.data
      );
      
      res.json(updatedInvoice);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invoice = await storage.getInvoice(Number(req.params.id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if user has access to delete this invoice
      if (req.user?.role !== "admin" && invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteInvoice(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user?.role === "admin" ? undefined : req.user?.id;
      const payments = await storage.getPayments(userId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/payments/invoice/:invoiceId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const invoiceId = Number(req.params.invoiceId);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Check if user has access to this invoice's payments
      if (req.user?.role !== "admin" && invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const payments = await storage.getPaymentsByInvoice(invoiceId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/payments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const payment = await storage.getPayment(Number(req.params.id));
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if user has access to this payment
      if (req.user?.role !== "admin" && payment.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(payment);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/payments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Verify invoice exists and user has access
      const invoice = await storage.getInvoice(req.body.invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      if (req.user?.role !== "admin" && invoice.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied to this invoice" });
      }
      
      const parsedData = insertPaymentSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid payment data", 
          errors: parsedData.error.errors 
        });
      }
      
      const payment = await storage.createPayment(parsedData.data);
      
      // Update invoice status if payment covers the full amount
      const invoicePayments = await storage.getPaymentsByInvoice(invoice.id);
      const totalPaid = [...invoicePayments, payment].reduce(
        (sum, p) => sum + Number(p.amount), 
        0
      );
      
      if (totalPaid >= Number(invoice.amount) && invoice.status !== "paid") {
        await storage.updateInvoice(invoice.id, { status: "paid" });
      }
      
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/payments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const payment = await storage.getPayment(Number(req.params.id));
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if user has access to update this payment
      if (req.user?.role !== "admin" && payment.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate update data
      const parsedData = insertPaymentSchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid payment data", 
          errors: parsedData.error.errors 
        });
      }
      
      const updatedPayment = await storage.updatePayment(
        Number(req.params.id),
        parsedData.data
      );
      
      res.json(updatedPayment);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/payments/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const payment = await storage.getPayment(Number(req.params.id));
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      // Check if user has access to delete this payment
      if (req.user?.role !== "admin" && payment.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deletePayment(Number(req.params.id));
      
      // Update invoice status if needed
      const invoice = await storage.getInvoice(payment.invoiceId);
      if (invoice && invoice.status === "paid") {
        const remainingPayments = await storage.getPaymentsByInvoice(invoice.id);
        const totalPaid = remainingPayments.reduce(
          (sum, p) => sum + Number(p.amount), 
          0
        );
        
        if (totalPaid < Number(invoice.amount)) {
          await storage.updateInvoice(invoice.id, { status: "pending" });
        }
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Reports routes
  app.get("/api/reports", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user?.role === "admin" ? undefined : req.user?.id;
      const reports = await storage.getReports(userId);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const report = await storage.getReport(Number(req.params.id));
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      // Check if user has access to this report
      if (req.user?.role !== "admin" && report.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/reports", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const parsedData = insertReportSchema.safeParse({
        ...req.body,
        userId: req.user.id,
        generatedAt: new Date()
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid report data", 
          errors: parsedData.error.errors 
        });
      }
      
      const report = await storage.createReport(parsedData.data);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  });

  // User Management Routes (Admin only)
  app.get("/api/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only administrators can view all users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const users = await storage.getAllUsers();
      
      // Don't expose passwords in the API response
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/admin/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only administrators can create users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const parsedData = insertUserSchema.safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: parsedData.error.errors 
        });
      }
      
      // Hash password before storing (using auth.ts utility function)
      const hashedPassword = await hashPassword(parsedData.data.password);
      const user = await storage.createUser({
        ...parsedData.data,
        password: hashedPassword
      });
      
      // Don't expose password in the response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/admin/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only administrators can update users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate update data (excluding password which should be handled separately)
      const parsedData = insertUserSchema.partial().omit({ password: true }).safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: parsedData.error.errors 
        });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, parsedData.data);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Don't expose password in the response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/admin/users/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Only administrators can delete users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      
      const userId = Number(req.params.id);
      
      // Prevent self-deletion
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Data for dashboard
  app.get("/api/dashboard", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user?.role === "admin" ? undefined : req.user?.id;
      const invoices = await storage.getInvoices(userId);
      const payments = await storage.getPayments(userId);
      
      // Calculate total revenue, pending invoices, total payments, outstanding balance
      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const pendingInvoices = invoices.filter(inv => inv.status === "pending").length;
      const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const outstandingBalance = totalRevenue - totalPayments;
      
      // Get recent activity (combine recent invoices and payments)
      const recentInvoices = invoices
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
        
      res.json({
        stats: {
          totalRevenue,
          pendingInvoices,
          totalPayments,
          outstandingBalance
        },
        recentInvoices
      });
    } catch (error) {
      next(error);
    }
  });

  // Create HTTP server instance
  // Client Management Routes
  app.get("/api/clients", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user?.role === "admin" ? undefined : req.user?.id;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/clients/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const client = await storage.getClient(Number(req.params.id));
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if user has access to this client
      if (req.user?.role !== "admin" && client.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(client);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/clients/:id/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const clientId = Number(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if user has access to this client's invoices
      if (req.user?.role !== "admin" && client.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const invoices = await storage.getInvoicesByClient(clientId);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/clients", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const parsedData = insertClientSchema.safeParse({
        ...req.body,
        userId: req.user.id
      });
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid client data", 
          errors: parsedData.error.errors 
        });
      }

      // Check if client with same name already exists
      const existingClient = await storage.getClientByName(parsedData.data.name);
      if (existingClient) {
        return res.status(409).json({ 
          message: "Client already exists",
          existingClient
        });
      }
      
      const client = await storage.createClient(parsedData.data);
      res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/clients/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const client = await storage.getClient(Number(req.params.id));
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if user has access to update this client
      if (req.user?.role !== "admin" && client.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate update data
      const parsedData = insertClientSchema.partial().safeParse(req.body);
      
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid client data", 
          errors: parsedData.error.errors 
        });
      }
      
      const updatedClient = await storage.updateClient(
        Number(req.params.id),
        parsedData.data
      );
      
      res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/clients/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const client = await storage.getClient(Number(req.params.id));
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Check if user has access to delete this client
      if (req.user?.role !== "admin" && client.userId !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if client has any invoices
      const clientInvoices = await storage.getInvoicesByClient(client.id);
      if (clientInvoices.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete client with existing invoices. Delete client invoices first." 
        });
      }
      
      await storage.deleteClient(Number(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
