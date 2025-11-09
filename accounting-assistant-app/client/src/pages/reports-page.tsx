import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Invoice, Payment, Report } from "@shared/schema";
import {
  Download,
  FileText,
  BarChart3,
  PieChart,
  Loader2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsChart } from "@/components/reports/reports-chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateReportPdf } from "@/lib/pdf-service";
import { exportReportToExcel, exportReportToCSV } from "@/lib/export-service";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("monthly");
  const [reportPeriod, setReportPeriod] = useState("last_6_months");
  const [activeTab, setActiveTab] = useState("revenue");
  
  const { toast } = useToast();

  // Load invoices and payments data for report generation
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });
  
  const { data: reports, isLoading: isLoadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Mutation for generating a report
  const generateReportMutation = useMutation({
    mutationFn: async (reportData: {
      title: string;
      type: string;
    }) => {
      const res = await apiRequest("POST", "/api/reports", reportData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["/api/reports"]});
      toast({
        title: "Report generated",
        description: "Your report has been generated successfully and is ready to download.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate report: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Calculate data for charts based on invoices and payments
  const calculateReportData = () => {
    if (!invoices || !payments || isLoadingInvoices || isLoadingPayments) {
      return null;
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Determine how many months to include based on selected period
    let monthsCount = 6;
    if (reportPeriod === "last_3_months") monthsCount = 3;
    if (reportPeriod === "last_12_months") monthsCount = 12;
    
    // Get current date and calculate the start date based on period
    const currentDate = new Date();
    const startDate = new Date();
    startDate.setMonth(currentDate.getMonth() - (monthsCount - 1));
    
    // Initialize data arrays for charts
    const revenueData = [];
    const expenseData = []; // Simulated expenses for visualization
    
    // Create data points for each month in the period
    for (let i = 0; i < monthsCount; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      
      // Filter invoices for this month
      const monthInvoices = invoices.filter(invoice => {
        const invDate = new Date(invoice.date);
        return invDate.getMonth() === month && invDate.getFullYear() === year;
      });
      
      // Calculate total revenue for month
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      
      // Filter payments for this month
      const monthPayments = payments.filter(payment => {
        const payDate = new Date(payment.date);
        return payDate.getMonth() === month && payDate.getFullYear() === year;
      });
      
      // Calculate total payments for month
      const monthPaymentTotal = monthPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Simulate expenses (approximately 60-80% of revenue for realistic visualization)
      const randomFactor = 0.6 + Math.random() * 0.2;
      const simulatedExpenses = monthRevenue * randomFactor;
      
      // Add data point
      revenueData.push({
        name: months[month],
        revenue: monthRevenue.toFixed(2),
        expenses: simulatedExpenses.toFixed(2),
        payments: monthPaymentTotal.toFixed(2)
      });
    }
    
    return revenueData;
  };

  const reportData = calculateReportData();
  
  const handleGenerateReport = (type: string) => {
    generateReportMutation.mutate({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
      type
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-200">
        <div className="px-6 py-8 pt-24 md:pt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Financial Reports</h1>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Select
                value={reportPeriod}
                onValueChange={setReportPeriod}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                  <SelectItem value="yearly">Yearly Report</SelectItem>
                  <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                  <SelectItem value="income_statement">Income Statement</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => handleGenerateReport(reportType)}
                disabled={generateReportMutation.isPending}
              >
                {generateReportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(isLoadingInvoices || !invoices) 
                    ? "0.00" 
                    : invoices.reduce((sum, inv) => sum + Number(inv.amount), 0).toFixed(2)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  For the selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(isLoadingPayments || !payments) 
                    ? "0.00" 
                    : payments.reduce((sum, payment) => sum + Number(payment.amount), 0).toFixed(2)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  For the selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(isLoadingInvoices || isLoadingPayments || !invoices || !payments) 
                    ? "0.00" 
                    : (
                        invoices.reduce((sum, inv) => sum + Number(inv.amount), 0) - 
                        payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
                      ).toFixed(2)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount yet to be collected
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
                <CalculatorIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(isLoadingInvoices || !invoices || invoices.length === 0) 
                    ? "0.00" 
                    : (invoices.reduce((sum, inv) => sum + Number(inv.amount), 0) / invoices.length).toFixed(2)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Per invoice average
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Chart reports */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card className="col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Financial Analysis</CardTitle>
                  <CardDescription>
                    {activeTab === "revenue" 
                      ? "Monthly revenue and expenses comparison" 
                      : "Payment distribution by status"
                    }
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="revenue" className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2" /> Revenue
                    </TabsTrigger>
                    <TabsTrigger value="paymentsSummary" className="flex items-center">
                      <PieChart className="h-4 w-4 mr-2" /> Payments
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="h-[400px] w-full">
                    <TabsContent value="revenue" className="mt-0 h-full">
                      {isLoadingInvoices || isLoadingPayments ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <ReportsChart data={reportData || []} type="bar" />
                      )}
                    </TabsContent>
                    
                    <TabsContent value="paymentsSummary" className="mt-0 h-full">
                      {isLoadingInvoices || isLoadingPayments ? (
                        <div className="h-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <ReportsChart data={reportData || []} type="pie" />
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Generated Reports */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Recently Generated Reports</h3>
            
            {isLoadingReports ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !reports || reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No reports generated yet.</p>
                <p className="text-sm">Generate a report using the options above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {reports.map(report => (
                  <ReportCard
                    key={report.id}
                    title={report.title}
                    date={new Date(report.generatedAt).toLocaleDateString()}
                    type={report.type}
                    id={report.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ReportCard({ title, date, type, id }: { title: string; date: string; type: string; id: number }) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setIsDownloading(true);
      
      // Fetch report data
      const res = await apiRequest("GET", `/api/reports/${id}`);
      if (!res.ok) throw new Error('Failed to fetch report data');
      const reportData = await res.json();
      
      // Create report object
      const report: Report = {
        id,
        title,
        type: type as "monthly" | "yearly" | "balance_sheet" | "income_statement",
        generatedAt: new Date(date),
        userId: 1 // This will be set by the server
      };

      switch (format) {
        case 'pdf':
          const doc = await generateReportPdf(report, reportData.data);
          doc.save(`report_${id}.pdf`);
          break;
        case 'excel':
          exportReportToExcel(report, reportData.data);
          break;
        case 'csv':
          exportReportToCSV(report, reportData.data);
          break;
      }

      toast({
        title: "Download started",
        description: `Your report is being downloaded in ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download report",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case "monthly":
      case "yearly":
        return <Calendar className="h-4 w-4" />;
      case "balance_sheet":
        return <FileText className="h-4 w-4" />;
      case "income_statement":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="bg-primary/10 p-2 rounded-md">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 mt-1">Generated on {date}</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                <Download className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Download Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p>Select format to download {title}</p>
                <div className="flex justify-between gap-4">
                  <Button 
                    className="flex-1" 
                    variant="outline" 
                    onClick={() => handleDownload('pdf')}
                    disabled={isDownloading}
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'PDF'}
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => handleDownload('excel')}
                    disabled={isDownloading}
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excel'}
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => handleDownload('csv')}
                    disabled={isDownloading}
                  >
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CSV'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CalculatorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}
