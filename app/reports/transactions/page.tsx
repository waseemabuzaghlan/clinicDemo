'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Receipt, Search, FileDown, Calendar, Filter } from "lucide-react";

const transactions = [
  {
    id: "TX123456",
    date: "2024-03-20",
    type: "Payment",
    amount: 150.00,
    patient: "John Doe",
    method: "Credit Card",
    status: "Completed"
  },
  {
    id: "TX123457",
    date: "2024-03-20",
    type: "Refund",
    amount: -50.00,
    patient: "Jane Smith",
    method: "Cash",
    status: "Completed"
  },
  {
    id: "TX123458",
    date: "2024-03-19",
    type: "Payment",
    amount: 200.00,
    patient: "Robert Johnson",
    method: "Insurance",
    status: "Pending"
  }
];

export default function TransactionsReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('today');
  const [transactionType, setTransactionType] = useState('all');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View and manage financial transactions</CardDescription>
              </div>
            </div>
            <Button className="gap-2">
              <FileDown className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm transition-all duration-300"
              />
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 backdrop-blur-sm transition-all duration-300">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger className="w-[180px] focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 backdrop-blur-sm transition-all duration-300">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="refund">Refunds</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.id}</TableCell>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.patient}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.method}</TableCell>
                    <TableCell className={transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        transaction.status === 'Completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}