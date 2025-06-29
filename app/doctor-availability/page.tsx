'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash, Loader2, User, Search, Filter, AlertCircle, Power, Clock, ChevronsUpDown, Check, Stethoscope } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { cn } from '@/lib/utils';

interface Doctor {
  employeeNumber: number;
  fullNameEnglish: string;
  fullNameArabic: string;
  gender: string;
  email: string;
  mobileNo: string;
  branchName: string;
  branchNo: number;
  department: string;
  jobTitle: string;
  roleName: string;
}

interface DoctorAvailability {
  availabilityId: string;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface ApiErrorResponse {
  title: string;
  status: number;
  instance: string;
  errors: {
    Business?: string[];
    [key: string]: string[] | undefined;
  };
  traceId?: string;
}

const daysOfWeek = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

export default function DoctorAvailabilityPage() {
  const router = useRouter();
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<DoctorAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [newAvailability, setNewAvailability] = useState<Partial<DoctorAvailability>>({
    doctorId: undefined,
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isAvailable: true,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  
  // Search area doctor dropdown state
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [doctorSearchValue, setDoctorSearchValue] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  
  // Dialog doctor dropdown state
  const [dialogDoctorSearchOpen, setDialogDoctorSearchOpen] = useState(false);
  const [dialogDoctorSearchValue, setDialogDoctorSearchValue] = useState('');
  const [dialogDoctorSearchTerm, setDialogDoctorSearchTerm] = useState('');
  const [dialogFilteredDoctors, setDialogFilteredDoctors] = useState<Doctor[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorFilter) {
      fetchDoctorAvailability(selectedDoctorFilter);
    }
  }, [selectedDoctorFilter]);

  useEffect(() => {
    setValidationError(null);
    setApiError(null);
  }, [newAvailability]);

  // Initialize filtered doctors when doctors are loaded
  useEffect(() => {
    setFilteredDoctors(doctors);
    setDialogFilteredDoctors(doctors);
  }, [doctors]);

  // Sync dropdown display with selected filter
  useEffect(() => {
    if (selectedDoctorFilter && doctors.length > 0) {
      setDoctorSearchValue(selectedDoctorFilter);
    }
  }, [selectedDoctorFilter, doctors]);

  // Filter doctors for search area dropdown
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (doctorSearchTerm && doctorSearchTerm.trim().length >= 2) {
        const filtered = doctors.filter((doctor) =>
          doctor.fullNameEnglish?.toLowerCase().includes(doctorSearchTerm.toLowerCase()) ||
          doctor.employeeNumber?.toString().includes(doctorSearchTerm)
        );
        setFilteredDoctors(filtered);
      } else {
        setFilteredDoctors(doctors);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [doctorSearchTerm, doctors]);

  // Filter doctors for dialog dropdown
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dialogDoctorSearchTerm && dialogDoctorSearchTerm.trim().length >= 2) {
        const filtered = doctors.filter((doctor) =>
          doctor.fullNameEnglish?.toLowerCase().includes(dialogDoctorSearchTerm.toLowerCase()) ||
          doctor.employeeNumber?.toString().includes(dialogDoctorSearchTerm)
        );
        setDialogFilteredDoctors(filtered);
      } else {
        setDialogFilteredDoctors(doctors);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dialogDoctorSearchTerm, doctors]);

  const handleStatusChange = async (availability: DoctorAvailability) => {
    try {
      // Optimistically update the UI
      const updatedAvailabilities = availabilities.map(a => 
        a.availabilityId === availability.availabilityId
          ? { ...a, isAvailable: !a.isAvailable }
          : a
      );
      setAvailabilities(updatedAvailabilities);

      const response = await fetch(`/api/doctor-availability/availability/status`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          availabilityId: availability.availabilityId,
          isAvailable: !availability.isAvailable
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setAvailabilities(availabilities);
        
        const data = await response.json() as ApiErrorResponse;
        const errorMessage = data?.errors?.Business?.[0] || data?.title || 'Failed to update availability status';
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success',
        description: `Availability status ${!availability.isAvailable ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Error updating availability status:', error);
      // Revert optimistic update
      setAvailabilities(availabilities);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update availability status',
        variant: 'destructive',
      });
    }
  };

  const validateTimeSlot = (doctorId: number, dayOfWeek: number, startTime: string, endTime: string): boolean => {
    const existingSlots = availabilities.filter(
      slot => slot.doctorId === doctorId && slot.dayOfWeek === dayOfWeek
    );

    const newStart = new Date(`1970-01-01T${startTime}`);
    const newEnd = new Date(`1970-01-01T${endTime}`);

    if (newEnd <= newStart) {
      setValidationError('End time must be after start time');
      return false;
    }

    const hasOverlap = existingSlots.some(slot => {
      const slotStart = new Date(`1970-01-01T${slot.startTime}`);
      const slotEnd = new Date(`1970-01-01T${slot.endTime}`);

      return (
        (newStart >= slotStart && newStart < slotEnd) ||
        (newEnd > slotStart && newEnd <= slotEnd) ||
        (newStart <= slotStart && newEnd >= slotEnd)
      );
    });

    if (hasOverlap) {
      setValidationError('This time slot overlaps with an existing shift');
      return false;
    }

    return true;
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctor/all');
      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      setDoctors(data);

      if (data.length > 0) {
        const firstDoctorId = data[0].employeeNumber.toString();
        setSelectedDoctorFilter(firstDoctorId);
        setDoctorSearchValue(firstDoctorId);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : "Failed to load doctors",
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchDoctorAvailability = async (doctorId: string) => {
    try {
      setIsInitialLoading(true);
      const response = await fetch(`/api/doctor/availability/${doctorId}`);

      if (!response.ok) {
        const errorData = await response.json() as ApiErrorResponse;
        const errorMessage = errorData?.errors?.Business?.[0] || 'Failed to fetch availability';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setAvailabilities(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch availability',
        variant: 'destructive',
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (!newAvailability.doctorId) {
      setValidationError('Please select a doctor');
      return;
    }

    if (!validateTimeSlot(
      newAvailability.doctorId,
      newAvailability.dayOfWeek!,
      newAvailability.startTime!,
      newAvailability.endTime!
    )) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/doctor-availability', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: newAvailability.doctorId,
          dayOfWeek: newAvailability.dayOfWeek,
          startTime: newAvailability.startTime,
          endTime: newAvailability.endTime,
          isAvailable: newAvailability.isAvailable
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiErrorResponse;
        const errorMessage = errorData?.errors?.Business?.[0] || errorData?.title || 'Failed to set availability';
        setApiError(errorMessage);
        return;
      }

      const newAvailabilityData = await response.json() as DoctorAvailability;

      // Add the new availability to the state
      setAvailabilities(prev => [...prev, newAvailabilityData]);
      
      setIsDialogOpen(false);
      setNewAvailability({
        doctorId: undefined,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      });
      setDialogDoctorSearchValue('');
      setDialogDoctorSearchTerm('');
      setDialogFilteredDoctors(doctors);
      
      toast({
        title: 'Success',
        description: 'Availability has been set successfully',
      });
    } catch (error) {
      console.error('Error setting availability:', error);
      setApiError(error instanceof Error ? error.message : 'Failed to set availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAvailability?.availabilityId) {
      toast({
        title: 'Error',
        description: 'Invalid availability selected for deletion',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    const availabilityToDelete = selectedAvailability;

    try {
      // Optimistically remove the availability from the state
      setAvailabilities(prev => 
        prev.filter(a => a.availabilityId !== availabilityToDelete.availabilityId)
      );

      const response = await fetch(
        `/api/doctor-availability/${availabilityToDelete.availabilityId}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Revert optimistic deletion on error
        setAvailabilities(prev => [...prev, availabilityToDelete]);
        
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to delete availability';

        if (contentType?.includes('application/json')) {
          const data = await response.json() as ApiErrorResponse;
          errorMessage = data?.errors?.Business?.[0] || data?.title || errorMessage;
        } else {
          errorMessage = await response.text() || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedAvailability(null);
      
      toast({
        title: 'Success',
        description: 'Availability has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting availability:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete availability. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDoctorName = (doctorId: number) => {
    const doctor = doctors.find(d => d.employeeNumber === doctorId);
    return doctor ? doctor.fullNameEnglish : `Doctor #${doctorId}`;
  };

  const filteredAvailabilities = availabilities.filter(availability => {
    const doctorName = getDoctorName(availability.doctorId).toLowerCase();
    let day = daysOfWeek.find(day => day.value === availability.dayOfWeek.toString());
    const searchTerm = searchQuery.toLowerCase().trim();
    
    const matchesSearch = searchTerm === '' ||
      doctorName.includes(searchTerm) ||
      (day?.label?.toLowerCase().includes(searchTerm) ?? false);

    const matchesDay = selectedDayFilter === 'all' || 
      availability.dayOfWeek.toString() === selectedDayFilter;

    return matchesSearch && matchesDay;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDayFilter('all');
    setDoctorSearchValue('');
    setDoctorSearchTerm('');
    setSelectedDoctorFilter('');
  };

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen bg-secondary/30">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium">Loading doctors...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Doctor Availability
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage doctor schedules and availability
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => router.push('/doctor-slots')}
                  className="gap-2 shadow-lg hover:shadow-md transition-all"
                  variant="outline"
                  size="lg"
                >
                  <Clock className="h-5 w-5" />
                  Time Slots Management
                </Button>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  className="gap-2 shadow-lg hover:shadow-md transition-all"
                  size="lg"
                >
                  <Plus className="h-5 w-5" />
                  Add Availability
                </Button>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
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
                      "w-[400px] justify-between h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-400/70 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-blue-300/70 hover:shadow-md group relative overflow-hidden"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                        <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      {doctorSearchValue ? (
                        <div className="flex flex-col min-w-0 flex-1 items-start text-left">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left w-full">
                            {doctors.find((doctor) => doctor.employeeNumber.toString() === doctorSearchValue)?.fullNameEnglish}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 text-left w-full">
                            ID: {doctors.find((doctor) => doctor.employeeNumber.toString() === doctorSearchValue)?.employeeNumber}
                          </span>
                        </div>
                      ) : (
                        <span className="text-left truncate text-gray-500 dark:text-gray-400 w-full">
                          Select Doctor
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                  <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                    <div className="relative border-b border-gray-100/60 dark:border-gray-800/60 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-blue-50/90 to-cyan-50/80 dark:from-gray-900/90 dark:via-gray-800/95 dark:to-gray-850/90">
                      <div className="flex items-center gap-4 w-full relative z-10">
                        <div className="relative group transition-all duration-300">
                          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 shadow-lg border border-blue-200/50 dark:border-blue-700/30 flex-shrink-0 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                            <Search className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
                          </div>
                        </div>
                        
                        <div className="flex-1 w-full space-y-2 group">
                          <div className="relative">
                            <CommandInput 
                              placeholder="Search doctors by name or ID..." 
                              value={doctorSearchTerm}
                              onValueChange={setDoctorSearchTerm}
                              className="w-full border-0 focus:ring-0 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-semibold px-0 py-1 h-auto text-gray-800 dark:text-gray-200"
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-focus-within:w-full"></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                  {doctorSearchTerm ? `Searching "${doctorSearchTerm}"...` : 'Start typing to search doctors'}
                                </p>
                              </div>
                            </div>
                            
                            {doctorSearchTerm && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {filteredDoctors.length} found
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CommandList className="max-h-80 overflow-y-auto">
                      <CommandEmpty>
                        {doctorSearchTerm ? (
                          doctorSearchTerm.trim().length < 2 ? (
                            <div className="text-center py-8">
                              <div className="p-3 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-3 mx-auto w-fit">
                                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type at least 2 characters</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Search by doctor name or employee ID</p>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 mb-3 mx-auto w-fit">
                                <Stethoscope className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No doctors found</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try a different search term</p>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-8">
                            <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-3 mx-auto w-fit">
                              <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start typing to search</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Search by doctor name or employee ID</p>
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup className="p-3">
                        {filteredDoctors.length > 0 && (
                          <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-blue-50/50 to-cyan-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                                {filteredDoctors.length} Doctor{filteredDoctors.length !== 1 ? 's' : ''} {doctorSearchTerm ? 'Found' : 'Available'}
                              </p>
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
                                setSelectedDoctorFilter(doctorId);
                                setDoctorSearchOpen(false);
                                setDoctorSearchTerm('');
                              }
                            }}
                            className={cn(
                              "flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group",
                              doctorSearchValue === doctor.employeeNumber.toString()
                                ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/70 dark:border-blue-700/30"
                                : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20"
                            )}
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                              <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                                  {doctor.fullNameEnglish}
                                </span>
                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 ml-auto">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-colors duration-200"></div>
                                  <span className="text-xs font-medium">ID: {doctor.employeeNumber}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {doctorSearchValue === doctor.employeeNumber.toString() && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
              <Select value={selectedDayFilter} onValueChange={setSelectedDayFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Doctor</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAvailabilities.map((availability) => (
                  <TableRow key={availability.availabilityId} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">
                          {getDoctorName(availability.doctorId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">
                          {daysOfWeek.find(day => day.value === availability.dayOfWeek.toString())?.label}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{availability.startTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{availability.endTime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        availability.isAvailable
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {availability.isAvailable ? 'Available' : 'Unavailable'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 transition-colors rounded-lg ${
                            availability.isAvailable 
                              ? 'hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400'
                              : 'hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900 dark:hover:text-green-400'
                          }`}
                          onClick={() => handleStatusChange(availability)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                          onClick={() => {
                            setSelectedAvailability(availability);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAvailabilities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-lg bg-muted/20 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-muted-foreground">
                          No availabilities found
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery || selectedDayFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Get started by adding a new availability schedule'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setValidationError(null);
              setApiError(null);
              setDialogDoctorSearchValue('');
              setDialogDoctorSearchTerm('');
              setDialogFilteredDoctors(doctors);
              setNewAvailability({
                doctorId: undefined,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true,
              });
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Availability</DialogTitle>
                <DialogDescription>
                  Set your availability schedule for a specific day
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {(validationError || apiError) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError || apiError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Doctor</Label>
                    <Popover open={dialogDoctorSearchOpen} onOpenChange={(open) => {
                      setDialogDoctorSearchOpen(open);
                      if (!open) {
                        setDialogDoctorSearchTerm('');
                        setDialogFilteredDoctors(doctors);
                      } else {
                        setDialogFilteredDoctors(doctors);
                      }
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={dialogDoctorSearchOpen}
                          className={cn(
                            "w-full justify-between h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-400/70 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-blue-300/70 hover:shadow-md group relative overflow-hidden"
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                              <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            {dialogDoctorSearchValue ? (
                              <div className="flex flex-col min-w-0 flex-1 text-left items-start">
                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left w-full">
                                  {doctors.find((doctor) => doctor.employeeNumber.toString() === dialogDoctorSearchValue)?.fullNameEnglish}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 text-left w-full">
                                  ID: {doctors.find((doctor) => doctor.employeeNumber.toString() === dialogDoctorSearchValue)?.employeeNumber}
                                </span>
                              </div>
                            ) : (
                              <span className="text-left truncate text-gray-500 dark:text-gray-400 w-full">
                                Select a doctor
                              </span>
                            )}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                        <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                          <div className="relative border-b border-gray-100/60 dark:border-gray-800/60 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-blue-50/90 to-cyan-50/80 dark:from-gray-900/90 dark:via-gray-800/95 dark:to-gray-850/90">
                            <div className="flex items-center gap-4 w-full relative z-10">
                              <div className="relative group transition-all duration-300">
                                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 shadow-lg border border-blue-200/50 dark:border-blue-700/30 flex-shrink-0 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                  <Search className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
                                </div>
                              </div>
                              
                              <div className="flex-1 w-full space-y-2 group">
                                <div className="relative">
                                  <CommandInput 
                                    placeholder="Search doctors by name or ID..." 
                                    value={dialogDoctorSearchTerm}
                                    onValueChange={setDialogDoctorSearchTerm}
                                    className="w-full border-0 focus:ring-0 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-semibold px-0 py-1 h-auto text-gray-800 dark:text-gray-200"
                                  />
                                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-focus-within:w-full"></div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                        {dialogDoctorSearchTerm ? `Searching "${dialogDoctorSearchTerm}"...` : 'Start typing to search doctors'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {dialogDoctorSearchTerm && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {dialogFilteredDoctors.length} found
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <CommandList className="max-h-80 overflow-y-auto">
                            <CommandEmpty>
                              {dialogDoctorSearchTerm ? (
                                dialogDoctorSearchTerm.trim().length < 2 ? (
                                  <div className="text-center py-8">
                                    <div className="p-3 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 mb-3 mx-auto w-fit">
                                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Type at least 2 characters</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Search by doctor name or employee ID</p>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 mb-3 mx-auto w-fit">
                                      <Stethoscope className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No doctors found</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try a different search term</p>
                                  </div>
                                )
                              ) : (
                                <div className="text-center py-8">
                                  <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-3 mx-auto w-fit">
                                    <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start typing to search</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Search by doctor name or employee ID</p>
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup className="p-3">
                              {dialogFilteredDoctors.length > 0 && (
                                <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-blue-50/50 to-cyan-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                                      {dialogFilteredDoctors.length} Doctor{dialogFilteredDoctors.length !== 1 ? 's' : ''} {dialogDoctorSearchTerm ? 'Found' : 'Available'}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {dialogFilteredDoctors.map((doctor, index) => (
                                <CommandItem
                                  key={doctor.employeeNumber}
                                  value={`dialog-doctor-${doctor.employeeNumber}`}
                                  onSelect={(currentValue) => {
                                    const doctorId = currentValue.replace('dialog-doctor-', '');
                                    const selectedDoctor = doctors.find(d => d.employeeNumber.toString() === doctorId);
                                    if (selectedDoctor) {
                                      setDialogDoctorSearchValue(doctorId);
                                      setNewAvailability({ ...newAvailability, doctorId: selectedDoctor.employeeNumber });
                                      setDialogDoctorSearchOpen(false);
                                      setDialogDoctorSearchTerm('');
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group",
                                    dialogDoctorSearchValue === doctor.employeeNumber.toString()
                                      ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/70 dark:border-blue-700/30"
                                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20"
                                  )}
                                >
                                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                                    <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 text-left">
                                        {doctor.fullNameEnglish}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 ml-auto">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-colors duration-200"></div>
                                        <span className="text-xs font-medium text-left">ID: {doctor.employeeNumber}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {dialogDoctorSearchValue === doctor.employeeNumber.toString() && (
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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

                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select
                      value={newAvailability.dayOfWeek?.toString()}
                      onValueChange={(value) => 
                        setNewAvailability({ ...newAvailability, dayOfWeek: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={newAvailability.startTime}
                        onChange={(e) => 
                          setNewAvailability({ ...newAvailability, startTime: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={newAvailability.endTime}
                        onChange={(e) => 
                          setNewAvailability({ ...newAvailability, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Available</Label>
                    <Switch
                      checked={newAvailability.isAvailable}
                      onCheckedChange={(checked) =>
                        setNewAvailability({ ...newAvailability, isAvailable: checked })
                      }
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Availability...
                    </>
                  ) : (
                    'Set Availability'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Availability</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this availability? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedAvailability(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}