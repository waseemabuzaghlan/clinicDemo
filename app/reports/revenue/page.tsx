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
import { DollarSign, Download, FileText, Printer, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

// Dummy data for demonstration
const revenueData = [
  {
    id: 1,
    date: new Date().toISOString(),
    doctor: 'Dr. Sarah Wilson',
    patients: 12,
    revenue: 2400,
    insurance: 1800,
    cash: 600,
    outstanding: 200,
  },
  {
    id: 2,
    date: new Date().toISOString(),
    doctor: 'Dr. Michael Brown',
    patients: 15,
    revenue: 3000,
    insurance: 2200,
    cash: 800,
    outstanding: 300,
  },
  {
    id: 3,
    date: new Date().toISOString(),
    doctor: 'Dr. Emily Davis',
    patients: 10,
    revenue: 2000,
    insurance: 1500,
    cash: 500,
    outstanding: 100,
  },
];

const summaryCards = [
  {
    title: 'Total Revenue',
    value: '$7,400',
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'Insurance Claims',
    value: '$5,500',
    trend: '+8%',
    trendUp: true,
  },
  {
    title: 'Cash Payments',
    value: '$1,900',
    trend: '+15%',
    trendUp: true,
  },
  {
    title: 'Outstanding',
    value: '$600',
    trend: '-5%',
    trendUp: false,
  },
];

export default function RevenueReportsPage() {
  const [dateRange, setDateRange] = useState('today');
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  const handlePrint = () => {
    // Implement print functionality
    window.print();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Reports</h2>
          <p className="text-sm text-muted-foreground">
            View and analyze revenue data across all clinics
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

      <div className="flex items-center gap-4">
        <Select
          value={dateRange}
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[180px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="thisWeek">This Week</SelectItem>
            <SelectItem value="lastWeek">Last Week</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {dateRange === 'custom' && (
          <>
            <Input
              type="date"
              className="w-[180px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              className="w-[180px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${
                card.trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {card.trend} from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {format(new Date(row.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{row.doctor}</TableCell>
                  <TableCell>{row.patients}</TableCell>
                  <TableCell>${row.revenue.toLocaleString()}</TableCell>
                  <TableCell>${row.insurance.toLocaleString()}</TableCell>
                  <TableCell>${row.cash.toLocaleString()}</TableCell>
                  <TableCell>${row.outstanding.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}