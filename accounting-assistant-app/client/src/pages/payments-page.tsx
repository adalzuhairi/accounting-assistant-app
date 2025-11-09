import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentForm } from "@/components/payments/payment-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Payment, Invoice } from "@shared/schema";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Loader2,
  Receipt
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PaymentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payments/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({queryKey: ["/api/payments"]});
      queryClient.invalidateQueries({queryKey: ["/api/invoices"]});
      queryClient.invalidateQueries({queryKey: ["/api/dashboard"]});
      toast({
        title: "Payment deleted",
        description: `Payment #${id} has been deleted successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const generateReceiptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/payments/${id}`, { receiptGenerated: true });
      return await res.json();
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({queryKey: ["/api/payments"]});
      toast({
        title: "Receipt generated",
        description: `Receipt for payment #${payment.id} has been generated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate receipt: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getInvoiceDetails = (invoiceId: number) => {
    return invoices?.find(invoice => invoice.id === invoiceId);
  };

  const filteredPayments = payments
    ? payments
        .filter((payment) => {
          // Apply search term
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const invoice = getInvoiceDetails(payment.invoiceId);
            return (
              payment.id.toString().includes(searchLower) ||
              payment.invoiceId.toString().includes(searchLower) ||
              (invoice && invoice.clientName.toLowerCase().includes(searchLower))
            );
          }
          
          return true;
        })
        // Apply sorting
        .sort((a, b) => {
          if (sortField === "date") {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
          } else if (sortField === "amount") {
            const amountA = Number(a.amount);
            const amountB = Number(b.amount);
            return sortDirection === "asc" ? amountA - amountB : amountB - amountA;
          } else if (sortField === "invoiceId") {
            return sortDirection === "asc"
              ? a.invoiceId - b.invoiceId
              : b.invoiceId - a.invoiceId;
          } else {
            return 0;
          }
        })
    : [];

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-200">
        <div className="px-6 py-8 pt-24 md:pt-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-4 w-4" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search payments..." 
                  className="pl-10 pr-4 py-2 w-full" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    New Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPayment ? "Edit Payment" : "Record New Payment"}
                    </DialogTitle>
                  </DialogHeader>
                  <PaymentForm 
                    payment={editingPayment}
                    onSuccess={() => {
                      setIsCreateDialogOpen(false);
                      setEditingPayment(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment #
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("invoiceId")}
                    >
                      <div className="flex items-center">
                        Invoice #
                        {sortField === "invoiceId" && (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Date
                        {sortField === "date" && (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center">
                        Amount
                        {sortField === "amount" && (
                          sortDirection === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => {
                      const invoice = getInvoiceDetails(payment.invoiceId);
                      return (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{payment.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{payment.invoiceId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice ? invoice.clientName : "Unknown Client"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${Number(payment.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.receiptGenerated ? (
                              <span className="text-green-600 flex items-center">
                                <Receipt className="h-4 w-4 mr-1" /> Generated
                              </span>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generateReceiptMutation.mutate(payment.id)}
                                disabled={generateReceiptMutation.isPending}
                              >
                                {generateReceiptMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Receipt className="h-4 w-4 mr-1" /> Generate
                                  </>
                                )}
                              </Button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Payment #{payment.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div className="font-medium">Payment ID</div>
                                      <div className="col-span-2">#{payment.id}</div>
                                      
                                      <div className="font-medium">Invoice</div>
                                      <div className="col-span-2">#{payment.invoiceId}</div>
                                      
                                      <div className="font-medium">Client</div>
                                      <div className="col-span-2">{invoice ? invoice.clientName : "Unknown Client"}</div>
                                      
                                      <div className="font-medium">Amount</div>
                                      <div className="col-span-2">${Number(payment.amount).toFixed(2)}</div>
                                      
                                      <div className="font-medium">Date</div>
                                      <div className="col-span-2">{new Date(payment.date).toLocaleDateString()}</div>
                                      
                                      <div className="font-medium">Receipt</div>
                                      <div className="col-span-2">
                                        {payment.receiptGenerated ? (
                                          <span className="text-green-600 flex items-center">
                                            <Receipt className="h-4 w-4 mr-1" /> Generated
                                          </span>
                                        ) : (
                                          <span className="text-gray-500">Not generated</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => handleEdit(payment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete payment #{payment.id} for Invoice #{payment.invoiceId}? 
                                      This action cannot be undone and may change the invoice status.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePaymentMutation.mutate(payment.id)}
                                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                    >
                                      {deletePaymentMutation.isPending ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        "Delete"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              
                              {payment.receiptGenerated && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-sm">
                                    <DialogHeader>
                                      <DialogTitle>Download Receipt</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      <p>Select format to download receipt for Payment #{payment.id}</p>
                                      <div className="flex justify-between gap-4">
                                        <Button className="flex-1" variant="outline">PDF</Button>
                                        <Button className="flex-1" variant="outline">Excel</Button>
                                        <Button className="flex-1" variant="outline">CSV</Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
