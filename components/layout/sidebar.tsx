'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loading } from '@/components/ui/loading';
import {
  Calendar,
  Settings,
  Users,
  Stethoscope,
  Shield,
  ChevronDown,
  LayoutDashboard,
  ClipboardCheck,
  UserCog,
  LineChart,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  color?: string;
  subItems?: {
    label: string;
    href: string;
    roles: string[];
  }[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'doctor', 'receptionist'], color: '#0EA5E9' },
  { icon: Shield, label: 'Administration', href: '#', roles: ['admin'], color: '#6366F1', subItems: [
    { label: 'Roles', href: '/admin/roles', roles: ['admin'] },
    { label: 'Users', href: '/admin/users', roles: ['admin'] },
    { label: 'Specializations', href: '/admin/specializations', roles: ['admin'] },
  ]},
  { icon: Stethoscope, label: 'Doctor', href: '#', roles: ['admin', 'receptionist'], color: '#8B5CF6', subItems: [
    { label: 'Availability', href: '/doctor-availability', roles: ['admin', 'receptionist'] },
    { label: 'Time Slots', href: '/doctor-slots', roles: ['admin', 'receptionist'] },
  ]},
  { icon: Users, label: 'Patients', href: '/patients', roles: ['admin', 'doctor', 'receptionist'], color: '#F59E0B' },
  { icon: Calendar, label: 'Appointments', href: '/appointments', roles: ['admin', 'receptionist'], color: '#8B5CF6' },
  { icon: ClipboardCheck, label: 'Patient Visits', href: '/visits', roles: ['admin', 'doctor', 'receptionist'], color: '#059669' },
  { icon: Receipt, label: 'Billing', href: '/billing', roles: ['admin', 'receptionist'], color: '#10B981' },
  { icon: LineChart, label: 'Reports & Auditing', href: '#', roles: ['admin'], color: '#0EA5E9', subItems: [
    { label: 'Revenue Reports', href: '/reports/revenue', roles: ['admin'] },
    { label: 'Outstanding Payments', href: '/reports/payments', roles: ['admin'] },
    { label: 'Insurance Claims', href: '/reports/insurance', roles: ['admin'] },
    { label: 'Discount Analysis', href: '/reports/discounts', roles: ['admin'] },
    { label: 'Transaction History', href: '/reports/transactions', roles: ['admin'] },
  ]},
  { icon: UserCog, label: 'Settings', href: '/settings', roles: ['admin'], color: '#6B7280' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await response.json();
        setUserRole(data.role);
      } catch (error) {
        console.error('Failed to fetch user role:', error);
      }
    }

    fetchUserRole();
  }, []);

  // Auto-expand parent menu items when sub-pages are active
  useEffect(() => {
    const autoExpandItems: string[] = [];
    
    menuItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(subItem => 
          pathname.startsWith(subItem.href) && subItem.href !== '#'
        );
        if (hasActiveSubItem) {
          autoExpandItems.push(item.label);
        }
      }
    });
    
    setExpandedItems(prev => {
      const combinedItems = [...prev, ...autoExpandItems];
      const uniqueItems = combinedItems.filter((item, index) => combinedItems.indexOf(item) === index);
      return uniqueItems;
    });
  }, [pathname]);

  const handleNavigation = (href: string) => {
    if (href === '#') return;
    setIsLoading(true);
    const resetLoading = () => setIsLoading(false);
    window.addEventListener('load', resetLoading);
    setTimeout(resetLoading, 3000);
    return () => window.removeEventListener('load', resetLoading);
  };

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => {
      const isCurrentlyExpanded = prev.includes(label);
      
      if (isCurrentlyExpanded) {
        // If collapsing, remove from expanded items
        return prev.filter(item => item !== label);
      } else {
        // If expanding, add to expanded items
        return [...prev, label];
      }
    });
  };

  const isActive = (href: string, subItems?: any[]) => {
    if (href === '/') return pathname === href;
    if (href === '#') {
      // For parent items with subItems, check if any sub-item is active
      return subItems?.some(subItem => pathname.startsWith(subItem.href) && subItem.href !== '#') || false;
    }
    return pathname.startsWith(href);
  };

  const isSubItemActive = (href: string) => {
    return pathname.startsWith(href) && href !== '#';
  };

  const hasAccess = (roles: string[]) => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const filteredMenuItems = menuItems.filter(item => hasAccess(item.roles));

  return (
    <>
      {isLoading && <Loading message="Loading page..." />}
      <div 
        className={cn(
          "hidden lg:block border-r bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out",
          isExpanded ? "w-[280px]" : "w-[80px]"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false);
          // Don't collapse expanded items when mouse leaves - keep them expanded if they have active sub-items
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b bg-[#008ea9] px-6">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105" onClick={() => handleNavigation('/')}>
              <Stethoscope className="h-8 w-8 text-white" strokeWidth={1.5} />
              {isExpanded && <span className="text-xl font-semibold text-white truncate">BioClinic</span>}
            </Link>
          </div>

          <div className="flex-1 overflow-hidden hover:overflow-auto">
            <nav className="space-y-1 p-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isItemExpanded = expandedItems.includes(item.label);
                const active = isActive(item.href, item.subItems);

                if (item.subItems) {
                  const filteredSubItems = item.subItems.filter(subItem => hasAccess(subItem.roles));
                  if (filteredSubItems.length === 0) return null;

                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        onClick={() => toggleExpand(item.label)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl p-2 text-sm transition-colors',
                          active && 'bg-primary/10 text-primary hover:bg-primary/20'
                        )}
                        style={active ? { backgroundColor: `${item.color}10`, color: item.color } : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}10`, color: item.color }}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {isExpanded && <span className="font-medium truncate">{item.label}</span>}
                        </div>
                        {isExpanded && <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isItemExpanded && "rotate-180")} />}
                      </button>
                      {isExpanded && isItemExpanded && (
                        <div className="ml-4 space-y-1 border-l pl-4">
                          {filteredSubItems.map((subItem) => {
                            const subActive = isSubItemActive(subItem.href);
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => handleNavigation(subItem.href)}
                                className={cn('flex items-center rounded-lg px-3 py-2 text-sm transition-colors', subActive && 'bg-primary/10 hover:bg-primary/20')}
                                style={subActive ? { backgroundColor: `${item.color}10`, color: item.color } : undefined}
                              >
                                <span className="truncate">{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={cn('flex items-center gap-3 rounded-xl p-2 text-sm transition-colors', active && 'bg-primary/10 hover:bg-primary/20')}
                    style={active ? { backgroundColor: `${item.color}10`, color: item.color } : undefined}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}10`, color: item.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isExpanded && <span className="font-medium truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
