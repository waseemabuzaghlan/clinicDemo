'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Loader2, User, CalendarDays, AlertCircle, ChevronsUpDown, Check, Stethoscope, Search } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { format } from 'date-fns';

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

interface TimeSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export default function DoctorSlotsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedIsBooked, setSelectedIsBooked] = useState<string>('false');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [generateSlots, setGenerateSlots] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    slotDurationMinutes: 60
  });
  
  // Doctor dropdown state
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
  const [doctorSearchValue, setDoctorSearchValue] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchDoctorSlots();
    }
  }, [selectedDoctor, selectedDate, selectedIsBooked]);

  // Initialize filtered doctors when doctors are loaded
  useEffect(() => {
    setFilteredDoctors(doctors);
  }, [doctors]);

  // Filter doctors for dropdown
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

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      const doctorsList = data.filter((user: any) => user.roleName === 'Doctor').map((doctor: any) => ({
        employeeNumber: doctor.employeeNumber,
        fullNameEnglish: doctor.fullNameEnglish,
      }));
      setDoctors(doctorsList);

      if (doctorsList.length > 0) {
        setSelectedDoctor(doctorsList[0].employeeNumber.toString());
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : "Failed to load doctors",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctorSlots = async () => {
    if (!selectedDoctor || !selectedDate) {
      console.warn('Missing required parameters for fetching doctor slots');
      return;
    }
    
    try {
      setIsSlotsLoading(true);
      const response = await fetch(`/api/doctor/slots/${selectedDoctor}/${selectedIsBooked}/${selectedDate}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch time slots' }));
        throw new Error(errorData.message || 'Failed to fetch time slots');
      }

      const data = await response.json();
      console.log('Fetched slots:', data); // Debug log
      setTimeSlots(data);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch time slots",
        variant: "destructive",
      });
      setTimeSlots([]); // Reset time slots on error
    } finally {
      setIsSlotsLoading(false);
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setValidationError(null);

    try {
      const response = await fetch('/api/doctor/slots/generate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          startDate: new Date(generateSlots.startDate).toISOString(),
          endDate: new Date(generateSlots.endDate).toISOString(),
          slotDurationMinutes: parseInt(generateSlots.slotDurationMinutes.toString())
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate time slots');
      }

      const data = await response.json();
      
      setIsGenerateDialogOpen(false);
      toast({
        title: "✨ Success!",
        description: (
          <div className="flex flex-col gap-1">
            <p>Time slots have been generated successfully.</p>
            <p className="text-sm text-muted-foreground">
              Duration: {generateSlots.slotDurationMinutes} minutes
              <br />
              Period: {format(new Date(generateSlots.startDate), 'MMM dd, yyyy')} - {format(new Date(generateSlots.endDate), 'MMM dd, yyyy')}
            </p>
          </div>
        ),
        className: "bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800",
      });

      // Reset form
      setGenerateSlots({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        slotDurationMinutes: 60
      });

      // Refresh slots for the selected date
      if (selectedDoctor) {
        fetchDoctorSlots();
      }
    } catch (error) {
      console.error('Error generating time slots:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to generate time slots",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
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
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Time Slots Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage doctor appointment slots
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setIsGenerateDialogOpen(true)}
                className="gap-2 shadow-lg hover:shadow-md transition-all"
                size="lg"
              >
                <CalendarDays className="h-5 w-5" />
                Generate Time Slots
              </Button>
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
                      {selectedDoctor ? (
                        <div className="flex flex-col min-w-0 flex-1 items-start text-left">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left w-full">
                            {doctors.find((doctor) => doctor.employeeNumber.toString() === selectedDoctor)?.fullNameEnglish}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 text-left w-full">
                            ID: {doctors.find((doctor) => doctor.employeeNumber.toString() === selectedDoctor)?.employeeNumber}
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
                              const selectedDoctorObj = doctors.find(d => d.employeeNumber.toString() === doctorId);
                              if (selectedDoctorObj) {
                                setSelectedDoctor(doctorId);
                                setDoctorSearchOpen(false);
                                setDoctorSearchTerm('');
                              }
                            }}
                            className={cn(
                              "flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group",
                              selectedDoctor === doctor.employeeNumber.toString()
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
                              {selectedDoctor === doctor.employeeNumber.toString() && (
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
              <Select value={selectedIsBooked} onValueChange={setSelectedIsBooked}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Booked Slots</SelectItem>
                  <SelectItem value="false">Available Slots</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-lg">
            <div className="p-6">
              {isSlotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : timeSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {timeSlots.map((slot) => (
                    <div
                      key={slot.slotId}
                      className={`p-4 rounded-lg border ${
                        !slot.isBooked
                          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className={`h-4 w-4 ${
                            !slot.isBooked ? 'text-green-600' : 'text-red-600'
                          }`} />
                          <span className="font-medium">{format(new Date(`2000-01-01T${slot.startTime}`), 'h:mm a')}</span>
                        </div>
                        <span className={`text-sm ${
                          !slot.isBooked
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {!slot.isBooked ? 'Available' : 'Booked'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(`2000-01-01T${slot.endTime}`), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No time slots available
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Generate Time Slots" to create new slots
                  </p>
                </div>
              )}
            </div>
          </div>

          <Dialog open={isGenerateDialogOpen} onOpenChange={(open) => {
            setIsGenerateDialogOpen(open);
            if (!open) {
              setValidationError(null);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Time Slots</DialogTitle>
                <DialogDescription>
                  Generate time slots for doctor appointments
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerateSlots} className="space-y-6">
                {validationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={generateSlots.startDate}
                      onChange={(e) => 
                        setGenerateSlots({ ...generateSlots, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={generateSlots.endDate}
                      onChange={(e) => 
                        setGenerateSlots({ ...generateSlots, endDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Slot Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      max="120"
                      step="15"
                      value={generateSlots.slotDurationMinutes}
                      onChange={(e) => 
                        setGenerateSlots({ ...generateSlots, slotDurationMinutes: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Slots...
                    </>
                  ) : (
                    'Generate Slots'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}