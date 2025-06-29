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
  ArrowUpDown,
  Download,
  FileText,
  Filter,
  Printer,
  RefreshCw,
  Search,
  AlertCircle,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

// Dummy data for demonstration
const claims = [
  {
    id: 'CLM001',
    patientName: 'John Smith',
    provider: 'Blue Cross',
    submissionDate: '2024-04-01',
    amount: 1500,
    status: 'processing',
    processingTime: 5,
    rejectionReason: null,
  },
  {
    id: 'CLM002',
    patientName: 'Sarah Johnson',
    provider: 'Aetna',
    submissionDate: '2024-04-02',
    amount: 2300,
    status: 'rejected',
    processingTime: 3,
    rejectionReason: 'Missing documentation',
  },
  {
    id: 'CLM003',
    patientName: 'Michael Brown',
    provider: 'UnitedHealth',
    submissionDate: '2024-04-03',
    amount: 1800,
    status: 'approved',
    processingTime: 4,
    rejectionReason: null,
  },
];

const summaryMetrics = [
  {
    title: 'Total Claims',
    value: '156',
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'Avg Processing Time',
    value: '4.2 days',
    trend: '-0.8 days',
    trendUp: true,
  },
  {
    title: 'Rejection Rate',
    value: '8.3%',
    trend: '-2.1%',
    trendUp: true,
  },
  {
    title: 'Pending Amount',
    value: '$45,600',
    trend: '+15%',
    trendUp: false,
  },
];

export default function InsuranceClaimsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insurance Claims Management</h2>
          <p className="text-sm text-muted-foreground">
            Track and analyze insurance claim processing and status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport('pdf')}
          >
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport('excel')}
          >
            <FileText className="h-4 w-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleExport('csv')}
          >
            <FileText className="h-4 w-4" />
            CSV
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
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summaryMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle>Claims List</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search claims..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[150px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="blue-cross">Blue Cross</SelectItem>
                  <SelectItem value="aetna">Aetna</SelectItem>
                  <SelectItem value="united-health">UnitedHealth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('id')}
                    className="hover:bg-transparent flex items-center gap-2 -ml-4"
                  >
                    Claim ID
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('patientName')}
                    className="hover:bg-transparent flex items-center gap-2 -ml-4"
                  >
                    Patient
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('provider')}
                    className="hover:bg-transparent flex items-center gap-2 -ml-4"
                  >
                    Provider
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('submissionDate')}
                    className="hover:bg-transparent flex items-center gap-2 -ml-4"
                  >
                    Submission Date
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('amount')}
                    className="hover:bg-transparent flex items-center gap-2 -ml-4"
                  >
                    Amount
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('processingTime')}
                    className="hover:bg-transparent flex items-center gap-2 -ml-4"
                  >
                    Processing Time
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Rejection Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.id}</TableCell>
                  <TableCell>{claim.patientName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{claim.provider}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(claim.submissionDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>${claim.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(claim.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(claim.status)
                      }`}>
                        {claim.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{claim.processingTime} days</TableCell>
                  <TableCell>
                    {claim.rejectionReason || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}