'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks } from 'date-fns';
import { AppointmentList } from '@/components/Appointment/AppointmentList';
import { PatientHistoryDialog } from '@/components/PatientHistoryDialog';
import AppointmentFilter from '@/components/Appointment/AppointmentFilter';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Calendar,
  CalendarDays,
  LayoutList,
  Loader2,
  Plus,
  User as UserIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
  Search,
  FileText,
  MoreVertical,
  Stethoscope,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn, getStatusColor } from '@/lib/utils';
import { 
  Appointment, 
  AppointmentCreate, 
  AppointmentType, 
  AppointmentStatus, 
  TimeSlot,
  User,
  Patient
} from '@/types/database';

const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError;
};

// Extended Patient interface for search functionality
interface ExtendedPatient extends Patient {
  patNumber?: number;
  patName?: string;
  patarName?: string;
  patMobile?: string;
}

interface NewAppointment {
  doctorId: number | null;
  doctorName: string | null;
  patientId: number | null;
  patientName: string | null;
  slotId: string | null;
  typeId: string | null;
  notes: string;
  date: string;
}

const getStatusIcon = (status: string) => {
  if (!status) return <Clock className="h-4 w-4 text-gray-500" />;
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'no-show':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'checked-in':
      return <UserIcon className="h-4 w-4 text-blue-500" />;
    case 'scheduled':
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getTypeColor = (typeName: string) => {
  const typeColorMap: { [key: string]: { bg: string; text: string; icon: string; hover: string; selected: string } } = {
    'Embassy': { 
      bg: 'bg-red-100/80 dark:bg-red-900/30', 
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400',
      hover: 'hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50 dark:hover:from-red-900/20 dark:hover:to-red-900/20',
      selected: 'bg-gradient-to-r from-red-50 to-red-50 dark:from-red-900/20 dark:to-red-900/20 border-red-200/70 dark:border-red-700/30'
    },
    'Online': { 
      bg: 'bg-teal-100/80 dark:bg-teal-900/30', 
      text: 'text-teal-700 dark:text-teal-400',
      icon: 'text-teal-600 dark:text-teal-400',
      hover: 'hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-50 dark:hover:from-teal-900/20 dark:hover:to-teal-900/20',
      selected: 'bg-gradient-to-r from-teal-50 to-teal-50 dark:from-teal-900/20 dark:to-teal-900/20 border-teal-200/70 dark:border-teal-700/30'
    },
    'Normal - Onsite': { 
      bg: 'bg-blue-100/80 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50 dark:hover:from-blue-900/20 dark:hover:to-blue-900/20',
      selected: 'bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 border-blue-200/70 dark:border-blue-700/30'
    },
    'HouseCall': { 
      bg: 'bg-green-100/80 dark:bg-green-900/30', 
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50 dark:hover:from-green-900/20 dark:hover:to-green-900/20',
      selected: 'bg-gradient-to-r from-green-50 to-green-50 dark:from-green-900/20 dark:to-green-900/20 border-green-200/70 dark:border-green-700/30'
    },
    'Emergency': { 
      bg: 'bg-yellow-100/80 dark:bg-yellow-900/30', 
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: 'text-yellow-600 dark:text-yellow-400',
      hover: 'hover:bg-gradient-to-r hover:from-yellow-50 hover:to-yellow-50 dark:hover:from-yellow-900/20 dark:hover:to-yellow-900/20',
      selected: 'bg-gradient-to-r from-yellow-50 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-900/20 border-yellow-200/70 dark:border-yellow-700/30'
    },
  };
  
  return typeColorMap[typeName] || { 
    bg: 'bg-gray-100/80 dark:bg-gray-900/30', 
    text: 'text-gray-700 dark:text-gray-400',
    icon: 'text-gray-600 dark:text-gray-400',
    hover: 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50 dark:hover:from-gray-900/20 dark:hover:to-gray-900/20',
    selected: 'bg-gradient-to-r from-gray-50 to-gray-50 dark:from-gray-900/20 dark:to-gray-900/20 border-gray-200/70 dark:border-gray-700/30'
  };
};

export default function AppointmentsPage() {
  const [view, setView] = useState<'calendar' | 'table'>('table');
  const { toast } = useToast();
  const router = useRouter();
  const searchParamsFromUrl = useSearchParams();
  const [patients, setPatients] = useState<ExtendedPatient[]>([]);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [patientSearchValue, setPatientSearchValue] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [doctorSearchValue, setDoctorSearchValue] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);
  const [appointmentTypeOpen, setAppointmentTypeOpen] = useState(false);
  
  // Patient History Dialog state
  const [isPatientHistoryDialogOpen, setIsPatientHistoryDialogOpen] = useState(false);
  const [selectedAppointmentForHistory, setSelectedAppointmentForHistory] = useState<Appointment | null>(null);
  
  const [searchParams, setSearchParams] = useState({
    doctorId: null as number | null,
    patientId: null as number | null,
    startDate: format(new Date(), 'yyyy-MM-dd') as string | null,
    endDate: format(new Date(), 'yyyy-MM-dd') as string | null,
    startTime: null as string | null,
    endTime: null as string | null,
    appointmentTypeId: null as string | null,
    statusId: null as string | null
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<User[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [appointmentStatuses, setAppointmentStatuses] = useState<AppointmentStatus[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isNewAppointmentDialogOpen, setIsNewAppointmentDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState({
    doctors: true,
    appointmentTypes: true,
    appointmentStatuses: true
  });
  const [newAppointment, setNewAppointment] = useState<NewAppointment>({
    doctorId: null,
    doctorName: null,
    patientId: null,
    patientName: null,
    slotId: null,
    typeId: null,
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Debounced patient search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only search if term has at least 2 characters (or 7+ for mobile numbers)
      if (patientSearchTerm) {
        const digitsOnly = patientSearchTerm.replace(/[\D]/g, '');
        const isLikelyMobile = digitsOnly.length >= 7 && (digitsOnly.length / patientSearchTerm.trim().length) >= 0.7;
        const minLength = isLikelyMobile ? 7 : 2;
        
        console.log('Search term:', patientSearchTerm);
        console.log('Is likely mobile (timeout):', isLikelyMobile);
        console.log('Digits count (timeout):', digitsOnly.length);
        
        if (patientSearchTerm.trim().length >= minLength) {
          fetchPatients(patientSearchTerm);
        } else {
          setPatients([]);
        }
      } else {
        setPatients([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearchTerm]);

  // Debounced doctor search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (doctorSearchTerm && doctorSearchTerm.trim().length >= 2) {
        filterDoctors(doctorSearchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [doctorSearchTerm]);

  useEffect(() => {
    if (newAppointment.doctorId && newAppointment.date) {
      fetchAvailableSlots();
    }
  }, [newAppointment.doctorId, newAppointment.date]);  // Handle URL parameters from patient page
  useEffect(() => {
    const patientId = searchParamsFromUrl.get('patientId');
    const patientName = searchParamsFromUrl.get('patientName');
    const openDialog = searchParamsFromUrl.get('openDialog');

    if (patientId && patientName && openDialog === 'true') {
      const numericPatientId = parseInt(patientId);
      
      // Set the patient in newAppointment
      setNewAppointment(prev => ({
        ...prev,
        patientId: numericPatientId,
        patientName: patientName
      }));

      // Create a minimal patient object for the dropdown display
      const preselectedPatient: ExtendedPatient = {
        patientID: numericPatientId,
        fullName: patientName,
        patNumber: numericPatientId,
        patName: patientName,
        patarName: '', // Will be updated when actual patient data is loaded
        patMobile: '', // Will be updated when actual patient data is loaded
      };

      // Add the preselected patient to the patients array temporarily
      setPatients([preselectedPatient]);

      // Set both search values to ensure proper selection and display
      setPatientSearchValue(numericPatientId.toString());
      setPatientSearchTerm(patientName); // This will show the patient name in the search input

      // Open the new appointment dialog
      setIsNewAppointmentDialogOpen(true);

      // Clear the URL parameters to prevent re-triggering
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParamsFromUrl]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        fetchDoctors(),
        fetchAppointmentTypes(),
        fetchAppointmentStatuses(),
      ]);
      await searchAppointments();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load initial data. Please refresh the page to try again.",
        variant: "destructive",
      });
    }
  };

  const fetchPatients = async (searchTerm: string = '') => {
    console.log('fetchPatients called with:', searchTerm);
    
    if (!searchTerm.trim()) {
      console.log('Empty search term, clearing patients');
      setPatients([]);
      return;
    }

    setIsSearchingPatients(true);
    try {
      const trimmedTerm = searchTerm.trim();
      console.log('Trimmed search term:', trimmedTerm);
      
      // Use the exact same logic as Patients page - simple checks
      // Detect Arabic characters
      const hasArabicChars = /[\u0600-\u06FF]/.test(trimmedTerm);
      
      // Better mobile number detection: mostly digits and reasonable length
      const digitsOnly = trimmedTerm.replace(/[\D]/g, '');
      const isLikelyMobile = digitsOnly.length >= 7 && (digitsOnly.length / trimmedTerm.length) >= 0.7;
      
      console.log('Digits only:', digitsOnly);
      console.log('Digits length:', digitsOnly.length);
      console.log('Original length:', trimmedTerm.length);
      console.log('Digit ratio:', digitsOnly.length / trimmedTerm.length);
      console.log('Has Arabic chars:', hasArabicChars);
      console.log('Is likely mobile:', isLikelyMobile);
      
      // Handle mobile number parsing for country code and mobile number
      let mobileNumber = '';
      let countryCode = 0;
      
      if (isLikelyMobile) {
        // If it starts with 962 (Jordan country code), split it
        if (digitsOnly.startsWith('962') && digitsOnly.length > 3) {
          countryCode = 962;
          mobileNumber = digitsOnly.substring(3); // Remove country code
        } else {
          // Otherwise, treat the whole thing as mobile number
          mobileNumber = digitsOnly;
        }
      }
      
      console.log('Country code:', countryCode);
      console.log('Mobile number:', mobileNumber);
      
      // Use the exact same structure as Patients page
      const body = {
        patName: (!hasArabicChars && !isLikelyMobile) ? trimmedTerm : '',
        patarName: hasArabicChars ? trimmedTerm : '',
        patMobile: mobileNumber,
        mobileCountryCode: countryCode,
        patNumber: null,
      };

      console.log('Request body:', body);

      const response = await fetch('/api/patients/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Use the exact same response handling as Patients page
      const mappedPatients = (data.patientList ?? []).map((card: any): ExtendedPatient => ({
        patientID: card.patNumber,
        fullName: card.patName || '',
        patNumber: card.patNumber,
        patName: card.patName || '',
        patarName: card.patarName || '',
        patMobile: card.patMobile || '',
      }));
      
      console.log('Mapped patients:', mappedPatients);
      setPatients(mappedPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to search patients. Please try again.",
        variant: "destructive",
      });
      setPatients([]);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await fetchWithRetry('/api/doctor/all', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      setDoctors(data);
      setFilteredDoctors(data); // Initialize filtered doctors
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors. The system will automatically retry.",
        variant: "destructive",
      });
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setIsLoadingDropdowns(prev => ({ ...prev, doctors: false }));
    }
  };

  const filterDoctors = (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setFilteredDoctors(doctors);
      return;
    }

    const filtered = doctors.filter((doctor) =>
      doctor.fullNameEnglish?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specializationName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(filtered);
  };

  const fetchAppointmentTypes = async () => {
    try {
      const data = await fetchWithRetry('/api/lookup/appointment-types', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      setAppointmentTypes(data);
    } catch (error) {
      console.error('Error fetching appointment types:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment types. The system will automatically retry.",
        variant: "destructive",
      });
      setAppointmentTypes([]);
    } finally {
      setIsLoadingDropdowns(prev => ({ ...prev, appointmentTypes: false }));
    }
  };

  const fetchAppointmentStatuses = async () => {
    try {
      const data = await import('@/lib/appointment-utils').then(m => m.fetchAppointmentStatuses());
      setAppointmentStatuses(data);
    } catch (error) {
      console.error('Error fetching appointment statuses:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment statuses. The system will automatically retry.",
        variant: "destructive",
      });
      setAppointmentStatuses([]);
    } finally {
      setIsLoadingDropdowns(prev => ({ ...prev, appointmentStatuses: false }));
    }
  };

  const fetchAvailableSlots = async () => {
    if (!newAppointment.doctorId || !newAppointment.date) return;

    setIsLoadingSlots(true);
    try {
      const data = await fetchWithRetry(
        `/api/doctor/slots/${newAppointment.doctorId}/false/${newAppointment.date}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      setAvailableSlots(data);
      setNewAppointment(prev => ({ ...prev, slotId: null }));
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots. Please try again.",
        variant: "destructive",
      });
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const searchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWithRetry('/api/appointment/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: searchParams.doctorId,
          patientId: searchParams.patientId,
          startDate: searchParams.startDate ? new Date(searchParams.startDate).toISOString() : null,
          endDate: searchParams.endDate ? new Date(searchParams.endDate).toISOString() : null,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
          appointmentTypeId: searchParams.appointmentTypeId,
          statusId: searchParams.statusId
        })
      });
      setAppointments(data);
    } catch (error) {
      console.error('Error searching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to search appointments. Please try again.",
        variant: "destructive",
      });
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for appointment actions
  const getStatusId = (statusName: string) => {
    if (!statusName) return undefined;
    const status = appointmentStatuses.find(s => s.name?.toLowerCase() === statusName.toLowerCase());
    return status?.id;
  };

  interface AppointmentAction {
    id: string;
    label: string;
    icon: React.ReactNode;
  }

  const getAvailableActions = (status: string): AppointmentAction[] => {
    if (!status) return [];
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'scheduled') {
      return [
        { id: 'checked-in', label: 'Check-in Patient', icon: <UserIcon className="mr-2 h-4 w-4 text-blue-500" /> },
        { id: 'completed', label: 'Mark as Completed', icon: <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> },
        { id: 'cancelled', label: 'Cancel', icon: <XCircle className="mr-2 h-4 w-4 text-red-500" /> },
        { id: 'no-show', label: 'Mark as No-show', icon: <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" /> }
      ];
    }
    if (lowerStatus === 'checked-in') {
      return [
        { id: 'completed', label: 'Mark as Completed', icon: <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> },
        { id: 'cancelled', label: 'Cancel', icon: <XCircle className="mr-2 h-4 w-4 text-red-500" /> }
      ];
    }
    return [];
  };

  const hasAvailableActions = (status: string) => {
    if (!status) return false;
    const lowerStatus = status.toLowerCase();
    return lowerStatus !== 'completed' && lowerStatus !== 'cancelled' && lowerStatus !== 'no-show';
  };

  const updateAppointmentStatus = async (appointmentId: string, statusId: string) => {
    setIsUpdatingStatus(true);
    
    try {
      const status = appointmentStatuses.find(s => s.id === statusId);
      if (!status) {
        throw new Error(`Invalid status ID: ${statusId}`);
      }

      const response = await fetchWithRetry('/api/appointment/update-status', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId,
          statusId
        })
      });
// debugger;
//       if (!response.ok) {
//         throw new Error('Failed to update appointment status');
//       }

      // Optimistically update the UI
      setAppointments(prevAppointments =>
        prevAppointments.map(appointment =>
          appointment.appointmentId === appointmentId
            ? {
                ...appointment,
                statusId: status.id,
                statusName: status.name
              }
            : appointment
        )
      );

      // Refresh the data to ensure we have the latest state
      await searchAppointments();

      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update appointment status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleViewHistory = (appointment: Appointment) => {
    setSelectedAppointmentForHistory(appointment);
    setIsPatientHistoryDialogOpen(true);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAppointment.doctorId || !newAppointment.patientId || !newAppointment.typeId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await fetchWithRetry('/api/appointment/create', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAppointment)
      });

      await searchAppointments();
      setIsNewAppointmentDialogOpen(false);
      resetNewAppointmentForm();
      
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const clearFilters = () => {
    setSearchParams({
      doctorId: null,
      patientId: null,
      startDate: format(new Date(), 'yyyy-MM-dd') as string | null,
      endDate: format(new Date(), 'yyyy-MM-dd') as string | null,
      startTime: null,
      endTime: null,
      appointmentTypeId: null,
      statusId: null
    });
  };

  const getPatientName = (patientID: number) => {
    const patient = patients.find(d => d.patientID === patientID);
    return patient ? patient.fullName : `Patient #${patientID}`;
  };


  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.employeeNumber === doctorId);
    return doctor ? doctor.fullNameEnglish : `Doctor #${doctorId}`;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return (
        appointmentDate.getFullYear() === date.getFullYear() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getDate() === date.getDate()
      );
    });
  };

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedWeek(prev => addWeeks(prev, 1));
  };

  const areDropdownsLoaded = () => {
    return !Object.values(isLoadingDropdowns).some(loading => loading);
  };

  // Search button rendering is now handled by AppointmentFilter component

  const renderCalendarView = () => {
    return (
      <div className="p-3 space-y-3">
        {/* Modern Header */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-white/90 via-blue-50/80 to-purple-50/80 dark:from-gray-800/90 dark:via-gray-750/80 dark:to-gray-700/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 shadow-lg">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {format(weekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
              </h2>
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                {appointments.length} appointments this week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePreviousWeek}
              className="h-7 w-7 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow-md transition-all duration-200 rounded-lg group"
            >
              <ChevronLeft className="h-3 w-3 group-hover:scale-110 transition-transform" />
            </Button>
            <div className="px-2 py-0.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/40 dark:border-gray-700/40">
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Week View</span>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextWeek}
              className="h-7 w-7 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:shadow-md transition-all duration-200 rounded-lg group"
            >
              <ChevronRight className="h-3 w-3 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Modern Calendar Grid */}
        <div className="grid grid-cols-7 gap-2.5">
          {weekDays.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 5; // Friday is considered weekend
            
            return (
              <div key={day.toString()} className="space-y-2 animate-fade-in-scale" style={{ animationDelay: `${index * 100}ms` }}>
                {/* Day Header */}
                <div className={cn(
                  "text-center p-2 backdrop-blur-xl border rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl relative overflow-hidden group",
                  isToday 
                    ? "bg-gradient-to-br from-blue-500/90 to-purple-500/90 border-blue-400/60 text-white shadow-blue-500/20" 
                    : isWeekend
                    ? "bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/40 dark:border-orange-700/30"
                    : "bg-white/80 dark:bg-gray-800/80 border-gray-200/60 dark:border-gray-700/40"
                )}>
                  {isToday && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 animate-pulse-ring"></div>
                  )}
                  <div className="relative z-10">
                    <div className={cn(
                      "font-bold text-sm",
                      isToday ? "text-white" : "text-gray-900 dark:text-gray-100"
                    )}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={cn(
                      "text-base font-extrabold mt-0.5",
                      isToday ? "text-white" : "text-gray-800 dark:text-gray-200"
                    )}>
                      {format(day, 'd')}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className={cn(
                        "mt-0.5 px-1 py-0.5 rounded-full text-xs font-semibold",
                        isToday 
                          ? "bg-white/20 text-white" 
                          : "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300"
                      )}>
                        {dayAppointments.length} {dayAppointments.length === 1 ? 'apt' : 'apts'}
                      </div>
                    )}
                    {isToday && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Appointments List */}
                <div className="space-y-2 min-h-[130px]">
                  {dayAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-18 p-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg opacity-50">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-600 mb-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center">No appointments</span>
                    </div>
                  ) : (
                    dayAppointments.map((appointment, appointmentIndex) => (
                      <div
                        key={appointment.appointmentId}
                        className="group relative p-2 rounded-lg bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-750/95 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-102 cursor-pointer overflow-hidden animate-slide-up"
                        style={{ animationDelay: `${(index * 100) + (appointmentIndex * 50)}ms` }}
                      >
                        {/* Status Indicator */}
                        <div className={cn(
                          "absolute top-0 left-0 w-full h-0.5 rounded-t-lg",
                          appointment.statusName?.toLowerCase().includes('scheduled') ? "bg-gradient-to-r from-blue-400 to-cyan-400" :
                          appointment.statusName?.toLowerCase().includes('completed') ? "bg-gradient-to-r from-green-400 to-emerald-400" :
                          appointment.statusName?.toLowerCase().includes('cancelled') ? "bg-gradient-to-r from-red-400 to-pink-400" :
                          "bg-gradient-to-r from-orange-400 to-yellow-400"
                        )}></div>

                        <div className="relative z-10">
                          {/* Patient and Doctor Info */}
                          <div className="flex items-start justify-between mb-2 gap-1">
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              {/* Patient Info */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-0.5 rounded bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 group-hover:from-emerald-200 group-hover:to-teal-200 dark:group-hover:from-emerald-800/40 dark:group-hover:to-teal-800/40 transition-all duration-200 flex-shrink-0">
                                  <UserIcon className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {appointment.patientName || getPatientName(appointment.patientId) || 'Unknown Patient'}
                                </span>
                              </div>
                              {/* Doctor Info */}
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-0.5 rounded bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200 flex-shrink-0">
                                  <Stethoscope className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  Dr. {appointment.doctorName || getDoctorName(appointment.doctorId) || 'Unknown Doctor'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Status Badge and Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <div className={cn(
                                "px-1.5 py-0.5 rounded text-xs font-semibold shadow-sm border whitespace-nowrap",
                                appointment.statusName?.toLowerCase().includes('scheduled') ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50" :
                                appointment.statusName?.toLowerCase().includes('completed') ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-700/50" :
                                appointment.statusName?.toLowerCase().includes('cancelled') ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-700/50" :
                                "bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-700/50"
                              )}>
                                {appointment.statusName}
                              </div>
                              
                              {/* Three Dots Menu */}
                              {hasAvailableActions(appointment.statusName) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-5 w-5 opacity-60 hover:opacity-100 transition-opacity group-hover:opacity-100 bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded shadow-sm hover:shadow-md"
                                      disabled={isUpdatingStatus}
                                    >
                                      {isUpdatingStatus ? (
                                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                      ) : (
                                        <MoreVertical className="h-2.5 w-2.5" />
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-lg">
                                    {getAvailableActions(appointment.statusName).map(action => (
                                      <DropdownMenuItem
                                        key={action.id}
                                        onClick={() => {
                                          const statusId = getStatusId(action.id);
                                          if (statusId) {
                                            updateAppointmentStatus(appointment.appointmentId, statusId);
                                          }
                                        }}
                                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/80 focus:bg-gray-50/80 dark:focus:bg-gray-800/80 rounded-lg transition-colors cursor-pointer"
                                      >
                                        {action.icon}
                                        {action.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>

                          {/* Check In Button - Separate Row */}
                          {getStatusId('scheduled') === appointment.statusId && (
                            <div className="mb-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs w-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 border border-green-200/50 dark:border-green-700/50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                                onClick={() => {
                                  const checkedInStatus = appointmentStatuses.find(s => s.name?.toLowerCase() === 'checked-in');
                                  if (checkedInStatus) {
                                    updateAppointmentStatus(appointment.appointmentId, checkedInStatus.id);
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Check In
                              </Button>
                            </div>
                          )}
                          
                          {/* Time and Type */}
                          <div className="space-y-1.5">                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                                <Clock className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              {appointment.slotId && 
                               appointment.slotId !== '00000000-0000-0000-0000-000000000000' && 
                               appointment.startTime && 
                               appointment.endTime ? (
                                <>
                                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                    {format(new Date(`2000-01-01T${appointment.startTime}`), 'h:mm a')}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    - {format(new Date(`2000-01-01T${appointment.endTime}`), 'h:mm a')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                  no time slot
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1 rounded-lg",
                                getTypeColor(appointment.typeName).bg
                              )}>
                                <FileText className={cn("h-3 w-3", getTypeColor(appointment.typeName).icon)} />
                              </div>
                              <span className={cn("text-xs truncate", getTypeColor(appointment.typeName).text)}>
                                {appointment.typeName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper function to reset patient search state
  const resetPatientSearch = () => {
    setPatientSearchValue('');
    setPatientSearchTerm('');
    setPatientSearchOpen(false);
    setPatients([]);
  };

  // Helper function to reset new appointment form
  const resetNewAppointmentForm = () => {
    setNewAppointment({
      doctorId: null,
      doctorName: null,
      patientId: null,
      patientName: null,
      slotId: null,
      typeId: null,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    resetPatientSearch();
    setAvailableSlots([]);
    
    // Reset doctor dropdown state
    setDoctorSearchOpen(false);
    setDoctorSearchValue('');
    setDoctorSearchTerm('');
    setIsSearchingDoctors(false);
    
    // Reset appointment type dropdown state
    setAppointmentTypeOpen(false);
    
    // Reset calendar state
    setIsCalendarOpen(false);
  };

  // Debug effect to track patients state changes
  useEffect(() => {
    console.log('Patients state updated:', patients);
    console.log('Number of patients:', patients.length);
  }, [patients]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Appointments
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage and schedule patient appointments with ease
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setView(view === 'calendar' ? 'table' : 'calendar')}
                  className="gap-2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200"
                >
                  {view === 'calendar' ? (
                    <>
                      <LayoutList className="h-4 w-4" />
                      Table View
                    </>
                  ) : (
                    <>
                      <CalendarDays className="h-4 w-4" />
                      Calendar View
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => setIsNewAppointmentDialogOpen(true)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                  New Appointment
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <AppointmentFilter 
                onSearch={searchAppointments}
                isLoading={isLoading}
                searchParams={searchParams}
                appointments={appointments}
                onParamChange={(params) => setSearchParams(prev => ({ ...prev, ...params }))}
              />
            </div>

            <Dialog 
              open={isNewAppointmentDialogOpen} 
              onOpenChange={(open) => {
                setIsNewAppointmentDialogOpen(open);
                if (!open) {
                  resetNewAppointmentForm();
                } else {
                  // Reset form when opening the dialog
                  resetNewAppointmentForm();
                }
              }}
            >
              <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl p-0 [&>button]:hidden">
                <DialogHeader className="relative pb-3 border-b border-gray-200/70 dark:border-gray-700/70 rounded-t-xl overflow-hidden" style={{ backgroundColor: '#008ea9' }}>
                  {/* Background decoration */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-white/20 rounded-full blur-lg"></div>
                  
                  {/* Content */}
                  <div className="relative z-10 p-3">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/20 shadow-sm ring-1 ring-white/30 relative overflow-hidden">
                          <div className="absolute inset-0 bg-white/20 opacity-0"></div>
                          <Plus className="h-4 w-4 text-white relative z-10" />
                        </div>
                        Create New Appointment
                      </DialogTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white hover:bg-white/20 rounded-lg transition-colors"
                        onClick={() => setIsNewAppointmentDialogOpen(false)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogHeader>                <form onSubmit={handleCreateAppointment} className="space-y-3 p-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient</Label>
                      <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={patientSearchOpen}
                            className="h-12 w-full justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-purple-300/70 hover:shadow-md group relative overflow-hidden"
                          >
                            {isSearchingPatients && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent dark:via-purple-900/20 animate-pulse-ring"></div>
                            )}
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                              <div className={cn(
                                "p-1.5 rounded-lg transition-all duration-200",
                                isSearchingPatients 
                                  ? "bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800/50 dark:to-indigo-800/50 animate-glow-pulse" 
                                  : "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-800/40 dark:group-hover:to-indigo-800/40"
                              )}>
                                {isSearchingPatients ? (
                                  <Loader2 className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                                ) : (
                                  <UserIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                )}
                              </div>
                              {patientSearchValue ? (
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patName}
                                    </span>
                                    {patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patarName && (
                                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate" dir="rtl">
                                        ({patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patarName})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span>ID: {patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patNumber}</span>
                                    {patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patMobile && (
                                      <>
                                        <span>•</span>
                                        <span>{patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patMobile}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-left truncate text-gray-500 dark:text-gray-400">
                                  Search by name (English/Arabic) or phone...
                                </span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[600px] max-w-[90vw] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                          <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                            <div className="relative border-b border-gray-100/60 dark:border-gray-800/60 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-green-50/90 to-emerald-50/80 dark:from-gray-900/90 dark:via-gray-800/95 dark:to-gray-850/90 backdrop-blur-sm overflow-hidden">
                              {/* Animated background patterns */}
                              <div className="absolute inset-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/30 to-transparent dark:via-green-900/20 animate-pulse-slow"></div>
                                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 dark:from-green-800/10 dark:to-emerald-800/10 rounded-full blur-2xl animate-float"></div>
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 dark:from-emerald-800/10 dark:to-teal-800/10 rounded-full blur-xl animate-float-delayed"></div>
                              </div>
                              
                              <div className="flex items-center gap-4 w-full relative z-10 search-input-container patient-theme">
                                {/* Enhanced search icon container */}
                                <div className="relative group search-icon-container transition-all duration-300">
                                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 dark:from-green-600/20 dark:to-emerald-600/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 shadow-lg border border-green-200/50 dark:border-green-700/30 flex-shrink-0 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                    <Search className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-200" />
                                  </div>
                                </div>
                                
                                {/* Enhanced input container */}
                                <div className="flex-1 w-full space-y-2 group">
                                  <div className="relative">
                                    <CommandInput 
                                      placeholder="Search by name (English/Arabic) or phone number..." 
                                      value={patientSearchTerm}
                                      onValueChange={setPatientSearchTerm}
                                      className="w-full border-0 focus:ring-0 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-semibold px-0 py-1 h-auto text-gray-800 dark:text-gray-200 focus:placeholder:text-gray-300 dark:focus:placeholder:text-gray-600 transition-colors duration-200"
                                    />
                                    {/* Animated underline */}
                                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300 group-focus-within:w-full"></div>
                                  </div>
                                  
                                  {/* Enhanced subtitle with search stats */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                          {patientSearchTerm ? `Searching "${patientSearchTerm}"...` : 'Search patients by name or phone'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Search progress indicator */}
                                    {patientSearchTerm && (
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex gap-0.5">
                                          <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
                                          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                                          <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                          {patients.length} found
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Quick search suggestions */}
                                  {!patientSearchTerm && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
                                      <div className="flex gap-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100/80 dark:bg-green-900/30 text-xs font-medium text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/30">
                                          John Smith
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/30">
                                          +966501234567
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <CommandList className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent animate-fade-in-scale"
                              style={{
                                background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)'
                              }}>
                              <CommandEmpty>
                                {isSearchingPatients ? (
                                  <div className="flex flex-col items-center justify-center py-8 animate-fade-in-scale">
                                    <div className="relative p-3 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-3">
                                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-200/50 to-purple-200/50 dark:from-blue-800/20 dark:to-purple-800/20 animate-pulse-ring"></div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 animate-fadeInUp">Searching patients...</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 animate-fadeInUp" style={{animationDelay: '100ms'}}>Please wait while we find matching patients</p>
                                  </div>
                                ) : patientSearchTerm ? (
                                  patientSearchTerm.trim().length < 2 ? (
                                    <div className="text-center py-8 animate-shake">
                                      <div className="p-3 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-3 mx-auto w-fit animate-bounce-in">
                                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                      </div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type at least 2 characters</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        For phone numbers, type at least 3 digits
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 animate-fade-in-scale">
                                      <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 mb-3 mx-auto w-fit animate-bounce-in">
                                        <UserIcon className="h-6 w-6 text-gray-400" />
                                      </div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No patients found</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Try a different search term
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div className="text-center py-8 animate-fade-in-scale">
                                    <div className="p-3 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-3 mx-auto w-fit animate-bounce-in">
                                      <Search className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start typing to search</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Search by patient name or phone number
                                    </p>
                                  </div>
                                )}
                              </CommandEmpty>
                              <CommandGroup className="p-3">
                                {patients.length > 0 && (
                                  <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-blue-50/50 to-purple-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                                        {patients.length} Patient{patients.length !== 1 ? 's' : ''} {patientSearchTerm ? 'Found' : 'Available'}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                                        <div className="w-1 h-1 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {patients.map((patient, index) => (
                                  <CommandItem
                                    key={patient.patientID}
                                    value={`patient-${patient.patientID}`}
                                    onSelect={(currentValue) => {
                                      const patientId = currentValue.replace('patient-', '');
                                      const selectedPatient = patients.find(p => p.patientID.toString() === patientId);
                                      if (selectedPatient) {
                                        const patientName = selectedPatient.patName || selectedPatient.fullName || `Patient #${selectedPatient.patientID}`;
                                        setPatientSearchValue(patientId);
                                        setPatientSearchTerm(patientName); // Also update the search term to show selected patient
                                        setNewAppointment({ 
                                          ...newAppointment, 
                                          patientId: selectedPatient.patientID,
                                          patientName: patientName
                                        });
                                      }
                                      setPatientSearchOpen(false);
                                    }}
                                    className={cn(
                                      "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                      patientSearchValue === patient.patientID.toString()
                                        ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/70 dark:border-green-700/30"
                                        : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20 focus:bg-gradient-to-r focus:from-purple-50 focus:to-indigo-50 dark:focus:from-purple-900/20 dark:focus:to-indigo-900/20 hover:border-purple-200/50 dark:hover:border-purple-700/30",
                                      patients.length > 0 ? 'opacity-100' : 'opacity-0'
                                    )}
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                    }}
                                  >
                                    <div className={cn(
                                      "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                                      patientSearchValue === patient.patientID.toString()
                                        ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
                                        : "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-800/40 dark:group-hover:to-indigo-800/40"
                                    )}>
                                      <UserIcon className={cn(
                                        "h-5 w-5 transition-colors duration-200",
                                        patientSearchValue === patient.patientID.toString()
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-purple-600 dark:text-purple-400"
                                      )} />
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                                          {patient.patName}
                                        </span>
                                        {patient.patarName && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200" dir="rtl">
                                            ({patient.patarName})
                                          </span>
                                        )}

                                      </div>
                                      {patient.patMobile && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                                          <span>{patient.patMobile}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-shrink-0">
                                      {patientSearchValue === patient.patientID.toString() && (
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                          <Check
                                            className="h-5 w-5 text-green-600 dark:text-green-400 scale-110 animate-bounce-in"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Doctor</Label>
                      <Popover open={doctorSearchOpen} onOpenChange={(open) => {
                        setDoctorSearchOpen(open);
                        if (!open) {
                          setDoctorSearchTerm('');
                          setFilteredDoctors(doctors);
                        } else {
                          setFilteredDoctors(doctors);
                        }
                      }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={doctorSearchOpen}
                            className={cn(
                              "h-12 w-full justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-400/70 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-blue-300/70 hover:shadow-md group relative overflow-hidden",
                              isLoadingDropdowns.doctors && "cursor-not-allowed opacity-75"
                            )}
                          >
                            {isLoadingDropdowns.doctors && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent dark:via-blue-900/20 animate-pulse-ring"></div>
                            )}
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                              <div className={cn(
                                "p-1.5 rounded-lg transition-all duration-200",
                                isLoadingDropdowns.doctors 
                                  ? "bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-800/50 dark:to-cyan-800/50 animate-glow-pulse" 
                                  : "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40"
                              )}>
                                {isLoadingDropdowns.doctors ? (
                                  <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                                ) : (
                                  <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                              {doctorSearchValue ? (
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {doctors.find((doctor) => doctor.employeeNumber.toString() === doctorSearchValue)?.fullNameEnglish}
                                    </span>
                                  </div>
                                  {doctors.find((doctor) => doctor.employeeNumber.toString() === doctorSearchValue)?.specializationName && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{doctors.find((doctor) => doctor.employeeNumber.toString() === doctorSearchValue)?.specializationName}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-left truncate text-gray-500 dark:text-gray-400">
                                  {isLoadingDropdowns.doctors ? 'Loading doctors...' : 'Select a doctor'}
                                </span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                          <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                            <div className="relative border-b border-gray-100/60 dark:border-gray-800/60 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-blue-50/90 to-cyan-50/80 dark:from-gray-900/90 dark:via-gray-800/95 dark:to-gray-850/90 backdrop-blur-sm overflow-hidden">
                              {/* Animated background patterns */}
                              <div className="absolute inset-0">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent dark:via-blue-900/20 animate-pulse-slow"></div>
                                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 dark:from-blue-800/10 dark:to-cyan-800/10 rounded-full blur-2xl animate-float"></div>
                                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-200/20 to-teal-200/20 dark:from-cyan-800/10 dark:to-teal-800/10 rounded-full blur-xl animate-float-delayed"></div>
                              </div>
                              
                              <div className="flex items-center gap-4 w-full relative z-10 search-input-container">
                                {/* Enhanced search icon container */}
                                <div className="relative group search-icon-container transition-all duration-300">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                                  <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 shadow-lg border border-blue-200/50 dark:border-blue-700/30 flex-shrink-0 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                    <Search className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
                                  </div>
                                </div>
                                
                                {/* Enhanced input container */}
                                <div className="flex-1 w-full space-y-2 group">
                                  <div className="relative">
                                    <CommandInput 
                                      placeholder="Search doctors by name or specialization..." 
                                      value={doctorSearchTerm}
                                      onValueChange={setDoctorSearchTerm}
                                      className="w-full border-0 focus:ring-0 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-semibold px-0 py-1 h-auto text-gray-800 dark:text-gray-200 focus:placeholder:text-gray-300 dark:focus:placeholder:text-gray-600 transition-colors duration-200"
                                    />
                                    {/* Animated underline */}
                                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-focus-within:w-full"></div>
                                  </div>
                                  
                                  {/* Enhanced subtitle with search stats */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                          {doctorSearchTerm ? `Searching "${doctorSearchTerm}"...` : 'Start typing to search doctors'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Search progress indicator */}
                                    {doctorSearchTerm && (
                                      <div className="flex items-center gap-1.5">
                                        <div className="flex gap-0.5">
                                          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
                                          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                                          <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                          {filteredDoctors.length} found
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Quick search suggestions */}
                                  {!doctorSearchTerm && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
                                      <div className="flex gap-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/30">
                                          Dr. Ahmed
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-100/80 dark:bg-cyan-900/30 text-xs font-medium text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-700/30">
                                          Cardiology
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <CommandList className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent animate-fade-in-scale">
                              <CommandEmpty>
                                {isLoadingDropdowns.doctors ? (
                                  <div className="flex flex-col items-center justify-center py-8 animate-fade-in-scale">
                                    <div className="relative p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-3">
                                      <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-200/50 to-cyan-200/50 dark:from-blue-800/20 dark:to-cyan-800/20 animate-pulse-ring"></div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 animate-fadeInUp">Loading doctors...</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 animate-fadeInUp" style={{animationDelay: '100ms'}}>Please wait while we fetch available doctors</p>
                                  </div>
                                ) : doctorSearchTerm ? (
                                  doctorSearchTerm.trim().length < 2 ? (
                                    <div className="text-center py-8 animate-shake">
                                      <div className="p-3 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-3 mx-auto w-fit animate-bounce-in">
                                        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                      </div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type at least 2 characters</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Search by doctor name or specialization
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 animate-fade-in-scale">
                                      <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 mb-3 mx-auto w-fit animate-bounce-in">
                                        <Stethoscope className="h-6 w-6 text-gray-400" />
                                      </div>
                                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No doctors found</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Try a different search term
                                      </p>
                                    </div>
                                  )
                                ) : (
                                  <div className="text-center py-8 animate-fade-in-scale">
                                    <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-3 mx-auto w-fit animate-bounce-in">
                                      <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start typing to search</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Search by doctor name or specialization
                                    </p>
                                  </div>
                                )}
                              </CommandEmpty>
                              <CommandGroup className="p-3">
                                {filteredDoctors.length > 0 && (
                                  <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-blue-50/50 to-cyan-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                                        {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} {doctorSearchTerm ? 'Found' : 'Available'}
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                                        <div className="w-1 h-1 bg-teal-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {filteredDoctors.map((doctor, index) => (
                                  <CommandItem
                                    key={doctor.employeeNumber}
                                    value={`doctor-${doctor.employeeNumber}`}
                                    onSelect={(currentValue) => {
                                      const doctorId = currentValue.replace('doctor-', '');
                                      const selectedDoctor = doctors.find(d => d.employeeNumber.toString() === doctorId);
                                      if (selectedDoctor) {
                                        setDoctorSearchValue(doctorId);
                                        setNewAppointment({ 
                                          ...newAppointment, 
                                          doctorId: selectedDoctor.employeeNumber, 
                                          doctorName: selectedDoctor.fullNameEnglish,
                                          slotId: null 
                                        });
                                      }
                                      setDoctorSearchOpen(false);
                                    }}
                                    className={cn(
                                      "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                      doctorSearchValue === doctor.employeeNumber.toString()
                                        ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/70 dark:border-blue-700/30"
                                        : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:bg-gradient-to-r focus:from-blue-50 focus:to-cyan-50 dark:focus:from-blue-900/20 dark:focus:to-cyan-900/20 hover:border-blue-200/50 dark:hover:border-blue-700/30",
                                      filteredDoctors.length > 0 ? 'opacity-100' : 'opacity-0'
                                    )}
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                    }}
                                  >
                                    <div className={cn(
                                      "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                                      doctorSearchValue === doctor.employeeNumber.toString()
                                        ? "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                                        : "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40"
                                    )}>
                                      <Stethoscope className={cn(
                                        "h-5 w-5 transition-colors duration-200",
                                        doctorSearchValue === doctor.employeeNumber.toString()
                                          ? "text-blue-600 dark:text-blue-400"
                                          : "text-blue-600 dark:text-blue-400"
                                      )} />
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                                          {doctor.fullNameEnglish}
                                        </span>
                                      </div>
                                      {doctor.specializationName && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                          <span>{doctor.specializationName}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-shrink-0">
                                      {doctorSearchValue === doctor.employeeNumber.toString() && (
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                          <Check
                                            className="h-5 w-5 text-blue-600 dark:text-blue-400 scale-110 animate-bounce-in"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Appointment Date</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isCalendarOpen}
                            className="h-12 w-full justify-start bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/20 focus:border-green-400/70 focus:shadow-lg focus:shadow-green-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-green-300/70 hover:shadow-md group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/20 to-transparent dark:via-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-800/40 dark:group-hover:to-emerald-800/40 transition-all duration-200">
                                <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              {newAppointment.date ? (
                                <div className="flex flex-col min-w-0 flex-1 text-left">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left">
                                    {format(new Date(newAppointment.date), 'EEEE, MMMM d, yyyy')}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(newAppointment.date), 'MMM d')} • Click to change
                                  </span>
                                </div>
                              ) : (
                                <span className="text-left truncate text-gray-500 dark:text-gray-400">
                                  Select appointment date
                                </span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                          <div className="p-4 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 border-b border-green-100 dark:border-green-800/30">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/40">
                                <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Select Date</h3>
                                <p className="text-xs text-green-600 dark:text-green-400">Choose your appointment date</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <CalendarComponent
                              mode="single"
                              selected={newAppointment.date ? new Date(newAppointment.date) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setNewAppointment({ 
                                    ...newAppointment, 
                                    date: format(date, 'yyyy-MM-dd'),
                                    slotId: null
                                  });
                                                                   setIsCalendarOpen(false);
                                }
                              }}
                              disabled={(date) => {
                                // Only allow today and future dates
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // Reset time to start of day
                                const oneYearFromNow = new Date();
                                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                                return date < today || date > oneYearFromNow;
                              }}
                              initialFocus
                              className="rounded-xl border-0"
                              classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center text-green-800 dark:text-green-200 font-semibold",
                                caption_label: "text-base font-bold",
                                nav: "space-x-1 flex items-center",
                                nav_button: "h-8 w-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40 rounded-lg transition-all duration-200 flex items-center justify-center border-0",
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-green-600 dark:text-green-400 rounded-md w-8 font-semibold text-[0.8rem] flex items-center justify-center",
                                row: "flex w-full mt-2",
                                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gradient-to-br [&:has([aria-selected])]:from-green-100 [&:has([aria-selected])]:to-emerald-100 dark:[&:has([aria-selected])]:from-green-900/30 dark:[&:has([aria-selected])]:to-emerald-900/30 [&:has([aria-selected])]:rounded-lg [&:has([aria-selected])]:shadow-lg",
                                day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 rounded-lg transition-all duration-200 flex items-center justify-center",
                                day_selected: "bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 focus:from-green-600 focus:to-emerald-600 shadow-lg font-bold",
                                day_today: "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-200 font-bold border border-green-300 dark:border-green-700",
                                day_outside: "text-gray-400 opacity-50",
                                day_disabled: "text-gray-300 dark:text-gray-600 opacity-50 cursor-not-allowed",
                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                              }}
                            />
                          </div>
                          <div className="p-4 bg-gradient-to-r from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-800 dark:via-green-900/10 dark:to-gray-800 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Minimum date: Today</span>
                              {newAppointment.date && (
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    {format(new Date(newAppointment.date), 'MMM d, yyyy')} selected
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Time Slot (Optional)</Label>
                      <Select
                        value={newAppointment.slotId || ''}
                        onValueChange={(value) => 
                          setNewAppointment({ ...newAppointment, slotId: value })
                        }
                        disabled={!newAppointment.doctorId || isLoadingSlots}
                      >
                        <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-indigo-500/20 focus:border-indigo-400/70 focus:shadow-lg focus:shadow-indigo-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 disabled:opacity-50 disabled:cursor-not-allowed group">
                          <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                            <div className={cn(
                              "p-1.5 rounded-lg transition-all duration-200",
                              isLoadingSlots 
                                ? "bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-800/50 dark:to-purple-800/50 animate-glow-pulse" 
                                : "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 group-hover:from-indigo-200 group-hover:to-purple-200 dark:group-hover:from-indigo-800/40 dark:group-hover:to-purple-800/40"
                            )}>
                              {isLoadingSlots ? (
                                <Loader2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                              ) : (
                                <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </div>
                            {newAppointment.slotId ? (
                              <div className="flex flex-col min-w-0 flex-1 text-left">
                                {(() => {
                                  const selectedSlot = availableSlots.find(slot => slot.slotId === newAppointment.slotId);
                                  if (selectedSlot) {
                                    const startTime = format(new Date(`2000-01-01T${selectedSlot.startTime}`), 'h:mm a');
                                    const endTime = format(new Date(`2000-01-01T${selectedSlot.endTime}`), 'h:mm a');
                                    const startDate = new Date(`2000-01-01T${selectedSlot.startTime}`);
                                    const endDate = new Date(`2000-01-01T${selectedSlot.endTime}`);
                                    const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
                                    return (
                                      <>
                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left">
                                          {startTime} - {endTime}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {durationMinutes} min duration
                                        </span>
                                      </>
                                    );
                                  }
                                  return <span className="font-medium text-gray-900 dark:text-gray-100">Selected Slot</span>;
                                })()}
                              </div>
                            ) : (
                              <span className="text-left truncate text-gray-500 dark:text-gray-400">
                                {isLoadingSlots 
                                  ? "Loading available time slots..." 
                                  : !newAppointment.doctorId 
                                  ? "Select a doctor first"
                                  : "Select a time slot"}
                              </span>                            )}
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map((slot) => (
                            <SelectItem key={slot.slotId} value={slot.slotId}>
                              <div className="flex items-center justify-between w-full">
                                <span>
                                  {format(new Date(`2000-01-01T${slot.startTime}`), 'h:mm a')} - {format(new Date(`2000-01-01T${slot.endTime}`), 'h:mm a')}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {Math.floor((new Date(`2000-01-01T${slot.endTime}`).getTime() - new Date(`2000-01-01T${slot.startTime}`).getTime()) / (1000 * 60))} min
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Appointment Type</Label>
                      <Popover open={appointmentTypeOpen} onOpenChange={setAppointmentTypeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "h-12 w-full justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/20 focus:border-orange-400/70 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-orange-300/70 hover:shadow-md group relative overflow-hidden",
                              isLoadingDropdowns.appointmentTypes && "cursor-not-allowed opacity-75"
                            )}
                          >
                            {isLoadingDropdowns.appointmentTypes && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100/30 to-transparent dark:via-orange-900/20 animate-pulse-ring"></div>
                            )}
                            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                              <div className={cn(
                                "p-1.5 rounded-lg transition-all duration-200",
                                isLoadingDropdowns.appointmentTypes 
                                  ? "bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/50 dark:to-amber-800/50 animate-glow-pulse" 
                                  : "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 group-hover:from-orange-200 group-hover:to-amber-200 dark:group-hover:from-orange-800/40 dark:group-hover:to-amber-800/40"
                              )}>
                                {isLoadingDropdowns.appointmentTypes ? (
                                  <Loader2 className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" />
                                ) : (
                                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                )}
                              </div>
                              {newAppointment.typeId ? (
                                <div className="flex flex-col min-w-0 flex-1 text-left">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left">
                                    {appointmentTypes.find((type) => type.ID === newAppointment.typeId)?.Name || 'Unknown Type'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Click to change type
                                  </span>
                                </div>
                              ) : (
                                <span className="text-left truncate text-gray-500 dark:text-gray-400">
                                  {isLoadingDropdowns.appointmentTypes ? 'Loading appointment types...' : 'Select appointment type'}
                                </span>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                          <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gradient-to-r from-gray-50 via-orange-50 to-amber-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-ring"></div>
                              <div className="flex items-center gap-3 w-full relative z-10">
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 shadow-lg flex-shrink-0">
                                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">Select Appointment Type</h3>
                                  <p className="text-xs text-orange-600 dark:text-orange-400">Choose the type of appointment</p>
                                </div>
                              </div>
                            </div>
                            <CommandList className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent animate-fade-in-scale">
                              <CommandEmpty>
                                {isLoadingDropdowns.appointmentTypes ? (
                                  <div className="flex flex-col items-center justify-center py-8 animate-fade-in-scale">
                                    <div className="relative p-3 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 mb-3">
                                      <Loader2 className="h-6 w-6 animate-spin text-orange-600 dark:text-orange-400" />
                                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200/50 to-amber-200/50 dark:from-orange-800/20 dark:to-amber-800/20 animate-pulse-ring"></div>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 animate-fadeInUp">Loading appointment types...</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 animate-fadeInUp" style={{animationDelay: '100ms'}}>Please wait while we fetch available types</p>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 animate-fade-in-scale">
                                    <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 mb-3 mx-auto w-fit animate-bounce-in">
                                      <Calendar className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No appointment types available</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please contact your administrator</p>
                                  </div>
                                )}
                              </CommandEmpty>
                              <CommandGroup className="p-3">
                                {appointmentTypes.length > 0 && (
                                  <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-orange-50/50 to-amber-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                                        {appointmentTypes.length} Type{appointmentTypes.length !== 1 ? 's' : ''} Available
                                      </p>
                                      <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                                        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {appointmentTypes.map((type, index) => {
                                  const typeColors = getTypeColor(type.Name);
                                  return (
                                  <CommandItem
                                    key={type.ID}
                                    value={`type-${type.ID}`}
                                    onSelect={(currentValue) => {
                                      const typeId = currentValue.replace('type-', '');
                                      setNewAppointment({ ...newAppointment, typeId: typeId });
                                      setAppointmentTypeOpen(false);
                                    }}
                                    className={cn(
                                      "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                      newAppointment.typeId === type.ID
                                        ? typeColors.selected
                                        : typeColors.hover + " focus:bg-gradient-to-r focus:from-gray-50 focus:to-gray-50 dark:focus:from-gray-900/20 dark:focus:to-gray-900/20 hover:border-gray-200/50 dark:hover:border-gray-700/30",
                                      appointmentTypes.length > 0 ? 'opacity-100' : 'opacity-0'
                                    )}
                                    style={{
                                      animationDelay: `${index * 50}ms`,
                                    }}
                                  >
                                    <div className={cn(
                                      "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                                      typeColors.bg
                                    )}>
                                      <Calendar className={cn("h-5 w-5", typeColors.icon)} />
                                    </div>
                                    
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className={cn(
                                          "text-sm font-medium truncate transition-colors duration-200",
                                          newAppointment.typeId === type.ID ? typeColors.text : "text-gray-800 dark:text-gray-200 group-hover:" + typeColors.text.replace('text-', '')
                                        )}>
                                          {type.Name}
                                        </span>
                                        {type.Description && (
                                          <div className="flex items-center gap-4 ml-auto text-xs">
                                            <div className={cn(
                                              "flex items-center gap-1.5 transition-colors duration-200",
                                              newAppointment.typeId === type.ID ? typeColors.text : "text-gray-500 dark:text-gray-400 group-hover:" + typeColors.text.replace('text-', '')
                                            )}>
                                              <div className={cn(
                                                "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                                                typeColors.icon.replace('text-', 'bg-')
                                              )}></div>
                                              <span className="text-xs font-medium truncate">{type.Description}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                      {newAppointment.typeId === type.ID && (
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "w-2 h-2 rounded-full animate-pulse",
                                            typeColors.icon.replace('text-', 'bg-')
                                          )}></div>
                                          <Check className={cn("h-5 w-5 scale-110 animate-bounce-in", typeColors.icon)} />
                                        </div>
                                      )}
                                    </div>
                                  </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
                      <Textarea
                        value={newAppointment.notes}
                        onChange={(e) => 
                          setNewAppointment({ ...newAppointment, notes: e.target.value })
                        }
                        placeholder="Add any additional notes..."
                        className="min-h-[80px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 transition-all duration-300 hover:border-blue-300/70 hover:bg-white/90 dark:hover:bg-gray-800/90"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsNewAppointmentDialogOpen(false)}
                      className="flex-1 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl hover:bg-gray-50/90 dark:hover:bg-gray-700/90 transition-all duration-300"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium" 
                      style={{ backgroundColor: '#008ea9' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#007a94'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#008ea9'}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Appointment'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <div className="mt-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200/60 dark:border-gray-700/40 shadow-lg overflow-hidden">
                {view === 'calendar' ? renderCalendarView() : (
                  <AppointmentList
                    appointments={appointments}
                    appointmentStatuses={appointmentStatuses}
                    doctors={doctors}
                    patients={patients}
                    isLoading={isLoading}
                    isUpdatingStatus={isUpdatingStatus}
                    updateAppointmentStatus={updateAppointmentStatus}
                    enabledActions={['view-history']}
                    onViewHistory={handleViewHistory}
                  />
                )}
              </div>
            </div>          </div>
        </main>

        {/* Patient History Dialog */}
        <PatientHistoryDialog
          appointment={selectedAppointmentForHistory}
          isOpen={isPatientHistoryDialogOpen}
          onClose={() => {
            setIsPatientHistoryDialogOpen(false);
            setSelectedAppointmentForHistory(null);
          }}
        />
      </div>
    </div>
  );
}
