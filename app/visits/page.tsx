'use client';

import React, { useState, useEffect } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardList,
  Loader2,
  User as UserIcon,
  Calendar,
  CreditCard,
  Fingerprint,
  Search,
  CheckCircle2,
  Stethoscope,
  FileCheck,
  ClipboardCheck,
  Filter,
  Clock,
  X,
  History,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Visit, Appointment, User } from '@/types/database';
import { getStatusColor } from '@/lib/utils';
import { fetchAppointmentStatuses } from '@/lib/appointment-utils';
import type { AppointmentStatus } from '@/lib/appointment-utils';
import AppointmentFilter from '@/components/Appointment/AppointmentFilter';
import { AppointmentList } from '@/components/Appointment/AppointmentList';
import { PatientHistoryDialog } from '@/components/PatientHistoryDialog';

const mockPatients = [
  { patientID: 1, fullName: "James Wilson" },
  { patientID: 2, fullName: "Emily Davis" },
  { patientID: 3, fullName: "Robert Taylor" },
  { patientID: 4, fullName: "Sarah Johnson" },
  { patientID: 5, fullName: "Michael Brown" },
];

interface SearchParams {
  doctorId: number | null;
  patientId: number | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  appointmentTypeId: string | null;
  statusId: string | null;
}

interface FilterState {
  status: string;
  startDate: string;
  endDate: string;
  doctorName: string;
  patientName: string;
  visitType: string;
}

const initialFilters: FilterState = {
  status: 'all',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  doctorName: '',
  patientName: '',
  visitType: 'all',
};

const visitTypes = [
  'Regular Check-up',
  'Follow-up',
  'Consultation',
  'Emergency',
  'Procedure',
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'checked-in', label: 'Checked In' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ userId: string; userName: string; role: string } | null>(null);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedAppointmentForHistory, setSelectedAppointmentForHistory] = useState<Appointment | null>(null);
  const [isPatientHistoryDialogOpen, setIsPatientHistoryDialogOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patients, setPatients] = useState(mockPatients);
  const [appointmentStatuses, setAppointmentStatuses] = useState<AppointmentStatus[]>([]);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    doctorId: null,
    patientId: null,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: null,
    endTime: null,
    appointmentTypeId: null,
    statusId: null
  });
  
  const [checkInData, setCheckInData] = useState({
    identificationType: 'passport',
    identificationNumber: '',
    fingerprintCollected: false,
    insuranceCardNumber: '',
    paymentType: 'cash',
  });

  const { toast } = useToast();
  const router = useRouter();

  const handleSearchParamChange = (params: Partial<SearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...params
    }));
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get logged in user info first
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' });
      const userData = await userResponse.json();
      setCurrentUser(userData);

      // Fetch appointment statuses using shared utility
      const statuses = await fetchAppointmentStatuses();
      setAppointmentStatuses(statuses);

      // Initial search with current user context and today's date
      const initialSearchParams = {
        doctorId: userData.role === 'doctor' ? parseInt(userData.userId) : null,
        patientId: null,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: null,
        endTime: null,
        appointmentTypeId: null,
        statusId: null
      };
      
      await handleSearch(initialSearchParams);
    } catch (error) {
      console.error('Error during initial load:', error);
      toast({
        title: 'Error',
        description: 'Failed to load initial data. Please refresh the page.',
        variant: 'destructive',
      });
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setIsProcessing(true);
    try {
      const visitResponse = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: selectedAppointment.appointmentId,
          ...checkInData,
        }),
      });

      if (!visitResponse.ok) {
        throw new Error('Failed to create visit record');
      }

      const statusResponse = await fetch(`/api/appointment/update-status`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: selectedAppointment.appointmentId,
          statusId: 'checked-in',
        }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update appointment status');
      }

      await Promise.all([loadInitialData()]);
      setIsCheckInDialogOpen(false);
      setSelectedAppointment(null);
      setCheckInData({
        identificationType: 'passport',
        identificationNumber: '',
        fingerprintCollected: false,
        insuranceCardNumber: '',
        paymentType: 'cash',
      });

      toast({
        title: 'Success',
        description: 'Patient checked in successfully',
      });
    } catch (error) {
      console.error('Error during checked-in:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check in patient',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewVisit = (patientId: number) => {
    router.push(`/visits/${patientId}`);
  };

  const handleStatusChange = async (visitId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointment/update-status`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId: visitId,
          statusId: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await loadInitialData();
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  const handleSearch = async (searchCriteria: SearchParams) => {
    setIsLoading(true);
    try {
      const finalSearchParams = {
        ...searchCriteria,
        doctorId: currentUser?.role === 'doctor' ? parseInt(currentUser.userId) : searchCriteria.doctorId,
        startDate: searchCriteria.startDate ? new Date(searchCriteria.startDate).toISOString() : null,
        endDate: searchCriteria.endDate ? new Date(searchCriteria.endDate).toISOString() : null
      };

      const response = await fetch('/api/appointment/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(finalSearchParams)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch appointments');
      }
      
      const data = await response.json();
      setAppointments(data);
      setSearchParams(searchCriteria); // Update the local search params state
    } catch (error) {
      console.error('Error searching appointments:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to search appointments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedVisits = visits
    .filter((visit) => {
      return (
        (filters.status === 'all' || visit.status === filters.status) &&
        (!filters.startDate || new Date(visit.appointmentTime) >= new Date(filters.startDate)) &&
        (!filters.endDate || new Date(visit.appointmentTime) <= new Date(filters.endDate)) &&
        (!filters.doctorName || visit.doctorName.toLowerCase().includes(filters.doctorName.toLowerCase())) &&
        (!filters.patientName || visit.patientName.toLowerCase().includes(filters.patientName.toLowerCase())) &&
        (filters.visitType === 'all' || visit.visitType === filters.visitType)
      );
    })
    .sort((a, b) => {
      // Sort by checked-in status first
      if (a.status === 'checked-in' && b.status !== 'checked-in') return -1;
      if (a.status !== 'checked-in' && b.status === 'checked-in') return 1;

      // Then by appointment time
      return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
    });

  const getPatinetName = (patientId: number) => {
    const appointment = appointments.find((appointment) => appointment.patientId === patientId);
    return appointment ? `Patient #${appointment.patientId}` : 'Unknown';
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      // Call the start visit API
      const response = await fetch('/api/visits/start', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentID: appointment.appointmentId,
          doctorID: appointment.doctorId,
          createdBy: currentUser ? parseInt(currentUser.userId) : 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start visit');
      }

      const visitData = await response.json();
      
      if (!visitData.visitId) {
        throw new Error('No visit ID returned from server');
      }

      // Store visit data in localStorage for other pages to use
      localStorage.setItem('currentVisit', JSON.stringify({
        visitId: visitData.visitId,
        appointmentId: appointment.appointmentId
      }));

      // After successful start, navigate to consultation page using the visitId 
      router.push(`/visits/${visitData.visitId}/consultation`);
      
      toast({
        title: "Success",
        description: "Visit started successfully",
      });
    } catch (error) {
      console.error('Error starting visit:', error);
      toast({
        title: "Error",
        description: "Failed to start visit",
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (appointment: Appointment) => {
    setSelectedAppointmentForHistory(appointment);
    setIsPatientHistoryDialogOpen(true);
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch('/api/appointment/update-status', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointmentId,
          statusId: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Reload the appointments
      await loadInitialData();
      
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
                  <ClipboardList className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Patient Visits
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Manage patient check-ins and visits with ease
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <AppointmentFilter 
                onSearch={handleSearch}
                isLoading={isLoading}
                searchParams={searchParams}
                appointments={appointments}
                onParamChange={handleSearchParamChange}
              />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Today's Appointments</h2>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200/60 dark:border-gray-700/40 shadow-lg overflow-hidden">
              <AppointmentList
                appointments={appointments}
                appointmentStatuses={appointmentStatuses}
                doctors={doctors}
                patients={patients}
                isLoading={isLoading}
                isUpdatingStatus={isUpdatingStatus}
                updateAppointmentStatus={updateAppointmentStatus}
                enabledActions={['view-history', 'start-consultation']}
                onViewHistory={handleViewHistory}
                onStartConsultation={handleStartConsultation}
                showDropdownActions={false}
              />
            </div>
          </div>

          <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
            <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
              <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Patient Check-In
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
                  Complete the check-in process for {selectedAppointment ? getPatinetName(selectedAppointment.patientId) : ''}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCheckIn} className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identification Type</Label>
                    <Select
                      value={checkInData.identificationType}
                      onValueChange={(value) =>
                        setCheckInData({ ...checkInData, identificationType: value as 'passport' | 'id' })
                      }
                    >
                      <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-400/70 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl">
                        <SelectItem value="passport" className="hover:bg-blue-50/80 dark:hover:bg-blue-900/20 focus:bg-blue-50/80 dark:focus:bg-blue-900/20 rounded-lg transition-colors">Passport</SelectItem>
                        <SelectItem value="id" className="hover:bg-blue-50/80 dark:hover:bg-blue-900/20 focus:bg-blue-50/80 dark:focus:bg-blue-900/20 rounded-lg transition-colors">National ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ID Number</Label>
                    <Input
                      value={checkInData.identificationNumber}
                      onChange={(e) =>
                        setCheckInData({ ...checkInData, identificationNumber: e.target.value })
                      }
                      placeholder="Enter ID number"
                      className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/20 focus:border-green-400/70 focus:shadow-lg focus:shadow-green-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Insurance Card Number</Label>
                    <Input
                      value={checkInData.insuranceCardNumber}
                      onChange={(e) =>
                        setCheckInData({ ...checkInData, insuranceCardNumber: e.target.value })
                      }
                      placeholder="Enter insurance card number"
                      className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Type</Label>
                    <Select
                      value={checkInData.paymentType}
                      onValueChange={(value) =>
                        setCheckInData({ ...checkInData, paymentType: value as 'cash' | 'visa' })
                      }
                    >
                      <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/20 focus:border-orange-400/70 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl">
                        <SelectItem value="cash" className="hover:bg-orange-50/80 dark:hover:bg-orange-900/20 focus:bg-orange-50/80 dark:focus:bg-orange-900/20 rounded-lg transition-colors">Cash</SelectItem>
                        <SelectItem value="visa" className="hover:bg-orange-50/80 dark:hover:bg-orange-900/20 focus:bg-orange-50/80 dark:focus:bg-orange-900/20 rounded-lg transition-colors">Visa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl border border-gray-200/60 dark:border-gray-700/40">
                    <Fingerprint className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <Label className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Fingerprint Collected</Label>
                    <input
                      type="checkbox"
                      checked={checkInData.fingerprintCollected}
                      onChange={(e) =>
                        setCheckInData({ ...checkInData, fingerprintCollected: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Complete Check-In
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Patient History Dialog */}
          <PatientHistoryDialog
            appointment={selectedAppointmentForHistory}
            isOpen={isPatientHistoryDialogOpen}
            onClose={() => setIsPatientHistoryDialogOpen(false)}
          />
        </main>
      </div>
    </div>
  );
}