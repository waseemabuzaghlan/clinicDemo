'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Plus,
  Stethoscope,
  User,
  Users,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const quickActions = [
  {
    title: 'Add New Patient',
    description: 'Register a new patient in the system',
    icon: Plus,
    href: '/patients/new',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  {
    title: 'Schedule Appointment',
    description: 'Book a new appointment',
    icon: Calendar,
    href: '/appointments?new=true',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  },
  {
    title: 'Patient Records',
    description: 'Access patient medical records',
    icon: FileText,
    href: '/patients',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  {
    title: 'View Queue',
    description: 'Check current patient queue',
    icon: Users,
    href: '/queue',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'in-progress':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedView, setSelectedView] = React.useState('weekly');
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = React.useState('thisMonth');
  
  // State for total patients
  const [totalPatientsCount, setTotalPatientsCount] = React.useState<number>(0);
  const [isLoadingPatients, setIsLoadingPatients] = React.useState(true);
  
  // State for upcoming appointments
  const [upcomingAppointmentsCount, setUpcomingAppointmentsCount] = React.useState<number>(0);
  const [isLoadingAppointments, setIsLoadingAppointments] = React.useState(true);
  
  // State for active doctors
  const [activeDoctorsCount, setActiveDoctorsCount] = React.useState<number>(0);
  const [isLoadingDoctors, setIsLoadingDoctors] = React.useState(true);
    // State for calendar appointments
  const [calendarAppointments, setCalendarAppointments] = React.useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = React.useState(true);

  // State for visit type distribution
  const [visitTypeData, setVisitTypeData] = React.useState<any[]>([
    { name: 'Embassy', value: 0, color: '#FF6B6B' },
    { name: 'Online', value: 0, color: '#4ECDC4' },
    { name: 'Normal - Onsite', value: 0, color: '#45B7D1' },
    { name: 'HouseCall', value: 0, color: '#96CEB4' },
    { name: 'Emergency', value: 0, color: '#FFEEAD' }
  ]);
  const [isLoadingVisitTypes, setIsLoadingVisitTypes] = React.useState(true);  // Fetch total patients count
  const fetchTotalPatients = React.useCallback(async () => {
    try {
      setIsLoadingPatients(true);
      
      console.log('Dashboard: Fetching total patients count...');
      
      // Try multiple approaches to get patient count
      
      // Approach 1: Use getAllPatients flag
      try {
        const response = await fetch('/api/patients/search', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            patName: '',
            patarName: '',
            patMobile: '',
            mobileCountryCode: 0,
            getAllPatients: true // Special flag for dashboard stats
          }),
        });

        console.log('Dashboard: Patient search response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Dashboard: Patient search response data:', data);
          
          const patientList = data.patientList || data.PatientList || [];
          console.log('Dashboard: Extracted patient list:', patientList);
          
          if (patientList.length > 0) {
            console.log('Dashboard: Found patients using getAllPatients approach:', patientList.length);
            setTotalPatientsCount(patientList.length);
            return;
          }
        }
      } catch (error) {
        console.log('Dashboard: getAllPatients approach failed:', error);
      }

      // Approach 2: Try with a wildcard search using common pattern
      try {
        const response = await fetch('/api/patients/search', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            patName: 'a', // Common letter that might match many patients
            patarName: '',
            patMobile: '',
            mobileCountryCode: 0,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const patientList = data.patientList || data.PatientList || [];
          
          if (patientList.length > 0) {
            console.log('Dashboard: Found patients using wildcard approach:', patientList.length);
            setTotalPatientsCount(patientList.length);
            return;
          }
        }
      } catch (error) {
        console.log('Dashboard: Wildcard approach failed:', error);
      }

      // If no patients found with either approach, set count to 0
      console.log('Dashboard: No patients found with any approach');
      setTotalPatientsCount(0);
      
    } catch (error) {
      console.error('Dashboard: Error fetching total patients:', error);
      setTotalPatientsCount(0);
      toast({
        title: "Error",
        description: "Unable to load patient count.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPatients(false);
    }
  }, [toast]);

  // Fetch upcoming appointments count
  const fetchUpcomingAppointments = React.useCallback(async () => {
    try {
      setIsLoadingAppointments(true);
      
      // Get current date and future date for upcoming appointments
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Get date 30 days from now for upcoming appointments
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      console.log('Fetching upcoming appointments from:', currentDate, 'to:', futureDateString);
      
      const response = await fetch('/api/appointment/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: null,
          patientId: null,
          startDate: currentDate,
          endDate: futureDateString,
          startTime: null,
          endTime: null,
          appointmentTypeId: null,
          statusId: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      console.log('Upcoming appointments API response:', data);
      
      const appointmentList = data.appointmentList || data.appointments || data || [];
      console.log('Extracted upcoming appointment list:', appointmentList);
      console.log('Upcoming appointment count:', appointmentList.length);
      
      setUpcomingAppointmentsCount(appointmentList.length);
      
      // If no appointments found, let's try without date filter to see if there are any appointments at all
      if (appointmentList.length === 0) {
        console.log('No upcoming appointments found, trying without date filter...');
        
        const responseAll = await fetch('/api/appointment/search', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            doctorId: null,
            patientId: null,
            startDate: null,
            endDate: null,
            startTime: null,
            endTime: null,
            appointmentTypeId: null,
            statusId: null
          }),
        });
        
        if (responseAll.ok) {
          const dataAll = await responseAll.json();
          const allAppointments = dataAll.appointmentList || dataAll.appointments || dataAll || [];
          console.log('Total appointments in system:', allAppointments.length);
          console.log('All appointments:', allAppointments);
        }
      }
      
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      setUpcomingAppointmentsCount(0);
      toast({
        title: "Error",
        description: "Unable to load upcoming appointment count.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAppointments(false);
    }
  }, [toast]);

  // Fetch active doctors count
  const fetchActiveDoctors = React.useCallback(async () => {
    try {
      setIsLoadingDoctors(true);
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('Users API response:', data);
      
      // Filter users to get only doctors
      const usersList = data.users || data || [];
      const doctors = usersList.filter((user: any) => user.roleName === "Doctor");
      console.log('Filtered doctors:', doctors);
      console.log('Active doctors count:', doctors.length);
      
      setActiveDoctorsCount(doctors.length);
      
    } catch (error) {
      console.error('Error fetching active doctors:', error);
      setActiveDoctorsCount(0);
      toast({
        title: "Error",
        description: "Unable to load active doctors count.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [toast]);

  // Fetch calendar appointments for the selected date range
  const fetchCalendarAppointments = React.useCallback(async (startDate: Date, endDate: Date) => {
    try {
      setIsLoadingCalendar(true);
      
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      const response = await fetch('/api/appointment/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: null,
          patientId: null,
          startDate: startDateString,
          endDate: endDateString,
          startTime: null,
          endTime: null,
          appointmentTypeId: null,
          statusId: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar appointments');
      }

      const data = await response.json();
      const appointmentList = data.appointmentList || data.appointments || data || [];
      console.log('Calendar appointments:', appointmentList);
      
      setCalendarAppointments(appointmentList);
      
    } catch (error) {
      console.error('Error fetching calendar appointments:', error);
      setCalendarAppointments([]);
    } finally {
      setIsLoadingCalendar(false);
    }  }, []);

  // Fetch visit type distribution data
  const fetchVisitTypeDistribution = React.useCallback(async () => {
    try {
      setIsLoadingVisitTypes(true);
      
      // Calculate date range based on selected period
      let startDate: Date, endDate: Date;
      const now = new Date();
      
      switch (selectedPeriod) {
        case 'thisWeek':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'thisMonth':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'lastMonth':
          const lastMonth = subMonths(now, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
          break;
        case 'thisYear':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }
      
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      const response = await fetch('/api/appointment/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: null,
          patientId: null,
          startDate: startDateString,
          endDate: endDateString,
          startTime: null,
          endTime: null,
          appointmentTypeId: null,
          statusId: null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments for visit types');
      }

      const data = await response.json();
      const appointments = data || [];
      
      // Calculate visit type distribution
      const typeCounts: { [key: string]: number } = {};
      let totalAppointments = appointments.length;
      
      appointments.forEach((appointment: any) => {
        const typeName = appointment.typeName || 'Unknown';
        typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
      });
      
      // Map to known types with colors and calculate percentages
      const typeColorMap: { [key: string]: string } = {
        'Embassy': '#FF6B6B',
        'Online': '#4ECDC4',
        'Normal - Onsite': '#45B7D1',
        'HouseCall': '#96CEB4',
        'Emergency': '#FFEEAD',
        'Unknown': '#95A5A6'
      };
        const visitTypes = Object.entries(typeCounts).map(([name, count]) => ({
        name,
        value: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0,
        count: count,
        color: typeColorMap[name] || '#95A5A6'
      }));
      
      // Add missing types with 0 value
      const knownTypes = ['Embassy', 'Online', 'Normal - Onsite', 'HouseCall', 'Emergency'];
      knownTypes.forEach(type => {
        if (!visitTypes.find(vt => vt.name === type)) {
          visitTypes.push({
            name: type,
            value: 0,
            count: 0,
            color: typeColorMap[type]
          });
        }
      });
      
      setVisitTypeData(visitTypes);
      
    } catch (error) {
      console.error('Error fetching visit type distribution:', error);      // Keep default data structure with 0 values
      setVisitTypeData([
        { name: 'Embassy', value: 0, count: 0, color: '#FF6B6B' },
        { name: 'Online', value: 0, count: 0, color: '#4ECDC4' },
        { name: 'Normal - Onsite', value: 0, count: 0, color: '#45B7D1' },
        { name: 'HouseCall', value: 0, count: 0, color: '#96CEB4' },
        { name: 'Emergency', value: 0, count: 0, color: '#FFEEAD' }
      ]);
    } finally {
      setIsLoadingVisitTypes(false);
    }
  }, [selectedPeriod]);

  // Get appointments for a specific day
  const getAppointmentsForDay = React.useCallback((date: Date) => {
    return calendarAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date || appointment.appointmentDate);
      return (
        appointmentDate.getFullYear() === date.getFullYear() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getDate() === date.getDate()
      );
    });  }, [calendarAppointments]);

  // Fetch data on component mount
  React.useEffect(() => {
    fetchTotalPatients();
    fetchUpcomingAppointments();
    fetchActiveDoctors();
    fetchVisitTypeDistribution();
  }, [fetchTotalPatients, fetchUpcomingAppointments, fetchActiveDoctors, fetchVisitTypeDistribution]);

  // Fetch visit type distribution when selected period changes
  React.useEffect(() => {
    fetchVisitTypeDistribution();
  }, [selectedPeriod, fetchVisitTypeDistribution]);

  // Fetch calendar appointments when selected date or view changes
  React.useEffect(() => {
    let startDate: Date, endDate: Date;
    
    switch (selectedView) {
      case 'daily':
        startDate = selectedDate;
        endDate = selectedDate;
        break;
      case 'weekly':
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
        endDate = endOfWeek(selectedDate, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      default:
        startDate = selectedDate;
        endDate = selectedDate;
    }
    
    fetchCalendarAppointments(startDate, endDate);
  }, [selectedDate, selectedView, fetchCalendarAppointments]);

  // Dynamic stats array with real data
  const stats = React.useMemo(() => [
    {
      title: 'Total Patients',
      value: isLoadingPatients ? '...' : totalPatientsCount.toLocaleString(),
      icon: Users,
      description: isLoadingPatients ? 'Loading...' : `${totalPatientsCount} patients registered`,
      trend: 'up' as const,
      isLoading: isLoadingPatients,
    },
    {
      title: "Upcoming Appointments",
      value: isLoadingAppointments ? '...' : upcomingAppointmentsCount.toString(),
      icon: Calendar,
      description: isLoadingAppointments ? 'Loading...' : `${upcomingAppointmentsCount} appointments coming`,
      trend: 'up' as const,
      isLoading: isLoadingAppointments,
    },
    {
      title: 'Pending Appointments',
      value: '28',
      icon: Clock,
      description: 'Next 7 days',
      trend: 'up' as const,
      isLoading: false,
    },
    {
      title: 'Active Doctors',
      value: isLoadingDoctors ? '...' : activeDoctorsCount.toString(),
      icon: Stethoscope,
      description: isLoadingDoctors ? 'Loading...' : `${activeDoctorsCount} doctors active`,
      trend: 'up' as const,
      isLoading: isLoadingDoctors,
    },
  ], [totalPatientsCount, isLoadingPatients, upcomingAppointmentsCount, isLoadingAppointments, activeDoctorsCount, isLoadingDoctors]);

  const handlePrevious = () => {
    switch (selectedView) {
      case 'daily':
        setSelectedDate(prev => addDays(prev, -1));
        break;
      case 'weekly':
        setSelectedDate(prev => subWeeks(prev, 1));
        break;
      case 'monthly':
        setSelectedDate(prev => subMonths(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (selectedView) {
      case 'daily':
        setSelectedDate(prev => addDays(prev, 1));
        break;
      case 'weekly':
        setSelectedDate(prev => addWeeks(prev, 1));
        break;
      case 'monthly':
        setSelectedDate(prev => addMonths(prev, 1));
        break;
    }
  };  const handleQuickAction = (href: string) => {
    router.push(href);
  };
  // Helper function to generate dynamic colors based on appointment typeName from API
  const getAppointmentTypeColor = (appointmentType: string) => {
    const typeColors = {
      // Exact appointment types from API response (using typeName field)
      'Embassy': { 
        strip: 'bg-pink-500', 
        avatar: 'bg-pink-500',
        from: 'from-pink-400', 
        to: 'to-pink-500', 
        bg: 'from-pink-400 to-pink-500'
      },
      'Emergency': { 
        strip: 'bg-red-500', 
        avatar: 'bg-red-500',
        from: 'from-red-400', 
        to: 'to-red-500', 
        bg: 'from-red-400 to-red-500'
      },
      'HouseCall': { 
        strip: 'bg-green-500', 
        avatar: 'bg-green-500',
        from: 'from-green-400', 
        to: 'to-green-500', 
        bg: 'from-green-400 to-green-500'
      },
      'Online': { 
        strip: 'bg-teal-500', 
        avatar: 'bg-teal-500',
        from: 'from-teal-400', 
        to: 'to-teal-500', 
        bg: 'from-teal-400 to-teal-500'
      },
      'Normal - Onsite': { 
        strip: 'bg-blue-500', 
        avatar: 'bg-blue-500',
        from: 'from-blue-400', 
        to: 'to-blue-500', 
        bg: 'from-blue-400 to-blue-500'
      },
      'Unknown': { 
        strip: 'bg-gray-500', 
        avatar: 'bg-gray-500',
        from: 'from-gray-400', 
        to: 'to-gray-500', 
        bg: 'from-gray-400 to-gray-500'
      }
    };
    
    // Try exact match first (case-sensitive)
    if (typeColors[appointmentType as keyof typeof typeColors]) {
      return typeColors[appointmentType as keyof typeof typeColors];
    }
    
    // Try case-insensitive match
    const typeKey = Object.keys(typeColors).find(key => 
      key.toLowerCase() === appointmentType?.toLowerCase()
    );
    if (typeKey) {
      return typeColors[typeKey as keyof typeof typeColors];
    }
    
    // Default to Unknown color (gray)
    return typeColors.Unknown;
  };

  const renderCalendarContent = () => {
    if (isLoadingCalendar) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading appointments...</span>
          </div>
        </div>
      );
    }

    switch (selectedView) {      case 'daily':
        const dayAppointments = getAppointmentsForDay(selectedDate);
        return (
          <div className="space-y-5">
            {/* Modern Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/40 dark:border-blue-700/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {format(selectedDate, 'EEEE')}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {dayAppointments.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  appointment{dayAppointments.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            {/* Modern Appointments List */}
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-3">
                {dayAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 mb-4 shadow-inner">
                        <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <Plus className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No appointments today</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Your schedule is clear for this day</p>
                    <Button
                      size="sm"
                      className="h-8 px-4 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                      onClick={() => router.push('/appointments')}
                    >
                      Schedule appointment
                    </Button>
                  </div>                ) : (
                  dayAppointments.map((appointment, index) => {
                    const appointmentColor = getAppointmentTypeColor(appointment.typeName || 'Unknown');
                    
                    return (
                    <div
                      key={appointment.id || index}
                      className="group relative overflow-hidden rounded-xl bg-white/90 dark:bg-gray-800/90 border border-gray-200/60 dark:border-gray-700/40 hover:border-blue-300/60 dark:hover:border-blue-600/40 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm"
                      onClick={() => {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd');
                        router.push(`/appointments?date=${dateStr}`);
                      }}
                    >
                      {/* Animated Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-indigo-50/20 dark:via-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>                      {/* Dynamic Time Indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${appointmentColor.strip}`}></div>
                      
                      <div className="relative p-4 flex items-center gap-4">
                        {/* Time Display */}
                        <div className="flex flex-col items-center min-w-[60px]">
                          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {appointment.startTime || appointment.appointmentTime || appointment.time || format(new Date(appointment.date || appointment.appointmentDate), 'HH:mm')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {format(new Date(appointment.date || appointment.appointmentDate), 'a')}
                          </div>
                        </div>
                        
                        {/* Separator */}
                        <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                        
                        {/* Patient Info */}
                        <div className="flex-1 space-y-1">                          <div className="flex items-center gap-2">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md group-hover:scale-110 transition-transform duration-300 ${appointmentColor.avatar}`}>
                              <User className="h-4 w-4" />
                            </div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                              {appointment.patientName || appointment.patient?.fullName || 'Unknown Patient'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <Stethoscope className="h-3 w-3" />
                            <span>Dr. {appointment.doctorName || appointment.doctor?.fullName || 'Unknown Doctor'}</span>
                          </div>                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.typeName || 'Unknown'}</span>
                          </div>
                        </div>
                        
                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <div className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm",
                            appointment.status === 'confirmed' || appointment.status === 'scheduled'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : appointment.status === 'pending'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : appointment.status === 'cancelled'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          )}>
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full mr-1.5",
                              appointment.status === 'confirmed' || appointment.status === 'scheduled'
                                ? 'bg-emerald-500'
                                : appointment.status === 'pending'
                                ? 'bg-amber-500'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            )}></div>
                            {appointment.status || 'scheduled'}
                          </div>                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 'weekly':
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });        return (
          <div className="space-y-4">
            {/* Modern Week Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/60 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {calendarAppointments.length} appointments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePrevious}
                  className="h-8 w-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-2 border-gray-300/60 dark:border-gray-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 hover:shadow-md hover:border-blue-400/70 dark:hover:border-blue-500/60 transition-all duration-200 rounded-lg group"
                >
                  <ChevronLeft className="h-3 w-3 group-hover:scale-110 transition-transform" />
                </Button>
                <div className="text-xs px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/40 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Week View</span>
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleNext}
                  className="h-8 w-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-2 border-gray-300/60 dark:border-gray-600/50 hover:bg-white/95 dark:hover:bg-gray-800/95 hover:shadow-md hover:border-blue-400/70 dark:hover:border-blue-500/60 transition-all duration-200 rounded-lg group"
                >
                  <ChevronRight className="h-3 w-3 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Modern Calendar Grid - Optimized for dashboard card */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-2">
              {weekDays.map((day, index) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isWeekend = day.getDay() === 5; // Friday is considered weekend in appointments page
                  const dayHeader = (
                    <div 
                      className={cn(                        "text-center p-2 backdrop-blur-xl border-2 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden group cursor-pointer hover:scale-105",
                        isToday 
                          ? "bg-gradient-to-br from-blue-500/90 to-purple-500/90 border-blue-400 text-white shadow-blue-500/20" 
                          : isWeekend
                          ? "bg-gradient-to-br from-orange-50/90 to-amber-50/90 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300/60 dark:border-orange-600/50 hover:bg-gradient-to-br hover:from-orange-100/90 hover:to-amber-100/90 hover:border-orange-400/70"
                          : "bg-white/90 dark:bg-gray-800/90 border-gray-300/60 dark:border-gray-600/50 hover:bg-blue-50/90 dark:hover:bg-blue-900/30 hover:border-blue-400/70 dark:hover:border-blue-500/60"
                      )}
                      onClick={() => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        router.push(`/appointments?date=${dateStr}`);
                      }}
                    >
                      {isToday && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 animate-pulse"></div>
                      )}
                      <div className="relative z-10">
                        <div className={cn(
                          "font-bold text-sm",
                          isToday ? "text-white" : "text-gray-900 dark:text-gray-100"
                        )}>
                          {format(day, 'EEE')}
                        </div>
                        <div className={cn(
                          "text-lg font-extrabold mt-0.5",
                          isToday ? "text-white" : "text-gray-800 dark:text-gray-200"
                        )}>
                          {format(day, 'd')}
                        </div>
                        {dayAppointments.length > 0 && (
                          <div className={cn(
                            "mt-1 px-1.5 py-0.5 rounded-full text-xs font-semibold",
                            isToday 
                              ? "bg-white/20 text-white" 
                              : "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300"
                          )}>
                            {dayAppointments.length}
                          </div>
                        )}
                        {isToday && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                          </div>
                        )}
                      </div>
                    </div>
                );

                return (
                  <div key={day.toString()} className="space-y-1.5" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Day Header - Optimized for dashboard */}                    {dayAppointments.length > 0 ? (
                      <UITooltip delayDuration={500}>
                        <TooltipTrigger asChild>
                          {dayHeader}
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="max-w-xs p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                              {format(day, 'EEEE, MMMM d')}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                            </div>
                            <div className="space-y-1">
                              {dayAppointments.slice(0, 4).map((apt, aptIndex) => (                                <div key={aptIndex} className="flex items-center gap-2 text-xs">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                                  <div className="flex-1 truncate">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {apt.startTime || apt.appointmentTime || apt.time || format(new Date(apt.date || apt.appointmentDate), 'HH:mm')}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400 ml-1">
                                      {apt.patientName || apt.patient?.fullName || 'Patient'}
                                    </span>
                                  </div>                                </div>
                              ))}                              {dayAppointments.length > 4 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1 border-t border-gray-200 dark:border-gray-600">
                                  +{dayAppointments.length - 4} more appointments
                                </div>
                              )}
                            </div>
                            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">                              <Button
                                size="sm"
                                className="w-full h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const dateStr = format(day, 'yyyy-MM-dd');
                                  router.push(`/appointments?date=${dateStr}`);
                                }}
                              >
                                View details
                              </Button>
                            </div>
                          </div>
                        </TooltipContent>
                      </UITooltip>
                    ) : dayHeader}
                    
                    {/* Appointments List - Compact for dashboard */}
                    <div className="space-y-1.5 min-h-[120px]">
                      {dayAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-20 p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg opacity-50">
                          <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-600 mb-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 text-center">No appointments</span>
                        </div>
                      ) : (
                        dayAppointments.slice(0, 4).map((appointment, appointmentIndex) => (
                          <div
                            key={appointment.id || appointmentIndex}
                            className="group relative p-2 rounded-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-750/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-101 cursor-pointer overflow-hidden"
                            style={{ animationDelay: `${(index * 100) + (appointmentIndex * 50)}ms` }}
                          >
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Status Indicator */}
                            <div className={cn(
                              "absolute top-0 left-0 w-full h-1 rounded-t-2xl",
                              appointment.status === 'confirmed' || appointment.status === 'scheduled' ? "bg-gradient-to-r from-blue-400 to-cyan-400" :
                              appointment.status === 'completed' ? "bg-gradient-to-r from-green-400 to-emerald-400" :
                              appointment.status === 'cancelled' ? "bg-gradient-to-r from-red-400 to-pink-400" :
                              "bg-gradient-to-r from-orange-400 to-yellow-400"
                            )}></div>

                            <div className="relative z-10">
                              {/* Patient Info - Very Compact */}
                              <div className="flex items-center justify-between mb-1 gap-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <div className="p-1 rounded bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex-shrink-0">
                                    <User className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                    {(appointment.patientName || appointment.patient?.fullName || 'Unknown').split(' ')[0]}
                                  </span>
                                </div>
                                
                                {/* Status Dot */}
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  appointment.status === 'confirmed' || appointment.status === 'scheduled' ? "bg-blue-500" :
                                  appointment.status === 'completed' ? "bg-green-500" :
                                  appointment.status === 'cancelled' ? "bg-red-500" :
                                  "bg-orange-500"
                                )}></div>
                              </div>

                              {/* Time Only */}                              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                <span className="font-medium">
                                  {appointment.startTime || appointment.appointmentTime || appointment.time || format(new Date(appointment.date || appointment.appointmentDate), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}                      {dayAppointments.length > 4 && (
                        <div className="text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const dateStr = format(day, 'yyyy-MM-dd');
                              router.push(`/appointments?date=${dateStr}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/30 hover:border-blue-300/70 dark:hover:border-blue-600/70 transition-all duration-200 cursor-pointer hover:scale-105"
                          >
                            <Plus className="h-3 w-3" />
                            +{dayAppointments.length - 4} more
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'monthly':
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const weeks = Math.ceil(monthDays.length / 7);        return (
          <div className="space-y-4">
            {/* Modern Month Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/60 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-sm border border-gray-200/40 dark:border-gray-700/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {format(selectedDate, 'MMMM yyyy')}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {calendarAppointments.length} appointments
                  </p>
                </div>
              </div>
              <div className="text-xs px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/40 rounded-lg">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Month View</span>
              </div>
            </div>
              {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center py-1.5">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {day}
                  </span>
                </div>
              ))}
            </div>{/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">{Array.from({ length: weeks * 7 }).map((_, index) => {
                const date = addDays(startOfWeek(monthStart, { weekStartsOn: 1 }), index);
                const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const dayAppointments = getAppointmentsForDay(date);
                const hasAppointments = dayAppointments.length > 0;

                const dayCell = (
                  <div
                    key={index}
                    className={cn(
                      "relative group cursor-pointer transition-all duration-200 hover:scale-105",
                      !isCurrentMonth && "opacity-40"
                    )}
                    onClick={() => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      router.push(`/appointments?date=${dateStr}`);
                    }}
                  >                    {/* Day Container */}
                    <div className={cn(
                      "h-12 w-full rounded-lg border transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden",
                      isToday 
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/25" 
                        : hasAppointments 
                        ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700 hover:shadow-md"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600"
                    )}>                      {/* Day Number */}
                      <span className={cn(
                        "text-xs font-medium",
                        isToday 
                          ? "text-white" 
                          : isCurrentMonth 
                          ? "text-gray-900 dark:text-gray-100" 
                          : "text-gray-400 dark:text-gray-500"
                      )}>
                        {format(date, 'd')}
                      </span>
                      
                      {/* Appointment Indicator */}
                      {hasAppointments && (
                        <div className="flex items-center justify-center">
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            isToday ? "bg-white/90" : "bg-emerald-500"
                          )} />
                          {dayAppointments.length > 1 && (
                            <span className={cn(
                              "ml-1 text-xs font-medium",
                              isToday ? "text-white/90" : "text-emerald-600 dark:text-emerald-400"
                            )}>
                              {dayAppointments.length}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Today Indicator */}
                      {isToday && (
                        <div className="absolute top-0.5 right-0.5">
                          <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );                return hasAppointments ? (
                  <UITooltip key={index} delayDuration={500}>
                    <TooltipTrigger asChild>
                      {dayCell}
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="max-w-xs p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 shadow-xl rounded-lg"
                    >
                      <div className="space-y-2">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {format(date, 'EEEE, MMMM d')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((apt, aptIndex) => (
                            <div key={aptIndex} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <div className="flex-1 truncate">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {apt.startTime || apt.appointmentTime || apt.time || format(new Date(apt.date || apt.appointmentDate), 'HH:mm')}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 ml-1">
                                  {apt.patientName || apt.patient?.fullName || 'Patient'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1 border-t border-gray-200 dark:border-gray-600">
                              +{dayAppointments.length - 3} more
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <Button
                            size="sm"
                            className="w-full h-7 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              const dateStr = format(date, 'yyyy-MM-dd');
                              router.push(`/appointments?date=${dateStr}`);
                            }}
                          >
                            View details
                          </Button>
                        </div>
                      </div>
                    </TooltipContent>
                  </UITooltip>
                ) : dayCell;
              })}
            </div>
          </div>
        );
    }  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-secondary/30">
      <Sidebar />
      <div className="flex-1">        <Header />
        <main className="p-4 md:p-6 lg:p-8 space-y-6">          {/* Stats Cards */}
          <div className="grid gap-4 md:gap-5 grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={stat.title} className="group relative overflow-hidden border border-gray-200/60 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-blue-50/20 dark:to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className={cn(
                  "absolute -top-5 -right-5 h-16 w-16 rounded-full blur-xl transition-all duration-500 group-hover:scale-125",
                  index === 0 ? "bg-gradient-to-br from-blue-300/30 to-cyan-300/30" :
                  index === 1 ? "bg-gradient-to-br from-purple-300/30 to-pink-300/30" :
                  index === 2 ? "bg-gradient-to-br from-orange-300/30 to-amber-300/30" :
                  "bg-gradient-to-br from-emerald-300/30 to-teal-300/30"
                )}></div>                <CardContent className="relative p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-105",
                      index === 0 ? "bg-gradient-to-br from-blue-500/90 to-cyan-500/90 text-white shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30" :
                      index === 1 ? "bg-gradient-to-br from-purple-500/90 to-pink-500/90 text-white shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/30" :
                      index === 2 ? "bg-gradient-to-br from-orange-500/90 to-amber-500/90 text-white shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30" :
                      "bg-gradient-to-br from-emerald-500/90 to-teal-500/90 text-white shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30"
                    )}>                      {stat.isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <stat.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className={cn(
                      "h-2 w-2 rounded-full animate-pulse transition-all duration-300 group-hover:scale-125",
                      index === 0 ? "bg-blue-400/70" :
                      index === 1 ? "bg-purple-400/70" :
                      index === 2 ? "bg-orange-400/70" :
                      "bg-emerald-400/70"
                    )}></div>
                  </div>                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {stat.title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-all duration-300 group-hover:scale-105">
                        {stat.value}
                      </div>
                      {stat.isLoading && (
                        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                      )}
                    </div>                    <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300 line-clamp-1">
                      {stat.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>          {/* Quick Actions */}
          <Card className="border border-gray-200/60 dark:border-gray-700/40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fast access to common tasks
                  </p>
                </div>
              </div>
            </CardHeader>            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={action.title}
                    variant="outline"
                    size="default"
                    className="h-auto p-4 flex flex-col items-center gap-3 min-w-[180px] flex-1 bg-white/85 dark:bg-gray-800/85 border border-gray-200/70 dark:border-gray-700/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:border-blue-300/70 dark:hover:border-blue-600/70 transition-all duration-300 group shadow-md hover:shadow-lg backdrop-blur-sm rounded-lg"
                    onClick={() => handleQuickAction(action.href)}
                  >
                    <div className={cn("p-2 rounded-lg transition-transform duration-300 group-hover:scale-110", action.color)}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 px-2">
                      {action.title}
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>{/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">            {/* Appointment Calendar - Takes 2 columns */}            <div className="lg:col-span-2">
              <Card className="border border-gray-200/60 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">                <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Appointment Calendar
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          View and manage appointments
                        </p>
                      </div>
                    </div><div className="flex items-center gap-2">
                      <Select
                        value={selectedView}
                        onValueChange={setSelectedView}
                      >                        <SelectTrigger className="w-[120px] text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="Select view" />
                        </SelectTrigger>                        <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl">
                          <SelectItem value="daily">📅 Daily</SelectItem>
                          <SelectItem value="weekly">📊 Weekly</SelectItem>
                          <SelectItem value="monthly">📆 Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handlePrevious}
                          className="h-8 w-8 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={handleNext}
                          className="h-8 w-8 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>                </CardHeader>
                <CardContent className="p-4 flex-1">
                  <div className="relative h-full">
                    {renderCalendarContent()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient Queue - Takes 1 column */}            <div className="lg:col-span-1">
              <Card className="overflow-hidden border border-gray-200/60 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">                <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Patient Queue</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Today's appointments
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                        {getAppointmentsForDay(new Date()).length} Active
                      </span>
                    </div>
                  </div></CardHeader>                <CardContent className="p-4 flex-1">                  <div className="h-[32rem] overflow-y-auto max-h-full pr-2">
                    <div className="space-y-2">
                      {isLoadingCalendar ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="flex items-center gap-3">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Loader2 className="h-3 w-3 text-white animate-spin" />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Loading queue...</span>
                          </div>
                        </div>
                      ) : getAppointmentsForDay(new Date()).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-3">
                            <Users className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                          </div>
                          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">All clear!</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">No patients in queue today</p>
                        </div>
                      ) : (                        getAppointmentsForDay(new Date()).map((patient: any, index: number) => {
                          const appointmentColor = getAppointmentTypeColor(patient.typeName || 'Unknown');
                          return (
                          <div
                            key={patient.id || index}
                            className="group relative overflow-hidden rounded-lg p-3 bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-700/90 border border-gray-200/50 dark:border-gray-700/50 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-300"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/20 to-purple-50/20 dark:via-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Dynamic left color strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-sm ${appointmentColor.strip}`}></div>
                            
                            <div className="relative z-10 flex items-start gap-3">                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-md flex-shrink-0 ${appointmentColor.avatar}`}>
                                <User className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">                                <div className="flex items-start justify-between mb-1.5">                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                      {patient.patientName || patient.patient?.fullName || 'Unknown Patient'}
                                    </h4>                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                      {patient.typeName || 'Unknown'}
                                    </p>
                                  </div>
                                  <div className={cn(
                                    "px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ml-2",
                                    patient.status === 'confirmed' || patient.status === 'scheduled'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : patient.status === 'pending'
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                      : patient.status === 'cancelled'
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : patient.status === 'in-progress'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                  )}>
                                    {patient.status || 'scheduled'}
                                  </div>
                                </div>                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /><span className="font-medium">
                                      {patient.startTime || patient.appointmentTime || patient.time || format(new Date(patient.date || patient.appointmentDate), 'HH:mm')}
                                    </span>
                                  </div>                                  <div className="flex items-center gap-1">
                                    <Stethoscope className="h-3 w-3" />
                                    <span className="truncate">
                                      Dr. {patient.doctorName || patient.doctor?.fullName || 'Unknown'}
                                    </span>                                  </div>                                </div>
                              </div>
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>          {/* Visit Types Distribution */}
          <Card className="overflow-hidden border border-gray-200/60 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-purple-50/70 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/15 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 text-white shadow-lg">
                    <PieChartIcon className="h-5 w-5" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 animate-pulse"></div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      Visit Types Distribution
                      <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Analytics overview of appointment categories
                    </p>
                  </div>
                </div>
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-[140px] text-xs bg-white/90 dark:bg-gray-800/90 border-gray-200/60 dark:border-gray-700/40 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-gray-200/60 dark:border-gray-700/40 shadow-xl">
                    <SelectItem value="thisWeek">📅 This Week</SelectItem>
                    <SelectItem value="thisMonth">📊 This Month</SelectItem>
                    <SelectItem value="lastMonth">📈 Last Month</SelectItem>
                    <SelectItem value="thisYear">🗓️ This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader><CardContent className="p-3">              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chart Section */}
                <div className="relative flex items-center justify-center">
                  <div className="h-[240px] w-full flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-pink-50/20 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg"></div>
                    {isLoadingVisitTypes ? (
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 text-white animate-spin" />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Loading visit types...</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={visitTypeData}cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={6}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {visitTypeData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color}
                                stroke="#ffffff"
                                strokeWidth={3}
                                className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-lg"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (                                  <div className="rounded-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-3 shadow-xl">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-3 w-3 rounded-full shadow-md"
                                        style={{ backgroundColor: payload[0].payload.color }}
                                      />
                                      <div>                                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                          {payload[0].name}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                          {payload[0].payload.count} appointments ({payload[0].value}%)
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />                        </PieChart>
                      </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>                {/* Details Section */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <div className="h-1 w-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      Distribution Details
                    </h3>
                    <div className="space-y-3">
                      {visitTypeData.map((type, index) => (
                        <div
                          key={type.name}
                          className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 backdrop-blur-sm"
                        >
                          {/* Background Animation */}
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-gray-50/20 dark:via-gray-700/20 dark:to-gray-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Color Accent Bar */}
                          <div 
                            className="absolute left-0 top-0 h-full w-1 rounded-r-full"
                            style={{ backgroundColor: type.color }}
                          />
                          
                          <div className="relative z-10 flex items-center justify-between pl-3">
                            <div className="flex items-center gap-3">
                              {/* Enhanced Color Indicator */}
                              <div className="relative">
                                <div
                                  className="h-4 w-4 rounded-full shadow-lg border-2 border-white dark:border-gray-800 group-hover:scale-110 transition-transform duration-200"
                                  style={{ backgroundColor: type.color }}
                                />
                                <div
                                  className="absolute inset-0 h-4 w-4 rounded-full opacity-20 animate-pulse"
                                  style={{ backgroundColor: type.color }}
                                />
                              </div>
                              
                              {/* Type Name with Icon */}
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                                  {type.name}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="h-1 w-1 rounded-full bg-purple-400 animate-ping"></div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              {/* Count Display */}
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                                  {type.count || 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  appointments
                                </div>
                              </div>
                              
                              {/* Percentage Display */}
                              <div className="text-right">
                                <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                                  {type.value}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  of total
                                </div>
                              </div>
                              
                              {/* Enhanced Progress Bar */}
                              <div className="relative">
                                <div className="w-16 h-3 bg-gray-200/60 dark:bg-gray-700/60 rounded-full overflow-hidden shadow-inner">
                                  <div
                                    className="h-full rounded-full transition-all duration-700 ease-out shadow-sm relative overflow-hidden"
                                    style={{
                                      width: `${type.value}%`,
                                      backgroundColor: type.color,
                                    }}
                                  >
                                    {/* Shimmer Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                  </div>
                                </div>
                                
                                {/* Progress Bar Label */}
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded-md shadow-lg">                                    {type.value}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}