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
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useToast } from '@/hooks/use-toast';
import { Truck, Car, AlertTriangle, Users, ArrowRight, Loader2, Thermometer, Droplets, Lightbulb, ShieldCheck, Armchair as Wheelchair, MonitorSmartphone, Waves } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';

export default function LoadingAreaPage() {
  const [currentCapacity, setCurrentCapacity] = useState(12);
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [temperature, setTemperature] = useState(22);
  const [humidity, setHumidity] = useState(45);
  const { toast } = useToast();

  const zones = [
    {
      id: 1,
      name: 'Loading Zone A',
      type: 'Truck',
      status: 'Available',
      dimensions: '12m x 4m',
      clearance: '4.5m',
      icon: Truck,
    },
    {
      id: 2,
      name: 'Loading Zone B',
      type: 'Van',
      status: 'Occupied',
      dimensions: '8m x 3m',
      clearance: '3.2m',
      icon: Car,
    },
    {
      id: 3,
      name: 'Loading Zone C',
      type: 'Car',
      status: 'Maintenance',
      dimensions: '6m x 2.5m',
      clearance: '2.5m',
      icon: Car,
    },
  ];

  const facilities = [
    {
      name: 'Temperature',
      value: `${temperature}°C`,
      status: 'Optimal',
      icon: Thermometer,
    },
    {
      name: 'Humidity',
      value: `${humidity}%`,
      status: 'Normal',
      icon: Droplets,
    },
    {
      name: 'Lighting',
      value: 'Active',
      status: 'On',
      icon: Lightbulb,
    },
    {
      name: 'Security',
      value: 'Monitored',
      status: 'Active',
      icon: ShieldCheck,
    },
  ];

  const amenities = [
    {
      name: 'Seating Capacity',
      value: `${currentCapacity}/${maxCapacity}`,
      icon: Users,
    },
    {
      name: 'Accessibility',
      value: 'ADA Compliant',
      icon: Wheelchair,
    },
    {
      name: 'Digital Displays',
      value: 'Online',
      icon: MonitorSmartphone,
    },
    {
      name: 'Air Quality',
      value: 'Good',
      icon: Waves,
    },
  ];

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
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Loading Area</h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Monitor and manage loading zones and waiting areas
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {amenities.map((amenity, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {amenity.name}
                  </CardTitle>
                  <amenity.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{amenity.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Loading Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <zone.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{zone.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {zone.dimensions} • {zone.clearance} clearance
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusColor(zone.status)
                        }`}>
                          {zone.status}
                        </span>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Environmental Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <facility.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{facility.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Current: {facility.value}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor('available')
                      }`}>
                        {facility.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Safety & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Emergency Exits</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All emergency exits are clear and properly marked
                  </p>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Safety Equipment</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    First aid kits and fire extinguishers are in place
                  </p>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Wheelchair className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Accessibility</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All areas are wheelchair accessible
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}