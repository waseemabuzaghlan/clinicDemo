'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PercentIcon, TrendingDownIcon } from "lucide-react";

export default function DiscountsReport() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <PercentIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Discount Analysis</CardTitle>
              <CardDescription>Track and analyze applied discounts and their impact</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                <TrendingDownIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,345.00</div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8">
            <p className="text-sm text-muted-foreground">
              More detailed discount analytics coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}