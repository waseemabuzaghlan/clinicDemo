'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  FileText,
  Printer,
  RefreshCw,
  Search,
  CreditCard,
  Wallet,
  Receipt,
  Building,
  Clock,
  Plus,
  ArrowUpDown,
  Loader2,
  User,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export-utils';

const invoices = [
  {
    id: 'INV001',
    patientName: 'John Doe',
    date: '2024-04-15',
    type: 'Consultation',
    amount: 150.00,
    insurance: 120.00,
    copay: 30.00,
    status: 'pending',
    paymentMethod: 'Insurance',
  },
  {
    id: 'INV002',
    patientName: 'Jane Smith',
    date: '2024-04-15',
    type: 'Lab Test',
    amount: 250.00,
    insurance: 200.00,
    copay: 50.00,
    status: 'paid',
    paymentMethod: 'Credit Card',
  },
  {
    id: 'INV003',
    patientName: 'Robert Johnson',
    date: '2024-04-14',
    type: 'X-ray',
    amount: 350.00,
    insurance: 280.00,
    copay: 70.00,
    status: 'overdue',
    paymentMethod: 'Cash',
  },
];

const summaryMetrics = [
  {
    title: 'Today\'s Revenue',
    value: '$2,450',
    trend: '+15%',
    trendUp: true,
    icon: DollarSign,
  },
  {
    title: 'Pending Payments',
    value: '$1,200',
    trend: '-8%',
    trendUp: true,
    icon: Clock,
  },
  {
    title: 'Insurance Claims',
    value: '$3,800',
    trend: '+12%',
    trendUp: true,
    icon: Building,
  },
  {
    title: 'Cash Collections',
    value: '$950',
    trend: '+5%',
    trendUp: true,
    icon: Wallet,
  },
];

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [isLoading, setIsLoading] = useState(false);
  const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const [newInvoice, setNewInvoice] = useState({
    patientId: '',
    serviceType: '',
    amount: '',
    insuranceAmount: '',
    copayAmount: '',
    paymentMethod: 'insurance',
    notes: ''
  });

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const columns = ['id', 'patientName', 'date', 'type', 'amount', 'insurance', 'copay', 'status', 'paymentMethod'];
      
      switch (format) {
        case 'pdf':
          await exportToPDF(invoices, columns, 'Invoices Report');
          break;
        case 'excel':
          await exportToExcel(invoices, 'invoices-report');
          break;
        case 'csv':
          await exportToCSV(invoices, 'invoices-report');
          break;
      }

      toast({
        title: "Success",
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: `Failed to export as ${format.toUpperCase()}`,
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (!newInvoice.patientId || !newInvoice.serviceType || !newInvoice.amount) {
        throw new Error('Please fill in all required fields');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const invoice = {
        id: `INV${Math.floor(Math.random() * 1000)}`,
        patientName: 'John Doe',
        date: new Date().toISOString(),
        type: newInvoice.serviceType,
        amount: parseFloat(newInvoice.amount),
        insurance: parseFloat(newInvoice.insuranceAmount) || 0,
        copay: parseFloat(newInvoice.copayAmount) || 0,
        status: 'pending',
        paymentMethod: newInvoice.paymentMethod,
      };

      invoices.unshift(invoice);

      setIsNewInvoiceDialogOpen(false);
      setNewInvoice({
        patientId: '',
        serviceType: '',
        amount: '',
        insuranceAmount: '',
        copayAmount: '',
        paymentMethod: 'insurance',
        notes: ''
      });

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Billing</h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage invoices and payments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleExport('pdf')}
                >
                  <FileText className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className={isLoading ? 'opacity-50' : ''}
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  onClick={() => setIsNewInvoiceDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Invoice
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8">
            {summaryMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className={`text-xs ${
                    metric.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend} from last period
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Invoices</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 backdrop-blur-sm transition-all duration-300">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[150px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Copay</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.patientName}</TableCell>
                      <TableCell>{format(new Date(invoice.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{invoice.type}</TableCell>
                      <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>${invoice.insurance.toFixed(2)}</TableCell>
                      <TableCell>${invoice.copay.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.paymentMethod === 'Credit Card' ? (
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          ) : invoice.paymentMethod === 'Insurance' ? (
                            <Building className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                          )}
                          {invoice.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(invoice.status)
                        }`}>
                          {invoice.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={isNewInvoiceDialogOpen} onOpenChange={setIsNewInvoiceDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Enter the invoice details below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Patient ID</Label>
                    <Input
                      value={newInvoice.patientId}
                      onChange={(e) => setNewInvoice({ ...newInvoice, patientId: e.target.value })}
                      placeholder="Enter patient ID"
                      required
                      className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>

                  <div>
                    <Label>Service Type</Label>
                    <Select
                      value={newInvoice.serviceType}
                      onValueChange={(value) => setNewInvoice({ ...newInvoice, serviceType: value })}
                    >
                      <SelectTrigger className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 backdrop-blur-sm transition-all duration-300">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="lab-test">Lab Test</SelectItem>
                        <SelectItem value="x-ray">X-ray</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Total Amount</Label>
                    <Input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      placeholder="Enter total amount"
                      required
                      className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>

                  <div>
                    <Label>Insurance Amount</Label>
                    <Input
                      type="number"
                      value={newInvoice.insuranceAmount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, insuranceAmount: e.target.value })}
                      placeholder="Enter insurance amount"
                      className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>

                  <div>
                    <Label>Copay Amount</Label>
                    <Input
                      type="number"
                      value={newInvoice.copayAmount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, copayAmount: e.target.value })}
                      placeholder="Enter copay amount"
                      className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-red-500/15 focus:border-red-300/70 focus:shadow-lg focus:shadow-red-500/8 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>

                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={newInvoice.paymentMethod}
                      onValueChange={(value) => setNewInvoice({ ...newInvoice, paymentMethod: value })}
                    >
                      <SelectTrigger className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-cyan-500/15 focus:border-cyan-300/70 focus:shadow-lg focus:shadow-cyan-500/8 backdrop-blur-sm transition-all duration-300">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="credit-card">Credit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={newInvoice.notes}
                      onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                      placeholder="Enter any additional notes"
                      className="focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invoice'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}