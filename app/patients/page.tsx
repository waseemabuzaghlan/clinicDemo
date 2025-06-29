'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {SquareUserRound  , UserRound ,Users, Search, Settings, MessageSquare, Phone, Plus, UserPlus, CreditCard, Fingerprint, FileCheck, ClipboardList, Loader2, Calendar,User, ChevronDown, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PhoneInput, { CountryData } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Label } from '@/components/ui/label';
import { PatientHistoryDialog } from '@/components/PatientHistoryDialog';

interface Patient {
  patNumber: number;
  patName: string;
  patarName: string;
  dateOfBirth: string;
  profileImage: string;
  photo?: string; // base64 string
  email?: string;
  patMobile?: string;
  patSex?: string;
  patAge?: string;
  patday?: string;
  address?: string;
  identificationType?: 'passport' | 'id';
  identificationNumber?: string;
  fingerprintCollected?: boolean;
  insuranceCardNumber?: string;
  nationality?: string;
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
  patnano?: string;
  documentID?: string;
  ocrValue?: string;
  natID?: string;
  branch?: string;
  trano?: string;
  patientType?: number;
  countryId?: number;
  isLinked?: boolean;
  flag?: number;
}

// Add missing properties `id` and `profileImage` to match the `Patient` type
const initialNewPatient: Patient = {
  patNumber: 0,
  patName: '',
  patarName: '',
  dateOfBirth: '',
  profileImage: '',
  photo: '',
  email: '',
  patMobile: '',
  patSex: '',
  address: '',
  identificationType: 'passport',
  identificationNumber: '',
  fingerprintCollected: false,
  insuranceCardNumber: '',
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // Number of cards per page  // Add state for each search field
  const [searchName, setSearchName] = useState('');
  const [searchArabicName, setSearchArabicName] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [searchIdNumber, setSearchIdNumber] = useState('');
  // Add state for country code
  const [searchCountryCode, setSearchCountryCode] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Patient History Dialog state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  // Loading state for patient details navigation
  const [loadingPatientId, setLoadingPatientId] = useState<number | null>(null);


  // Remove searchQuery from dependencies and fetching logic
  // Add a handler for the search button
  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(`${Date.now()}`); // Just to trigger useEffect, value is not used
  };

  useEffect(() => {
    // Only fetch if handleSearch was triggered (searchQuery changes)
    const fetchPatients = async () => {
      setIsSearchLoading(true);
      try {        const body = {
          patName: searchName,
          patarName: searchArabicName,
          patMobile: searchMobile,
          mobileCountryCode: searchCountryCode ? Number(searchCountryCode) : 0,
          patNumber: null,
          identificationNumber: searchIdNumber,
        };

        const res = await fetch(`/api/patients/search`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        const mappedPatients = (data.patientList ?? []).map((card: any): Patient => ({
          patNumber: card.patNumber,
          patName: card.patName || '',
          patarName: card.patarName || '',
          dateOfBirth: card.patDateOfBirth || '',
          profileImage: '',
          photo: '',
          email: card.patEmail || '',
          patMobile: card.patMobile || '',
          patSex: card.patSex || '',
          patAge: card.patAge || '',
          patday: card.patday || '',
          address: '',
          identificationType: 'passport',
          identificationNumber: '',
          fingerprintCollected: false,
          insuranceCardNumber: '',
          nationality: '',
          createdBy: '',
          modifiedBy: '',
          createdAt: '',
          modifiedAt: '',
          patnano: '',
          documentID: '',
          ocrValue: '',
          natID: '',
          branch: '',
          trano: '',
          patientType: 0,
          countryId: 0,
          isLinked: card.isLinked || false,
          flag: 0,        }));

        setPatients(mappedPatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast({
          title: 'Error',
          description: 'Could not load patient data.',
        });
      } finally {
        setIsSearchLoading(false);
      }
    };

    // Only fetch if handleSearch was triggered (searchQuery changes)
    if (searchQuery) {
      fetchPatients();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Remove the filteredPatients logic that uses searchQuery
  const filteredPatients = patients;

  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fetch patient details and navigate to details page
  const handleViewDetails = async (patNumber: number) => {
    try {
      setLoadingPatientId(patNumber);
      // Optionally, you can prefetch or cache here, but for now just navigate
      router.push(`/patients/details?id=${patNumber}`);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not load patient details.' });
    } finally {
      // Reset loading state after a short delay to ensure the navigation has started
      setTimeout(() => setLoadingPatientId(null), 500);
    }
  };
  // View visits for a patient
  const handleViewVisits = (patientId: number) => {
    router.push(`/visits/${patientId}`);
  };

  // Handle patient history dialog
  const handleViewPatientHistory = (patient: Patient) => {
    // Create an appointment-like object for the dialog
    const appointmentData = {
      patientId: patient.patNumber,
      patientName: patient.patName,
      // Add other required fields that the dialog expects
    };
    setSelectedPatient(appointmentData);
    setIsHistoryDialogOpen(true);
  };

  // Handle creating appointment for a patient
  const handleCreateAppointment = (patient: Patient) => {
    // Navigate to appointments page with patient info as query parameters
    const params = new URLSearchParams({
      patientId: patient.patNumber.toString(),
      patientName: patient.patName,
      openDialog: 'true'
    });
    router.push(`/appointments?${params.toString()}`);
  };

const formatAge = (patAge: string, patday: string): string => {
    if (!patAge || !patday) return 'N/A';
    return `${patAge} ${patday}`;
};

const calculateAge = (dateOfBirth: string): string => {
    if (!dateOfBirth) return 'N/A';
    
    // Parse DD/MM/YYYY manually
    const parts = dateOfBirth.split('/');
    if (parts.length !== 3) return 'N/A';

    const [dayStr, monthStr, yearStr] = parts;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JavaScript months are 0-based
    const year = parseInt(yearStr, 10);

    // Validate parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year) || 
        day < 1 || day > 31 || month < 0 || month > 11 || 
        year < 1900 || year > new Date().getFullYear()) {
        return 'N/A';
    }

    const birthDate = new Date(year, month, day);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
        return 'N/A';
    }

    // Calculate age
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += prevMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years > 0) {
        return `${years} years old`;
    } else if (months > 0) {
        return `${months} months old`;
    } else if (days >= 0) {
        return `${days} days old`;
    } else {
        return 'N/A';
    }
};
  // Render the header and buttons regardless of the search query
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Patients
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Search and manage patient records, view patient history, and create new visits
                  </p>
                </div>
              </div>              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md overflow-hidden bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('grid')}
                    className={view === 'grid' ? 'bg-primary/10 text-primary' : ''}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <rect width="7" height="7" x="3" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="3" rx="1" />
                      <rect width="7" height="7" x="14" y="14" rx="1" />
                      <rect width="7" height="7" x="3" y="14" rx="1" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView('list')}
                    className={view === 'list' ? 'bg-primary/10 text-primary' : ''}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <line x1="3" x2="21" y1="6" y2="6" />
                      <line x1="3" x2="21" y1="12" y2="12" />
                      <line x1="3" x2="21" y1="18" y2="18" />
                    </svg>
                  </Button>
                </div>
                
                <Button
                  onClick={() => router.push('/patients/new')}
                  className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Patient
                </Button>
              </div>
            </div>
          </div>          {/* Search Filter Section - Similar to AppointmentFilter */}
          <div className="mb-4 border border-gray-200 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
            {/* Header - Always Visible */}
            <div 
              className="p-3 cursor-pointer transition-all duration-300 group bg-gray-50 hover:bg-gray-100"
              onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                      <Search className="h-4 w-4 text-gray-600" />
                    </div>
                    {(searchName || searchArabicName || searchMobile) && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">Patient Search</h3>
                      {(searchName || searchArabicName || searchMobile) && (
                        <div className="px-2 py-0.5 bg-green-100 rounded-full border border-green-200">
                          <span className="text-xs font-medium text-green-700">Active</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 text-xs mt-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Search by name or mobile</span>
                      </div>
                      {searchQuery && (
                        <>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span className="text-green-600">{patients.length} found</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white border border-gray-200">
                    <ChevronDown 
                      className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${
                        isSearchExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
              </div>
            </div>            {/* Expandable Search Form */}
            <div className={`transition-all duration-300 ease-in-out ${
              isSearchExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              <div className="p-4">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSearch();
                  }}
                  className="space-y-4"
                >                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="englishName" className="text-sm font-medium text-gray-700 dark:text-gray-300">English Name</Label>
                      <Input
                        id="englishName"
                        placeholder="Enter patient name"
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                        className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400/70 transition-all duration-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="arabicName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Arabic Name</Label>
                      <Input
                        id="arabicName"
                        placeholder="Enter Arabic name"
                        value={searchArabicName}
                        onChange={e => setSearchArabicName(e.target.value)}
                        className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400/70 transition-all duration-300"
                      />
                    </div>                      <div className="space-y-2">
                      <Label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</Label>
                      <div className="relative phone-input-container">
                        <PhoneInput
                          country={'jo'}
                          value={searchCountryCode + searchMobile}
                          onChange={(val, data: CountryData) => {
                            if (data && 'dialCode' in data && data.dialCode) {
                              setSearchCountryCode(data.dialCode);
                              const codeStr = data.dialCode;
                              let number = val.startsWith(codeStr)
                                ? val.slice(codeStr.length).replace(/^0+/, '')
                                : val.replace(/^0+/, '');
                              setSearchMobile(number);
                            } else {
                              setSearchCountryCode('');
                              setSearchMobile(val);
                            }
                          }}
                          inputProps={{
                            id: "mobileNumber",
                            placeholder: 'Enter mobile number',
                            className: 'w-full h-12 border-none outline-none bg-transparent text-sm px-3 py-2 focus:ring-0',
                          }}
                          inputStyle={{
                            width: '100%',
                            height: '48px',
                            border: '1px solid rgba(229, 231, 235, 0.6)',
                            background: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '0.875rem',
                            padding: '0.75rem',
                            paddingLeft: '60px',
                            borderRadius: '0.75rem',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'none',
                          }}
                          buttonStyle={{
                            width: '52px',
                            height: '46px',
                            border: 'none',
                            background: 'transparent',
                            borderRadius: '0.75rem 0 0 0.75rem',
                            padding: '0 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          dropdownStyle={{
                            position: 'absolute',
                            top: 'auto',
                            bottom: '100%',
                            marginBottom: '8px',
                            maxHeight: '200px',
                            width: '300px',
                            zIndex: 99999,
                          }}
                          searchStyle={{
                            padding: '8px 12px',
                            margin: '8px',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                          containerClass="w-full react-tel-input"
                          enableSearch
                          disableDropdown={false}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">ID Number</Label>
                      <Input
                        id="idNumber"
                        placeholder="Enter ID or passport number"
                        value={searchIdNumber}
                        onChange={e => setSearchIdNumber(e.target.value)}
                        className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-400/70 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <Button 
                      type="button"
                      variant="outline"                      onClick={() => {
                        setSearchName('');
                        setSearchArabicName('');
                        setSearchMobile('');
                        setSearchIdNumber('');
                        setSearchCountryCode('');
                        setSearchQuery('');
                        setPatients([]);
                      }}
                      className="gap-2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 transition-all duration-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clear
                    </Button>
                      <Button 
                      type="submit" 
                      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={isSearchLoading}
                    >
                      {isSearchLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Search Patients
                        </>
                      )}
                    </Button></div>
                </form>
              </div>
            </div>
          </div>          {/* Render note or results based on last search fields */}
          {isSearchLoading ? (
            <div className="flex items-center justify-center min-h-[40vh] text-center w-full">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full border border-gray-100 dark:border-gray-700">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Searching Patients...
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  Please wait while we search for patients matching your criteria.
                </p>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ) : (!searchQuery) ? (
            <div className="flex items-center justify-center min-h-[40vh] text-center w-full">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full border border-gray-100 dark:border-gray-700">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Find Patients
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  Enter search criteria in the form above to find patients.
                </p>                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You can search by English name, Arabic name, mobile number, or ID number.
                </p>
              </div>
            </div>
          ) : (searchQuery && paginatedPatients.length === 0) ? (
            <div className="flex items-center justify-center min-h-[30vh] text-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 max-w-lg border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  No patients found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We couldn't find any patients matching your search criteria.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search terms or using different filters.
                </p>
                <Button 
                  className="mt-4 gap-2" 
                  variant="outline"
                  onClick={() => {
                    setSearchName('');
                    setSearchArabicName('');
                    setSearchMobile('');
                    setSearchCountryCode('');
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Clear Search
                </Button>
              </div>
            </div>
          ) : (            // Render patient list and pagination when a search has been performed and there are results
            <>
              {/* Search Results Stats Card - Moved to top */}
              {searchQuery && paginatedPatients.length > 0 && (
                <div className="mb-6">
                  <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 dark:border-gray-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                          </p>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">
                            Search Results
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Page {currentPage} of {totalPages}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Cards Grid */}
              {searchQuery && paginatedPatients.length > 0 && (
                <div className={`grid gap-3 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1'}`}>
                  {paginatedPatients.map((patient) => (
                    <div
                      key={patient.patNumber}
                      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-md border border-white/20 dark:border-gray-700/30 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:bg-white/90 dark:hover:bg-gray-800/90"
                    >
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-green-50/20 dark:from-emerald-900/10 dark:via-transparent dark:to-green-900/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Content */}
                      <div className="relative p-3">                        {/* Header Section */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            {/* Avatar with gradient background */}
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:shadow-emerald-200 dark:group-hover:shadow-emerald-900/30 transition-all duration-300">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              {/* Status indicator */}
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white dark:border-gray-800 ${patient.isLinked ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                <div className="w-full h-full rounded-full animate-pulse"></div>
                              </div>                            </div>
                            
                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-xs text-gray-800 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">
                                {patient.patName}
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-300 truncate leading-tight">
                                {patient.patarName}
                              </p>
                              <div className="mt-1">
                                <div className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded text-center inline-block">
                                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                    #{patient.patNumber}
                                  </span>
                                </div>
                              </div>                            </div>
                          </div>
                        </div>
                        
                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-2"></div>

                        {/* Patient Details Grid */}
                        <div className="grid grid-cols-2 gap-1.5 mb-3"><div className="flex items-center gap-1.5 p-1.5 rounded-md bg-blue-50/50 dark:bg-blue-900/10 group-hover:bg-blue-100/60 dark:group-hover:bg-blue-900/15 transition-all duration-300">
                            <div className="p-0.5 rounded bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                              {patient.patSex === 'Male' ? (
                                <span className="text-xs font-bold text-blue-600">♂</span>
                              ) : patient.patSex === 'Female' ? (
                                <span className="text-xs font-bold text-pink-600">♀</span>
                              ) : <User className="h-2.5 w-2.5 text-gray-500" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{patient.patSex || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-purple-50/50 dark:bg-purple-900/10 group-hover:bg-purple-100/60 dark:group-hover:bg-purple-900/15 transition-all duration-300">
                            <div className="p-0.5 rounded bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                              <Calendar className="h-2.5 w-2.5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{patient.dateOfBirth || 'N/A'}</p>
                            </div>
                          </div>                          <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-green-50/50 dark:bg-green-900/10 group-hover:bg-green-100/60 dark:group-hover:bg-green-900/15 transition-all duration-300">
                            <div className="p-0.5 rounded bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                              <Phone className="h-2.5 w-2.5 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
                                {patient.patMobile || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 p-1.5 rounded-md bg-amber-50/50 dark:bg-amber-900/10 group-hover:bg-amber-100/60 dark:group-hover:bg-amber-900/15 transition-all duration-300">
                            <div className="p-0.5 rounded bg-amber-100 dark:bg-amber-900/30 flex-shrink-0">
                              <Calendar className="h-2.5 w-2.5 text-amber-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
                                Age: {formatAge(patient.patAge || '', patient.patday || '')}
                              </p>
                            </div>
                          </div>                        </div>
                        {/* Action Buttons */}
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5">
                            <Button
                              className="flex-1 gap-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-sm hover:shadow-emerald-200 dark:hover:shadow-emerald-900/30 rounded-md h-7 font-medium text-xs transition-all duration-300"
                              onClick={() => handleViewPatientHistory(patient)}
                            >
                              <FileText className="h-3 w-3" />
                              Visit History
                            </Button>
                            <Button
                              className="flex-1 gap-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-md h-7 font-medium text-xs transition-all duration-300"
                              variant="outline"
                              onClick={() => handleViewDetails(patient.patNumber)}
                              disabled={loadingPatientId === patient.patNumber}
                            >
                              {loadingPatientId === patient.patNumber ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <MessageSquare className="h-3 w-3" />
                              )}
                              {loadingPatientId === patient.patNumber ? 'Loading...' : 'Details'}
                            </Button>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              className="flex-1 gap-1 text-white shadow-sm rounded-md h-7 font-medium text-xs transition-all duration-300"
                              style={{ 
                                backgroundColor: '#008ea9',
                                boxShadow: '0 1px 2px 0 rgba(0, 142, 169, 0.1)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#007296';
                                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 142, 169, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#008ea9';
                                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 142, 169, 0.1)';
                              }}
                              onClick={() => handleCreateAppointment(patient)}
                            >
                              <Calendar className="h-3 w-3" />
                              New Appointment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>              )}

              {/* Pagination Controls - Only pagination now */}
              {searchQuery && paginatedPatients.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center justify-center gap-4"><Button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-lg h-9 px-4 transition-all duration-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="font-medium text-sm">Previous</span>
                    </Button>
                    
                    <Button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl hover:bg-white dark:hover:bg-gray-800 border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-lg h-9 px-4 transition-all duration-300"
                    >
                      <span className="font-medium text-sm">Next</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>                    </Button>
                  </div>
                </div>
              )}
            </>          )}
        </main>
      </div>
      
      {/* Patient History Dialog */}
      <PatientHistoryDialog
        appointment={selectedPatient}
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
      />
    </div>
  );

}
