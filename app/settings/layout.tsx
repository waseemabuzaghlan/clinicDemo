'use client';

import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Settings, Bell, Calendar, Shield, Users, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNavItems = [
  {
    title: 'Patient Portal',
    href: '/settings/patient-portal',
    icon: Users,
  },
  {
    title: 'Security & Privacy',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Slot Management',
    href: '/settings/slot-management',
    icon: CalendarDays,
  },
  {
    title: 'Appointments',
    href: '/settings/appointments',
    icon: Calendar,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
];

export default function SettingsLayout({
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
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Configure system settings and preferences
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="w-64 space-y-2">
              {settingsNavItems.map((item) => {
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