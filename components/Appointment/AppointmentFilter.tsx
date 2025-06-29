import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';import {
    Calendar,
    CalendarDays,
    CalendarRange,
    Filter,
    LayoutList,
    Loader2,
    Plus,
    Search,
    Users,
    User as UserIcon,
    Clock,
    FileText,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Stethoscope,    ChevronDown,
    ChevronsUpDown,
    Check,
  } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {   
    Appointment, 
    AppointmentType, 
    AppointmentStatus,
    User
  } from '@/types/database';
  import { cn, getStatusColor } from '@/lib/utils';
  interface Patient {
    patientID: number;
    fullName: string;
    patNumber: number;
    patName: string;
    patarName: string;
    patMobile: string;
  }

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
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, delayMs = 1000) => {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || 
            `Failed to fetch data: ${response.status} ${response.statusText}`
          );
        }
        return await response.json();
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        if (attempt < maxRetries - 1) {
          console.log(`Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }    }
    
    throw new Error(
      lastError instanceof Error 
        ? lastError.message 
        : 'Failed to fetch data after multiple attempts'
    );
  };

  //Component to filter appointments
  //reusable component --> The component is designed to be reusable and can be easily integrated into other parts of the application.
  //This component allows the user to filter appointments based on various criteria such as doctor, patient, date range, and appointment type.
  //It uses a combination of state management, debouncing for search input, and loading indicators to provide a smooth user experience. 
  //The component also handles loading of initial data for doctors, patients, appointment types, and statuses.
  // It also includes error handling and validation for date ranges.  

  interface AppointmentFilterProps {
    onSearch: (searchCriteria: SearchParams) => Promise<void>;
    isLoading: boolean;
    searchParams: SearchParams;
    appointments: Appointment[];
    onParamChange: (params: Partial<SearchParams>) => void;
  }  const AppointmentFilter: React.FC<AppointmentFilterProps> = ({ 
    onSearch, 
    isLoading, 
    searchParams, 
    appointments,
    onParamChange 
  }) => {
    // State for the collapsible slider animation
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    
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

    const { toast } = useToast();
    const [doctors, setDoctors] = useState<User[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<User[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
    const [appointmentStatuses, setAppointmentStatuses] = useState<AppointmentStatus[]>([]);
      // Doctor search state variables
    const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);
    const [doctorSearchValue, setDoctorSearchValue] = useState('');
    const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
    const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);
      // Patient search state variables
    const [patientSearchOpen, setPatientSearchOpen] = useState(false);    const [patientSearchValue, setPatientSearchValue] = useState('');
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);
    const [appointmentTypeOpen, setAppointmentTypeOpen] = useState(false);
    const [appointmentStatusOpen, setAppointmentStatusOpen] = useState(false);
    
    const [isLoadingDropdowns, setIsLoadingDropdowns] = useState({
      doctors: true,
      patients: true,
      appointmentTypes: true,
      appointmentStatuses: true    });
    const [error, setError] = useState<string | null>(null);

    const areDropdownsLoaded = () => {
      return !Object.values(isLoadingDropdowns).some(isLoading => isLoading);
    };

    const hasActiveFilters = () => {
      return searchParams.doctorId ||
             searchParams.patientId ||
             searchParams.appointmentTypeId ||
             searchParams.statusId ||
             searchParams.startTime ||
             searchParams.endTime ||
             searchParams.startDate !== format(new Date(), 'yyyy-MM-dd') ||
             searchParams.endDate !== format(new Date(), 'yyyy-MM-dd');
    };    useEffect(() => {
      loadInitialData();
    }, []);    // Debounced patient search effect
    useEffect(() => {        const timeoutId = setTimeout(() => {
          // Only search if term has at least 2 characters (or 3+ digits for phone)
          if (patientSearchTerm) {
            const digitsOnly = patientSearchTerm.replace(/[\D]/g, '');
            const isPhoneNumber = digitsOnly.length >= 3 && /^[\d\s\-\+\(\)]*$/.test(patientSearchTerm.trim());
            const minLength = isPhoneNumber ? 3 : 2;
            
            console.log('AppointmentFilter - Search term (timeout):', patientSearchTerm);
            console.log('AppointmentFilter - Is phone (timeout):', isPhoneNumber);
            console.log('AppointmentFilter - Digits count (timeout):', digitsOnly.length);
          
          if (patientSearchTerm.trim().length >= minLength) {
            fetchPatients(patientSearchTerm);
          } else {
            setPatients([]);
          }
        } else {
          setPatients([]);
        }
      }, 300);      return () => clearTimeout(timeoutId);
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

    // Initialize patient search value from searchParams
    useEffect(() => {
      if (searchParams.patientId) {
        setPatientSearchValue(searchParams.patientId.toString());
      } else {
        setPatientSearchValue('');
      }
    }, [searchParams.patientId]);// Remove debounced search since we're using explicit button clicks

    // Validate date ranges
    const validateDateRange = () => {
      if (searchParams.startDate && searchParams.endDate) {
        const start = new Date(searchParams.startDate);
        const end = new Date(searchParams.endDate);
        if (start > end) {
          toast({
            title: "Invalid Date Range",
            description: "Start date cannot be after end date",
            variant: "destructive",
          });
          return false;
        }
      }
      return true;
    };    const loadInitialData = async () => {
      setError(null);
      try {
        await Promise.all([
          fetchDoctors(),
          fetchPatientsList(),
          fetchAppointmentTypes(),
          fetchAppointmentStatuses(),
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        toast({
          title: "Error",
          description: "Failed to load initial data. Please refresh the page to try again.",
          variant: "destructive",
        });
      }
    };// Handle search parameter changes
    const handleSearchParamChange = (newParams: Partial<SearchParams>) => {
      const updatedParams = { ...searchParams, ...newParams };
      onParamChange(updatedParams);
      // Remove the automatic search trigger to only search when button is clicked
    };    // Remove searchAppointments since we're using onSearch prop
      
    const fetchDoctors = async () => {
      try {
        const data = await fetchWithRetry('/api/doctor/all', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'        });
        setDoctors(data);
        setFilteredDoctors(data); // Initialize filtered doctors
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load doctors",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDropdowns(prev => ({ ...prev, doctors: false }));
      }    };

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

    const fetchPatients = async (searchTerm: string = '') => {
      if (!searchTerm.trim()) {
        setPatients([]);
        return;
      }

      setIsSearchingPatients(true);
      try {
        const trimmedTerm = searchTerm.trim();
        
        console.log('AppointmentFilter - Trimmed term:', trimmedTerm);
        
        // Use the exact same logic as Patients page - direct assignment based on simple checks
        // Detect Arabic characters
        const hasArabicChars = /[\u0600-\u06FF]/.test(trimmedTerm);
        
        // Better mobile number detection: mostly digits and reasonable length
        const digitsOnly = trimmedTerm.replace(/[\D]/g, '');
        const isLikelyMobile = digitsOnly.length >= 7 && (digitsOnly.length / trimmedTerm.length) >= 0.7;
        
        console.log('AppointmentFilter - Digits only:', digitsOnly);
        console.log('AppointmentFilter - Digits length:', digitsOnly.length);
        console.log('AppointmentFilter - Original length:', trimmedTerm.length);
        console.log('AppointmentFilter - Digit ratio:', digitsOnly.length / trimmedTerm.length);
        console.log('AppointmentFilter - Has Arabic chars:', hasArabicChars);
        console.log('AppointmentFilter - Is likely mobile:', isLikelyMobile);
        
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
        
        console.log('AppointmentFilter - Country code:', countryCode);
        console.log('AppointmentFilter - Mobile number:', mobileNumber);
        
        // Use the exact same structure as Patients page
        const body = {
          patName: (!hasArabicChars && !isLikelyMobile) ? trimmedTerm : '',
          patarName: hasArabicChars ? trimmedTerm : '',
          patMobile: mobileNumber,
          mobileCountryCode: countryCode,
          patNumber: null,
        };

        console.log('AppointmentFilter - Request body:', body);

        const response = await fetch('/api/patients/search', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        console.log('AppointmentFilter - Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('AppointmentFilter - Raw API response:', data);
        
        // Use the exact same response handling as Patients page
        const mappedPatients = (data.patientList ?? []).map((card: any): Patient => ({
          patientID: card.patNumber,
          fullName: card.patName || '',
          patNumber: card.patNumber,
          patName: card.patName || '',
          patarName: card.patarName || '',
          patMobile: card.patMobile || '',
        }));
        
        console.log('AppointmentFilter - Mapped patients:', mappedPatients);
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

    const fetchPatientsList = async () => {
      try {
        // For initial load, we don't need to fetch patients - they'll be searched dynamically
        setPatients([]);
        setIsLoadingDropdowns(prev => ({ ...prev, patients: false }));
      } catch (error) {
        setPatients([]);
        setIsLoadingDropdowns(prev => ({ ...prev, patients: false }));
        throw new Error('Failed to load patients');
      }
    };    const fetchAppointmentTypes = async () => {
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
        console.error('Error loading appointment types:', error);
        setAppointmentTypes([]);
        toast({
          title: "Error",
          description: "Failed to load appointment types",
          variant: "destructive",
        });
        throw new Error('Failed to load appointment types');
      } finally {
        setIsLoadingDropdowns(prev => ({ ...prev, appointmentTypes: false }));
      }
    };const fetchAppointmentStatuses = async () => {
      try {
        const data = await fetchWithRetry('/api/lookup/appointment-statuses', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        setAppointmentStatuses(data);
      } catch (error) {
        setAppointmentStatuses([]);
        throw new Error('Failed to load appointment statuses');
      } finally {
        setIsLoadingDropdowns(prev => ({ ...prev, appointmentStatuses: false }));
      }
    };

   const renderSearchButton = () => {
          const isDropdownsLoading = !areDropdownsLoaded();
          const hasSearchCriteria = 
            searchParams.doctorId || 
            searchParams.patientId || 
            searchParams.appointmentTypeId || 
            searchParams.statusId ||
            searchParams.startTime ||
            searchParams.endTime ||
            searchParams.startDate !== format(new Date(), 'yyyy-MM-dd') ||
            searchParams.endDate !== format(new Date(), 'yyyy-MM-dd');
      
          const buttonText = isDropdownsLoading 
            ? "Loading dropdowns..."
            : isLoading 
              ? "Searching..."
              : hasSearchCriteria
                ? "Search with Filters"
                : "Search All";

          return (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleSearchClick(e);
              }}
              disabled={isLoading || isDropdownsLoading}
              className={cn(
                "gap-2",
                hasSearchCriteria ? "bg-primary text-primary-foreground hover:bg-primary/90" : "variant-outline"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isDropdownsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {buttonText}
            </Button>
          );
        };       

        const clearFilters = async () => {
          const defaultParams = {
            doctorId: null,
            patientId: null,
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd'),
            startTime: null,
            endTime: null,
            appointmentTypeId: null,
            statusId: null
          };
          onParamChange(defaultParams);
          await onSearch(defaultParams);
        };// Removed duplicate handleSearch function - using handleSearchClick instead
  const handleSearchClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateDateRange()) {
      return;
    }
    await onSearch(searchParams);  };  return (
    <div className="mb-4 overflow-hidden border border-gray-200 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Simple Header - Always Visible */}
      <div 
        className="p-3 cursor-pointer transition-all duration-300 group bg-gray-50 hover:bg-gray-100"
        onClick={() => setIsFilterExpanded(!isFilterExpanded)}
      >        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Simple Icon Container */}
              <div className="p-2 rounded-lg bg-white border border-gray-200">
                <Filter className="h-4 w-4 text-gray-600" />
              </div>
              {hasActiveFilters() && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white"></div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-800">Search Filters</h3>
                {hasActiveFilters() && (
                  <div className="px-2 py-0.5 bg-blue-100 rounded-full border border-blue-200">
                    <span className="text-xs font-medium text-blue-700">Active</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 text-gray-600 text-xs mt-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>{appointments.length} appointments</span>
                </div>
                {hasActiveFilters() && (
                  <>
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-blue-600">Filtered</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Date Range Badge */}
            {searchParams.startDate && searchParams.endDate && (
              <div className="hidden sm:flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 border border-gray-200">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">
                  {format(new Date(searchParams.startDate), 'MMM d')} - {format(new Date(searchParams.endDate), 'MMM d')}
                </span>
              </div>
            )}
            
            {/* Simple Chevron */}
            <div className="p-1.5 rounded-lg bg-white border border-gray-200">
              <ChevronDown 
                className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${
                  isFilterExpanded ? 'rotate-180' : ''
                }`} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isFilterExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              return false;
            }} 
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><div className="space-y-2">
                <Label>Doctor</Label>
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
                            {isLoadingDropdowns.doctors ? 'Loading doctors...' : 'Search doctors by name or specialization...'}
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                    <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>                      <div className="relative border-b border-gray-100/60 dark:border-gray-800/60 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-blue-50/90 to-cyan-50/80 dark:from-gray-900/90 dark:via-gray-800/95 dark:to-gray-850/90 backdrop-blur-sm overflow-hidden">
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
                                placeholder="Filter doctors by name or specialization..." 
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
                                    {doctorSearchTerm ? `Filtering "${doctorSearchTerm}"...` : 'Filter available doctors'}
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
                                    Dr. Sara
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
                                  Search by doctor name or employee ID
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
                          {/* All Doctors Option */}
                          <CommandItem
                            value="all-doctors"
                            onSelect={() => {
                              setDoctorSearchValue('');
                              handleSearchParamChange({ doctorId: null });
                              setDoctorSearchOpen(false);
                            }}
                            className={cn(
                              "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                              !searchParams.doctorId
                                ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/70 dark:border-blue-700/30"
                                : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:bg-gradient-to-r focus:from-blue-50 focus:to-cyan-50 dark:focus:from-blue-900/20 dark:focus:to-cyan-900/20 hover:border-blue-200/50 dark:hover:border-blue-700/30"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                              !searchParams.doctorId
                                ? "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                                : "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40"
                            )}>
                              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                  All Doctors
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {!searchParams.doctorId && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 scale-110 animate-bounce-in" />
                                </div>
                              )}
                            </div>
                          </CommandItem>

                          {/* Individual Doctors */}
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
                              onSelect={() => {
                                setDoctorSearchValue(doctor.employeeNumber.toString());
                                handleSearchParamChange({ doctorId: doctor.employeeNumber });
                                setDoctorSearchOpen(false);
                              }}
                              className={cn(
                                "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                searchParams.doctorId === doctor.employeeNumber
                                  ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/70 dark:border-blue-700/30"
                                  : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:bg-gradient-to-r focus:from-blue-50 focus:to-cyan-50 dark:focus:from-blue-900/20 dark:focus:to-cyan-900/20 hover:border-blue-200/50 dark:hover:border-blue-700/30",
                                filteredDoctors.length > 0 ? 'opacity-100' : 'opacity-0'
                              )}
                              style={{
                                animationDelay: `${(index + 1) * 50}ms`,
                              }}
                            >
                              <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                                searchParams.doctorId === doctor.employeeNumber
                                  ? "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                                  : "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40"
                              )}>
                                <Stethoscope className={cn(
                                  "h-5 w-5 transition-colors duration-200",
                                  searchParams.doctorId === doctor.employeeNumber
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-blue-600 dark:text-blue-400"
                                )} />
                              </div>
                              
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
                                    {doctor.fullNameEnglish}
                                  </span>
                                  {doctor.specializationName && (
                                    <div className="flex items-center gap-4 ml-auto text-xs">
                                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-500 transition-colors duration-200"></div>
                                        <span className="text-xs font-medium">{doctor.specializationName}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                {searchParams.doctorId === doctor.employeeNumber && (
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
              </div><div className="space-y-2">
                <Label>Patient</Label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={patientSearchOpen}
                      className="h-12 w-full justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/20 focus:border-green-400/70 focus:shadow-lg focus:shadow-green-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-green-300/70 hover:shadow-md group relative overflow-hidden"
                    >
                      {isSearchingPatients && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/30 to-transparent dark:via-green-900/20 animate-pulse-ring"></div>
                      )}
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-200",
                          isSearchingPatients 
                            ? "bg-gradient-to-br from-green-200 to-emerald-200 dark:from-green-800/50 dark:to-emerald-800/50 animate-glow-pulse" 
                            : "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-800/40 dark:group-hover:to-emerald-800/40"
                        )}>
                          {isSearchingPatients ? (
                            <Loader2 className="h-4 w-4 text-green-600 dark:text-green-400 animate-spin" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                              {patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patMobile && (
                                <span>{patients.find((patient) => patient.patientID.toString() === patientSearchValue)?.patMobile}</span>
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
                    <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>                      <div className="relative border-b border-gray-100/60 dark:border-gray-800/60 px-6 py-5 bg-gradient-to-br from-slate-50/80 via-green-50/90 to-emerald-50/80 dark:from-gray-900/90 dark:via-gray-800/95 dark:to-gray-850/90 backdrop-blur-sm overflow-hidden">
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
                                placeholder="Filter by name (English/Arabic) or phone number..." 
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
                                    {patientSearchTerm ? `Filtering "${patientSearchTerm}"...` : 'Filter patients by name or phone'}
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
                                  </div>                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
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
                                    أحمد علي
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/30">
                                    0501234567
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {patientSearchTerm && (
                        <div className="px-5 py-3 text-xs bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 border-b border-gray-100 dark:border-gray-800 animate-slide-up">
                          {/^[\d\s\-\+\(\)]+$/.test(patientSearchTerm.trim()) && /\d/.test(patientSearchTerm) ? (
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 animate-bounce-in">
                                📱
                              </div>
                              <span className="font-medium animate-fadeInUp">Searching by phone number</span>
                              <div className="ml-auto">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          ) : /[\u0600-\u06FF]/.test(patientSearchTerm) ? (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <div className="p-1 rounded bg-green-100 dark:bg-green-900/30 animate-bounce-in">
                                🔤
                              </div>
                              <span className="font-medium animate-fadeInUp">البحث بالاسم العربي</span>
                              <div className="ml-auto">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                              <div className="p-1 rounded bg-purple-100 dark:bg-purple-900/30 animate-bounce-in">
                                🔤
                              </div>
                              <span className="font-medium animate-fadeInUp">Searching by English name</span>
                              <div className="ml-auto">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <CommandList className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent animate-fade-in-scale"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 100%)'
                        }}>
                        <CommandEmpty>
                          {isSearchingPatients ? (
                            <div className="flex flex-col items-center justify-center py-8 animate-fade-in-scale">
                              <div className="relative p-3 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-3">
                                <Loader2 className="h-6 w-6 animate-spin text-green-600 dark:text-green-400" />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200/50 to-emerald-200/50 dark:from-green-800/20 dark:to-emerald-800/20 animate-pulse-ring"></div>
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
                                Search by English name, Arabic name, or phone number
                              </p>
                            </div>
                          )}
                        </CommandEmpty>                        <CommandGroup className="p-3">
                          {/* Add "All Patients" option */}
                          <CommandItem
                            value="all-patients"
                            onSelect={() => {
                              setPatientSearchValue('');
                              handleSearchParamChange({ patientId: null });
                              setPatientSearchOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-900/20 dark:hover:to-slate-900/20"
                          >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 group-hover:from-gray-200 group-hover:to-slate-200 dark:group-hover:from-gray-800/40 dark:group-hover:to-slate-800/40 transition-all duration-200">
                              <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                                All Patients
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Clear patient filter
                              </span>
                            </div>
                            {!patientSearchValue && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                <Check className="h-5 w-5 text-gray-600 dark:text-gray-400 scale-110" />
                              </div>
                            )}
                          </CommandItem>
                          
                          {patients.length > 0 && (
                            <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-green-50/50 to-emerald-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                                  {patients.length} Patient{patients.length !== 1 ? 's' : ''} Found
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
                                  setPatientSearchValue(patientId);
                                  handleSearchParamChange({ patientId: selectedPatient.patientID });
                                }
                                setPatientSearchOpen(false);
                              }}
                              className={cn(
                                "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                patientSearchValue === patient.patientID.toString()
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/70 dark:border-green-700/30"
                                  : "hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 focus:bg-gradient-to-r focus:from-green-50 focus:to-emerald-50 dark:focus:from-green-900/20 dark:focus:to-emerald-900/20 hover:border-green-200/50 dark:hover:border-green-700/30",
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
                                  : "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-800/40 dark:group-hover:to-emerald-800/40"
                              )}>
                                <UserIcon className={cn(
                                  "h-5 w-5 transition-colors duration-200",
                                  patientSearchValue === patient.patientID.toString()
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-green-600 dark:text-green-400"
                                )} />
                              </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-200">
                                    {patient.patName}
                                  </span>
                                  {patient.patarName && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200" dir="rtl">
                                      ({patient.patarName})
                                    </span>
                                  )}
                                  <div className="flex items-center gap-4 ml-auto text-xs">
                                    {patient.patMobile && (
                                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 group-hover:bg-green-500 transition-colors duration-200"></div>
                                        <span className="text-xs font-medium">{patient.patMobile}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
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
              </div>              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Popover open={appointmentTypeOpen} onOpenChange={setAppointmentTypeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={appointmentTypeOpen}
                      className={cn(
                        "h-12 w-full justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/20 focus:border-orange-400/70 focus:shadow-lg focus:shadow-orange-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-orange-300/70 hover:shadow-md group relative overflow-hidden",
                        isLoadingDropdowns.appointmentTypes && "cursor-not-allowed opacity-75"
                      )}
                    >
                      {isLoadingDropdowns.appointmentTypes && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100/30 to-transparent dark:via-orange-900/20 animate-pulse-ring"></div>
                      )}                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        {(() => {
                          const selectedType = appointmentTypes.find((type) => type.ID === searchParams.appointmentTypeId);
                          const typeColors = selectedType ? getTypeColor(selectedType.Name) : null;
                          
                          return (
                            <div className={cn(
                              "p-1.5 rounded-lg transition-all duration-200",
                              isLoadingDropdowns.appointmentTypes 
                                ? "bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-800/50 dark:to-amber-800/50 animate-glow-pulse" 
                                : typeColors 
                                  ? typeColors.bg
                                  : "bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 group-hover:from-orange-200 group-hover:to-amber-200 dark:group-hover:from-orange-800/40 dark:group-hover:to-amber-800/40"
                            )}>
                              {isLoadingDropdowns.appointmentTypes ? (
                                <Loader2 className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" />
                              ) : (
                                <Calendar className={cn(
                                  "h-4 w-4",
                                  typeColors ? typeColors.icon : "text-orange-600 dark:text-orange-400"
                                )} />
                              )}
                            </div>
                          );
                        })()}
                        {searchParams.appointmentTypeId ? (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span className={cn(
                              "font-medium truncate text-left",
                              (() => {
                                const selectedType = appointmentTypes.find((type) => type.ID === searchParams.appointmentTypeId);
                                const typeColors = selectedType ? getTypeColor(selectedType.Name) : null;
                                return typeColors ? typeColors.text : "text-gray-900 dark:text-gray-100";
                              })()
                            )}>
                              {appointmentTypes.find((type) => type.ID === searchParams.appointmentTypeId)?.Name || 'Unknown Type'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Filter active • Click to change
                            </span>
                          </div>
                        ) : (
                          <span className="text-left truncate text-gray-500 dark:text-gray-400">
                            {isLoadingDropdowns.appointmentTypes ? 'Loading types...' : 'All appointment types'}
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
                          </div>                          <div>
                            <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">Filter by Appointment Type</h3>
                            <p className="text-xs text-orange-600 dark:text-orange-400">Choose type to filter appointments</p>
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
                          {(appointmentTypes.length > 0 || !isLoadingDropdowns.appointmentTypes) && (
                            <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-orange-50/50 to-amber-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                                  Filter Options ({appointmentTypes.length + 1})
                                </p>
                                <div className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
                                  <div className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* All Types Option */}
                          <CommandItem
                            value="all-types"
                            onSelect={() => {
                              handleSearchParamChange({ appointmentTypeId: null });
                              setAppointmentTypeOpen(false);
                            }}
                            className={cn(
                              "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                              !searchParams.appointmentTypeId
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/70 dark:border-blue-700/30"
                                : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 dark:focus:from-blue-900/20 dark:focus:to-indigo-900/20 hover:border-blue-200/50 dark:hover:border-blue-700/30"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                              !searchParams.appointmentTypeId
                                ? "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30"
                                : "bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-indigo-800/40"
                            )}>
                              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                  All Types
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {!searchParams.appointmentTypeId && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 scale-110 animate-bounce-in" />
                                </div>
                              )}
                            </div>
                          </CommandItem>                          {/* Individual Types */}
                          {appointmentTypes.map((type, index) => {
                            const typeColors = getTypeColor(type.Name);
                            return (
                            <CommandItem
                              key={type.ID}
                              value={`type-${type.ID}`}
                              onSelect={() => {
                                handleSearchParamChange({ appointmentTypeId: type.ID });
                                setAppointmentTypeOpen(false);
                              }}
                              className={cn(
                                "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                searchParams.appointmentTypeId === type.ID
                                  ? typeColors.selected
                                  : typeColors.hover + " focus:bg-gradient-to-r focus:from-gray-50 focus:to-gray-50 dark:focus:from-gray-900/20 dark:focus:to-gray-900/20 hover:border-gray-200/50 dark:hover:border-gray-700/30"
                              )}
                              style={{
                                animationDelay: `${(index + 1) * 50}ms`,
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
                                    searchParams.appointmentTypeId === type.ID ? typeColors.text : "text-gray-800 dark:text-gray-200 group-hover:" + typeColors.text.replace('text-', '')
                                  )}>
                                    {type.Name}
                                  </span>
                                  {type.Description && (
                                    <div className="flex items-center gap-4 ml-auto text-xs">
                                      <div className={cn(
                                        "flex items-center gap-1.5 transition-colors duration-200",
                                        searchParams.appointmentTypeId === type.ID ? typeColors.text : "text-gray-500 dark:text-gray-400 group-hover:" + typeColors.text.replace('text-', '')
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
                                {searchParams.appointmentTypeId === type.ID && (
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
              </div>              <div className="space-y-2">
                <Label>Status</Label>
                <Popover open={appointmentStatusOpen} onOpenChange={setAppointmentStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={appointmentStatusOpen}
                      className={cn(
                        "h-12 w-full justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-purple-300/70 hover:shadow-md group relative overflow-hidden",
                        isLoadingDropdowns.appointmentStatuses && "cursor-not-allowed opacity-75"
                      )}
                    >
                      {isLoadingDropdowns.appointmentStatuses && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent dark:via-purple-900/20 animate-pulse-ring"></div>
                      )}
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-all duration-200",
                          isLoadingDropdowns.appointmentStatuses 
                            ? "bg-gradient-to-br from-purple-200 to-indigo-200 dark:from-purple-800/50 dark:to-indigo-800/50 animate-glow-pulse" 
                            : "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-800/40 dark:group-hover:to-indigo-800/40"
                        )}>
                          {isLoadingDropdowns.appointmentStatuses ? (
                            <Loader2 className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        {searchParams.statusId ? (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left">
                              {appointmentStatuses.find((status) => status.id === searchParams.statusId)?.name || 'Unknown Status'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Filter active • Click to change
                            </span>
                          </div>
                        ) : (
                          <span className="text-left truncate text-gray-500 dark:text-gray-400">
                            {isLoadingDropdowns.appointmentStatuses ? 'Loading statuses...' : 'All appointment statuses'}
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                    <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                      <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-5 py-4 bg-gradient-to-r from-gray-50 via-purple-50 to-indigo-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse-ring"></div>
                        <div className="flex items-center gap-3 w-full relative z-10">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 shadow-lg flex-shrink-0">
                            <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>                          <div>
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Filter by Status</h3>
                            <p className="text-xs text-purple-600 dark:text-purple-400">Choose status to filter appointments</p>
                          </div>
                        </div>
                      </div>
                      <CommandList className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent animate-fade-in-scale">
                        <CommandEmpty>
                          {isLoadingDropdowns.appointmentStatuses ? (
                            <div className="flex flex-col items-center justify-center py-8 animate-fade-in-scale">
                              <div className="relative p-3 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 mb-3">
                                <Loader2 className="h-6 w-6 animate-spin text-purple-600 dark:text-purple-400" />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-200/50 to-indigo-200/50 dark:from-purple-800/20 dark:to-indigo-800/20 animate-pulse-ring"></div>
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 animate-fadeInUp">Loading appointment statuses...</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 animate-fadeInUp" style={{animationDelay: '100ms'}}>Please wait while we fetch available statuses</p>
                            </div>
                          ) : (
                            <div className="text-center py-8 animate-fade-in-scale">
                              <div className="p-3 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800 mb-3 mx-auto w-fit animate-bounce-in">
                                <AlertTriangle className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No appointment statuses available</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please contact your administrator</p>
                            </div>
                          )}
                        </CommandEmpty>
                        <CommandGroup className="p-3">
                          {(appointmentStatuses.length > 0 || !isLoadingDropdowns.appointmentStatuses) && (
                            <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-purple-50/50 to-indigo-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 animate-slide-up">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
                                  Filter Options ({appointmentStatuses.length + 1})
                                </p>
                                <div className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                                  <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" style={{animationDelay: '200ms'}}></div>
                                  <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '400ms'}}></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* All Statuses Option */}
                          <CommandItem
                            value="all-statuses"
                            onSelect={() => {
                              handleSearchParamChange({ statusId: null });
                              setAppointmentStatusOpen(false);
                            }}
                            className={cn(
                              "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                              !searchParams.statusId
                                ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200/70 dark:border-blue-700/30"
                                : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:bg-gradient-to-r focus:from-blue-50 focus:to-cyan-50 dark:focus:from-blue-900/20 dark:focus:to-cyan-900/20 hover:border-blue-200/50 dark:hover:border-blue-700/30"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                              !searchParams.statusId
                                ? "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                                : "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40"
                            )}>
                              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                  All Statuses
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {!searchParams.statusId && (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                  <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 scale-110 animate-bounce-in" />
                                </div>
                              )}
                            </div>
                          </CommandItem>

                          {/* Individual Statuses */}
                          {appointmentStatuses.map((status, index) => {                            const getStatusIcon = (statusName: string) => {
                              if (!statusName) return <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
                              const lowerName = statusName.toLowerCase();
                              if (lowerName.includes('completed')) {
                                return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
                              } else if (lowerName.includes('cancelled')) {
                                return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
                              } else if (lowerName.includes('no-show')) {
                                return <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;                              } else if (lowerName.includes('checked')) {
                                return <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
                              } else {
                                return <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
                              }
                            };                            const getStatusColors = (statusName: string) => {
                              if (!statusName) {
                                return {
                                  bg: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
                                  border: "border-purple-200/70 dark:border-purple-700/30",
                                  iconBg: "from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30",
                                  hover: "hover:from-purple-200 hover:to-violet-200 dark:hover:from-purple-800/40 dark:hover:to-violet-800/40"
                                };
                              }
                              const lowerName = statusName.toLowerCase();
                              if (lowerName.includes('completed')) {
                                return {
                                  bg: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
                                  border: "border-green-200/70 dark:border-green-700/30",
                                  iconBg: "from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30",
                                  hover: "hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40"
                                };
                              } else if (lowerName.includes('cancelled')) {
                                return {
                                  bg: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20",
                                  border: "border-red-200/70 dark:border-red-700/30",
                                  iconBg: "from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30",
                                  hover: "hover:from-red-200 hover:to-pink-200 dark:hover:from-red-800/40 dark:hover:to-pink-800/40"
                                };
                              } else if (lowerName.includes('no-show')) {
                                return {
                                  bg: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
                                  border: "border-orange-200/70 dark:border-orange-700/30",
                                  iconBg: "from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30",
                                  hover: "hover:from-orange-200 hover:to-amber-200 dark:hover:from-orange-800/40 dark:hover:to-amber-800/40"
                                };
                              } else {
                                return {
                                  bg: "from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
                                  border: "border-purple-200/70 dark:border-purple-700/30",
                                  iconBg: "from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30",
                                  hover: "hover:from-purple-200 hover:to-indigo-200 dark:hover:from-purple-800/40 dark:hover:to-indigo-800/40"
                                };
                              }
                            };                            const colors = getStatusColors(status.name || 'Unknown Status');

                            return (
                              <CommandItem
                                key={status.id}
                                value={`status-${status.id}`}
                                onSelect={() => {
                                  handleSearchParamChange({ statusId: status.id });
                                  setAppointmentStatusOpen(false);
                                }}
                                className={cn(
                                  "relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group animate-fadeInUp",
                                  searchParams.statusId === status.id
                                    ? `bg-gradient-to-r ${colors.bg} ${colors.border}`
                                    : `hover:bg-gradient-to-r hover:${colors.bg} focus:bg-gradient-to-r focus:${colors.bg} hover:border-purple-200/50 dark:hover:border-purple-700/30`
                                )}
                                style={{
                                  animationDelay: `${(index + 1) * 50}ms`,
                                }}
                              >
                                <div className={cn(
                                  "flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-all duration-200",
                                  searchParams.statusId === status.id
                                    ? `bg-gradient-to-br ${colors.iconBg}`
                                    : `bg-gradient-to-br ${colors.iconBg} group-${colors.hover}`                                )}>
                                  {getStatusIcon(status.name || 'Unknown Status')}
                                </div>
                                  <div className="flex flex-col flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                                      {status.name}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex-shrink-0">
                                  {searchParams.statusId === status.id && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                      <Check className="h-5 w-5 text-purple-600 dark:text-purple-400 scale-110 animate-bounce-in" />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-12 w-full justify-start bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-400/70 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-blue-300/70 hover:shadow-md group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent dark:via-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                          <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        {searchParams.startDate ? (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left">
                              {format(new Date(searchParams.startDate), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(searchParams.startDate), 'MMM d')} • Click to change
                            </span>
                          </div>                        ) : (
                          <span className="text-left truncate text-gray-500 dark:text-gray-400">
                            Select start date
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                    <div className="p-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 border-b border-blue-100 dark:border-blue-800/30">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                          <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>                        <div>
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Select Start Date</h3>
                          <p className="text-xs text-blue-600 dark:text-blue-400">Choose filter start date</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">                      <CalendarComponent
                        mode="single"
                        selected={searchParams.startDate ? new Date(searchParams.startDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleSearchParamChange({ startDate: format(date, 'yyyy-MM-dd') });
                          }
                        }}
                        disabled={(date) => {
                          // Disable dates after end date if end date is set
                          if (searchParams.endDate) {
                            return date > new Date(searchParams.endDate);
                          }
                          return false;
                        }}
                        initialFocus
                        className="rounded-xl border-0"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center text-blue-800 dark:text-blue-200 font-semibold",
                          caption_label: "text-base font-bold",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-8 w-8 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-800/40 dark:hover:to-cyan-800/40 rounded-lg transition-all duration-200 flex items-center justify-center border-0",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-blue-600 dark:text-blue-400 rounded-md w-8 font-semibold text-[0.8rem] flex items-center justify-center",
                          row: "flex w-full mt-2",
                          cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gradient-to-br [&:has([aria-selected])]:from-blue-100 [&:has([aria-selected])]:to-cyan-100 dark:[&:has([aria-selected])]:from-blue-900/30 dark:[&:has([aria-selected])]:to-cyan-900/30 [&:has([aria-selected])]:rounded-lg [&:has([aria-selected])]:shadow-lg",
                          day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 rounded-lg transition-all duration-200 flex items-center justify-center",
                          day_selected: "bg-gradient-to-br from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 focus:from-blue-600 focus:to-cyan-600 shadow-lg font-bold",                          day_today: "bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 text-blue-800 dark:text-blue-200 font-bold border border-blue-300 dark:border-blue-700",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-300 dark:text-gray-600 opacity-50 cursor-not-allowed",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-800 dark:via-blue-900/10 dark:to-gray-800 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Filter start date</span>
                        {searchParams.endDate && (
                          <span>Max: {format(new Date(searchParams.endDate), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-12 w-full justify-start bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/20 focus:border-green-400/70 focus:shadow-lg focus:shadow-green-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-green-300/70 hover:shadow-md group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-100/20 to-transparent dark:via-green-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 group-hover:from-green-200 group-hover:to-emerald-200 dark:group-hover:from-green-800/40 dark:group-hover:to-emerald-800/40 transition-all duration-200">
                          <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        {searchParams.endDate ? (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left">
                              {format(new Date(searchParams.endDate), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(searchParams.endDate), 'MMM d')} • Click to change
                            </span>
                          </div>                        ) : (
                          <span className="text-left truncate text-gray-500 dark:text-gray-400">
                            Select end date
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
                        </div>                        <div>
                          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Select End Date</h3>
                          <p className="text-xs text-green-600 dark:text-green-400">Choose filter end date</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">                      <CalendarComponent
                        mode="single"
                        selected={searchParams.endDate ? new Date(searchParams.endDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            handleSearchParamChange({ endDate: format(date, 'yyyy-MM-dd') });
                          }
                        }}
                        disabled={(date) => {
                          // Disable dates before start date if start date is set
                          if (searchParams.startDate) {
                            return date < new Date(searchParams.startDate);
                          }
                          return false;
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
                          day_selected: "bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 focus:from-green-600 focus:to-emerald-600 shadow-lg font-bold",                          day_today: "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 text-green-800 dark:text-green-200 font-bold border border-green-300 dark:border-green-700",
                          day_outside: "text-gray-400 opacity-50",
                          day_disabled: "text-gray-300 dark:text-gray-600 opacity-50 cursor-not-allowed",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-800 dark:via-green-900/10 dark:to-gray-800 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Filter end date</span>
                        {searchParams.startDate && (
                          <span>Min: {format(new Date(searchParams.startDate), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  Start Time
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-12 w-full justify-start bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/70 dark:border-gray-700/50 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/30 focus:border-purple-400 focus:shadow-xl focus:shadow-purple-500/15 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.01] group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-violet-50/30 to-purple-50/50 dark:from-purple-900/10 dark:via-violet-900/5 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-500"></div>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-400 via-violet-500 to-purple-400 scale-x-0 group-hover:scale-x-100 group-focus:scale-x-100 transition-transform duration-300 origin-center"></div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 via-violet-100 to-purple-100 dark:from-purple-900/40 dark:via-violet-900/30 dark:to-purple-900/40 group-hover:from-purple-200 group-hover:via-violet-200 group-hover:to-purple-200 dark:group-hover:from-purple-800/50 dark:group-hover:via-violet-800/40 dark:group-hover:to-purple-800/50 transition-all duration-300 shadow-sm group-hover:shadow-md">
                          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200" />
                        </div>
                        {searchParams.startTime ? (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-left group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                              {format(new Date(`2000-01-01T${searchParams.startTime}`), 'h:mm a')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                              {searchParams.startTime} • Click to change
                            </span>
                          </div>                        ) : (
                          <span className="text-left truncate text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                            Select start time
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-80 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all duration-200" />
                    </Button>
                  </PopoverTrigger>                  <PopoverContent className="w-80 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 shadow-2xl rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 time-picker-popover" align="start">
                    <div className="p-5 bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50 dark:from-purple-900/30 dark:via-violet-900/20 dark:to-purple-900/30 border-b border-purple-100/70 dark:border-purple-800/40 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 via-transparent to-violet-100/20 dark:from-purple-900/10 dark:via-transparent dark:to-violet-900/10 animate-gradient-x"></div>
                      <div className="absolute -top-1 -right-1 w-16 h-16 bg-gradient-to-br from-purple-200/30 to-violet-200/30 rounded-full blur-2xl"></div>
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 shadow-sm ring-1 ring-purple-200/50 dark:ring-purple-800/30">
                          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>                        <div>
                          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">Select Start Time</h3>
                          <p className="text-xs text-purple-600 dark:text-purple-400 opacity-90">Choose your preferred start time</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="space-y-3">                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 shadow-sm"></div>
                          Manual Time Entry
                        </Label>
                        <div className="relative group">
                          <Input
                            type="time"
                            value={searchParams.startTime || ''}
                            onChange={(e) => handleSearchParamChange({ startTime: e.target.value || null })}
                            className="h-12 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/60 dark:border-purple-700/40 focus:border-purple-400 dark:focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all duration-300 rounded-lg hover:shadow-md hover:shadow-purple-500/10 font-medium text-base px-4"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-400 to-violet-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                          <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                            <Clock className="h-4 w-4 text-purple-400 dark:text-purple-500 opacity-50 group-focus-within:opacity-80 transition-opacity duration-200" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-violet-500 shadow-sm"></div>
                          Quick Time Selection
                        </Label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['09:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((time) => (
                            <Button
                              key={time}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearchParamChange({ startTime: time })}
                              className={`h-10 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg time-button relative overflow-hidden ${
                                searchParams.startTime === time
                                  ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-500 shadow-lg shadow-purple-500/30 scale-105 ring-2 ring-purple-400/30'
                                  : 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/60 dark:border-purple-700/40 hover:from-purple-100 hover:to-violet-100 dark:hover:from-purple-800/40 dark:hover:to-violet-800/40 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-purple-500/20'
                              }`}
                            >
                              <div className={`absolute inset-0 bg-gradient-to-r from-purple-400/20 to-violet-400/20 opacity-0 transition-opacity duration-200 ${searchParams.startTime !== time ? 'group-hover:opacity-100' : ''}`}></div>
                              <span className="relative z-10">{format(new Date(`2000-01-01T${time}`), 'h:mm a')}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 via-purple-50/40 to-gray-50 dark:from-gray-800 dark:via-purple-900/15 dark:to-gray-800 border-t border-gray-100/70 dark:border-gray-800/70 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/10 to-transparent dark:via-purple-900/5"></div>                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 relative z-10">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Filter start time
                        </span>
                        {searchParams.endTime && (
                          <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            Before: {format(new Date(`2000-01-01T${searchParams.endTime}`), 'h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  End Time
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="h-12 w-full justify-start bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/70 dark:border-gray-700/50 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/30 focus:border-orange-400 focus:shadow-xl focus:shadow-orange-500/15 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10 hover:scale-[1.01] group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 via-amber-50/30 to-orange-50/50 dark:from-orange-900/10 dark:via-amber-900/5 dark:to-orange-900/10 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-500"></div>
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-400 scale-x-0 group-hover:scale-x-100 group-focus:scale-x-100 transition-transform duration-300 origin-center"></div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-100 via-amber-100 to-orange-100 dark:from-orange-900/40 dark:via-amber-900/30 dark:to-orange-900/40 group-hover:from-orange-200 group-hover:via-amber-200 group-hover:to-orange-200 dark:group-hover:from-orange-800/50 dark:group-hover:via-amber-800/40 dark:group-hover:to-orange-800/50 transition-all duration-300 shadow-sm group-hover:shadow-md">
                          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200" />
                        </div>
                        {searchParams.endTime ? (
                          <div className="flex flex-col min-w-0 flex-1 text-left">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate text-left group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-200">
                              {format(new Date(`2000-01-01T${searchParams.endTime}`), 'h:mm a')}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                              {searchParams.endTime} • Click to change
                            </span>
                          </div>                        ) : (
                          <span className="text-left truncate text-gray-500 dark:text-gray-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                            Select end time
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-80 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-200" />
                    </Button>
                  </PopoverTrigger>                  <PopoverContent className="w-80 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/30 dark:border-gray-700/40 shadow-2xl rounded-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 time-picker-popover" align="start">
                    <div className="p-5 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 dark:from-orange-900/30 dark:via-amber-900/20 dark:to-orange-900/30 border-b border-orange-100/70 dark:border-orange-800/40 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-100/20 via-transparent to-amber-100/20 dark:from-orange-900/10 dark:via-transparent dark:to-amber-900/10 animate-gradient-x"></div>
                      <div className="absolute -top-1 -right-1 w-16 h-16 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-2xl"></div>
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/50 shadow-sm ring-1 ring-orange-200/50 dark:ring-orange-800/30">
                          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>                        <div>
                          <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">Select End Time</h3>
                          <p className="text-xs text-orange-600 dark:text-orange-400 opacity-90">Choose your preferred end time</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 space-y-5">
                      <div className="space-y-3">                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm"></div>
                          Manual Time Entry
                        </Label>
                        <div className="relative group">
                          <Input
                            type="time"
                            value={searchParams.endTime || ''}
                            onChange={(e) => handleSearchParamChange({ endTime: e.target.value || null })}
                            className="h-12 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/60 dark:border-orange-700/40 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all duration-300 rounded-lg hover:shadow-md hover:shadow-orange-500/10 font-medium text-base px-4"
                          />
                          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full"></div>
                          <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                            <Clock className="h-4 w-4 text-orange-400 dark:text-orange-500 opacity-50 group-focus-within:opacity-80 transition-opacity duration-200" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm"></div>
                          Quick Time Selection
                        </Label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {['10:00', '13:00', '15:00', '17:00', '19:00', '21:00'].map((time) => (
                            <Button
                              key={time}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSearchParamChange({ endTime: time })}
                              className={`h-10 text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg time-button relative overflow-hidden ${
                                searchParams.endTime === time
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-lg shadow-orange-500/30 scale-105 ring-2 ring-orange-400/30'
                                  : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200/60 dark:border-orange-700/40 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-800/40 dark:hover:to-amber-800/40 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-orange-500/20'
                              }`}
                            >
                              <div className={`absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-400/20 opacity-0 transition-opacity duration-200 ${searchParams.endTime !== time ? 'group-hover:opacity-100' : ''}`}></div>
                              <span className="relative z-10">{format(new Date(`2000-01-01T${time}`), 'h:mm a')}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-gray-50 via-orange-50/40 to-gray-50 dark:from-gray-800 dark:via-orange-900/15 dark:to-gray-800 border-t border-gray-100/70 dark:border-gray-800/70 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-100/10 to-transparent dark:via-orange-900/5"></div>                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 relative z-10">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Filter end time
                        </span>
                        {searchParams.startTime && (
                          <span className="text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            After: {format(new Date(`2000-01-01T${searchParams.startTime}`), 'h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {renderSearchButton()}
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  clearFilters();                }}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AppointmentFilter