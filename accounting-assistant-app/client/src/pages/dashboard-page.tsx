import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  File, 
  CreditCard, 
  AlertTriangle,
  Plus, 
  Search,
  Eye,
  Edit,
  Download,
  FileDown
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState("30");
  const [location, setLocation] = useLocation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Define types for dashboard data
  interface Invoice {
    id: number;
    title: string;
    clientName: string;
    amount: string | number;
    date: string;
    status: string;
    userId: number;
  }
  
  interface DashboardData {
    stats: {
      totalRevenue: number;
      pendingInvoices: number;
      totalPayments: number;
      outstandingBalance: number;
    };
    recentInvoices: Invoice[];
  }
  
  // Filter invoices based on search term
  const filteredInvoices = dashboardData 
    ? (dashboardData as DashboardData).recentInvoices.filter(invoice => 
        invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toString().includes(searchTerm) ||
        Number(invoice.amount).toFixed(2).includes(searchTerm)
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <main className="flex-1 ml-0 md:ml-64 transition-all duration-200">
        <div className="px-6 py-8 pt-24 md:pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <div className="flex space-x-2">
              <div className="relative hidden sm:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400 h-4 w-4" />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 w-64" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link href="/invoices?new=true">
                <Button className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Revenue"
              value={(dashboardData as DashboardData)?.stats?.totalRevenue ?? 0}
              change={12.5}
              icon={<DollarSign className="h-5 w-5" />}
              color="primary"
            />
            
            <StatsCard
              title="Pending Invoices"
              value={(dashboardData as DashboardData)?.stats?.pendingInvoices ?? 0}
              change={4.3}
              icon={<File className="h-5 w-5" />}
              color="secondary"
              valuePrefix=""
              negative
            />
            
            <StatsCard
              title="Total Payments"
              value={(dashboardData as DashboardData)?.stats?.totalPayments ?? 0}
              change={8.2}
              icon={<CreditCard className="h-5 w-5" />}
              color="accent"
            />
            
            <StatsCard
              title="Outstanding Balance"
              value={(dashboardData as DashboardData)?.stats?.outstandingBalance ?? 0}
              change={3.1}
              icon={<AlertTriangle className="h-5 w-5" />}
              color="warning"
              negative
            />
          </div>
          
          {/* Charts & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow-sm p-5 lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Revenue Overview</h3>
                <select 
                  className="border border-gray-300 rounded py-1 px-2 text-sm"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                >
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">This Year</option>
                </select>
              </div>
              <div className="h-64 w-full">
                <RevenueChart timePeriod={timePeriod} />
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <ActivityItem
                  type="success"
                  title="Invoice #1042 paid"
                  description="SuperTech Inc. - $2,580.00"
                  date="Today, 10:30 AM"
                />
                
                <ActivityItem
                  type="info"
                  title="New invoice created"
                  description="Acme Corp. - $1,750.00"
                  date="Yesterday, 3:45 PM"
                />
                
                <ActivityItem
                  type="warning"
                  title="Invoice #1039 overdue"
                  description="Global Services LLC - $3,200.00"
                  date="Oct 15, 2023"
                />
                
                <ActivityItem
                  type="purple"
                  title="New client added"
                  description="TechStart Solutions"
                  date="Oct 12, 2023"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="mt-4 px-0">
                    View all activity <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Activity Log</DialogTitle>
                    <DialogDescription>
                      Recent account activities and transactions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
                    <ActivityItem
                      type="success"
                      title="Invoice #1042 paid"
                      description="SuperTech Inc. - $2,580.00"
                      date="Today, 10:30 AM"
                    />
                    
                    <ActivityItem
                      type="info"
                      title="New invoice created"
                      description="Acme Corp. - $1,750.00"
                      date="Yesterday, 3:45 PM"
                    />
                    
                    <ActivityItem
                      type="warning"
                      title="Invoice #1039 overdue"
                      description="Global Services LLC - $3,200.00"
                      date="Oct 15, 2023"
                    />
                    
                    <ActivityItem
                      type="purple"
                      title="New client added"
                      description="TechStart Solutions"
                      date="Oct 12, 2023"
                    />
                    
                    <ActivityItem
                      type="success"
                      title="Invoice #1038 paid"
                      description="Quantum Data Inc. - $4,800.00"
                      date="Oct 11, 2023"
                    />
                    
                    <ActivityItem
                      type="info"
                      title="User profile updated"
                      description="Password and contact information changed"
                      date="Oct 10, 2023"
                    />
                    
                    <ActivityItem
                      type="info"
                      title="New payment received"
                      description="MetroSoft Co. - $3,120.00"
                      date="Oct 8, 2023"
                    />
                    
                    <ActivityItem
                      type="purple"
                      title="Report generated"
                      description="Q3 Financial Report - All users"
                      date="Oct 5, 2023"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Recent Invoices */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="p-5 border-b">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Recent Invoices</h3>
                <Link href="/invoices">
                  <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium">
                    View all
                  </Button>
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading recent invoices...
                      </td>
                    </tr>
                  ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{invoice.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${Number(invoice.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary hover:text-blue-700 mr-1"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Invoice #{invoice.id}</DialogTitle>
                                <DialogDescription>
                                  View invoice details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div className="font-medium">Title</div>
                                  <div className="col-span-2">{invoice.title}</div>
                                  
                                  <div className="font-medium">Client</div>
                                  <div className="col-span-2">{invoice.clientName}</div>
                                  
                                  <div className="font-medium">Amount</div>
                                  <div className="col-span-2">${Number(invoice.amount).toFixed(2)}</div>
                                  
                                  <div className="font-medium">Date</div>
                                  <div className="col-span-2">{new Date(invoice.date).toLocaleDateString()}</div>
                                  
                                  <div className="font-medium">Status</div>
                                  <div className="col-span-2"><StatusBadge status={invoice.status} /></div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-500 hover:text-gray-700 mr-1"
                            onClick={() => setLocation(`/invoices?edit=${invoice.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                <FileDown className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>Download Invoice</DialogTitle>
                                <DialogDescription>
                                  Generate and download invoice document
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <p>Select format to download Invoice #{invoice.id}</p>
                                <div className="flex justify-between gap-4">
                                  <Button className="flex-1" variant="outline">PDF</Button>
                                  <Button className="flex-1" variant="outline">Excel</Button>
                                  <Button className="flex-1" variant="outline">CSV</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        {searchTerm ? "No matching invoices found" : "No invoices found"}
                      </td>
                    </tr>
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

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
        Paid
      </Badge>
    );
  } else if (status === "pending") {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Pending
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
        Overdue
      </Badge>
    );
  }
}
