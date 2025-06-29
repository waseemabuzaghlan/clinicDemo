'use client';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { LineChart, DollarSign, FileBarChart, Receipt, PieChart, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const reportsNavItems = [
  {
    title: 'Revenue Reports',
    href: '/reports/revenue',
    icon: DollarSign,
  },
  {
    title: 'Outstanding Payments',
    href: '/reports/payments',
    icon: Receipt,
  },
  {
    title: 'Insurance Claims',
    href: '/reports/insurance',
    icon: FileBarChart,
  },
  {
    title: 'Discount Analysis',
    href: '/reports/discounts',
    icon: PieChart,
  },
  {
    title: 'Transaction History',
    href: '/reports/transactions',
    icon: History,
  },
];

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                <LineChart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports & Auditing</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  View and analyze clinic performance and financial data
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="w-64 space-y-2">
              {reportsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3",
                        isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
            <div className="flex-1">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}