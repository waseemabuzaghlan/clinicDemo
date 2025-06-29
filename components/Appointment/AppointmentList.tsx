import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Loader2, FileText, CheckCircle2, XCircle, AlertTriangle, MoreVertical, Clock, User as UserIcon, ClipboardCheck, Stethoscope, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Appointment, User } from '@/types/database';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getDoctorName, getPatientName } from '@/lib/appointment-utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Patient {
  patientID: number;
  fullName: string;
}

interface AppointmentStatus {
  id: string;
  name: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  appointmentStatuses: AppointmentStatus[];
  doctors: User[];
  patients: Patient[];
  isLoading: boolean;
  isUpdatingStatus: boolean;
  updateAppointmentStatus: (appointmentId: string, statusId: string) => Promise<void>;
  enabledActions?: ('view-history' | 'start-consultation')[];
  onViewHistory?: (appointment: Appointment) => void;
  onStartConsultation?: (appointment: Appointment) => void;
  // New props for sorting
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const getTypeColor = (typeName: string) => {
  const typeColorMap: { [key: string]: { bg: string; text: string; icon: string } } = {
    'Embassy': { 
      bg: 'bg-red-100/80 dark:bg-red-900/30', 
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400'
    },
    'Online': { 
      bg: 'bg-teal-100/80 dark:bg-teal-900/30', 
      text: 'text-teal-700 dark:text-teal-400',
      icon: 'text-teal-600 dark:text-teal-400'
    },
    'Normal - Onsite': { 
      bg: 'bg-blue-100/80 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    'HouseCall': { 
      bg: 'bg-green-100/80 dark:bg-green-900/30', 
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400'
    },
    'Emergency': { 
      bg: 'bg-yellow-100/80 dark:bg-yellow-900/30', 
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: 'text-yellow-600 dark:text-yellow-400'
    },
  };
  
  return typeColorMap[typeName] || { 
    bg: 'bg-gray-100/80 dark:bg-gray-900/30', 
    text: 'text-gray-700 dark:text-gray-400',
    icon: 'text-gray-600 dark:text-gray-400'
  };
};

const getStatusColor = (statusName: string) => {
  const statusColorMap: { [key: string]: { bg: string; text: string; icon: string } } = {
    'completed': { 
      bg: 'bg-green-100/80 dark:bg-green-900/30', 
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400'
    },
    'checked-in': { 
      bg: 'bg-blue-100/80 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    'cancelled': { 
      bg: 'bg-red-100/80 dark:bg-red-900/30', 
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400'
    },
    'no-show': { 
      bg: 'bg-orange-100/80 dark:bg-orange-900/30', 
      text: 'text-orange-700 dark:text-orange-400',
      icon: 'text-orange-600 dark:text-orange-400'
    },
    'scheduled': { 
      bg: 'bg-blue-100/80 dark:bg-blue-900/30', 
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400'
    },
  };
  
  return statusColorMap[statusName.toLowerCase()] || { 
    bg: 'bg-gray-100/80 dark:bg-gray-900/30', 
    text: 'text-gray-700 dark:text-gray-400',
    icon: 'text-gray-600 dark:text-gray-400'
  };
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'checked-in':
      return <UserIcon className="h-4 w-4 text-blue-500" />;
    case 'no-show':
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  appointmentStatuses,
  doctors,
  patients,
  isLoading,
  isUpdatingStatus,
  updateAppointmentStatus,
  enabledActions = [],
  onViewHistory,
  onStartConsultation,
}) => {  // Internal state for pagination and sorting
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(6); // Reduced to 5 to ensure pagination shows
  const [sortField, setSortField] = React.useState<string>('date');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400 ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600 ml-1" />
      : <ArrowDown className="h-4 w-4 text-blue-600 ml-1" />;
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      type="button"
      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      onClick={() => handleSort(field)}
    >
      {children}
      {getSortIcon(field)}
    </button>
  );

  const getSortedAppointments = () => {
    const sorted = [...appointments].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      switch (sortField) {
        case 'patientName':
          aValue = (a.patientName || '').toLowerCase();
          bValue = (b.patientName || '').toLowerCase();
          break;
        case 'doctorName':
          aValue = (a.doctorName || '').toLowerCase();
          bValue = (b.doctorName || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(`${a.date}T${a.startTime}`);
          bValue = new Date(`${b.date}T${b.startTime}`);
          break;
        case 'typeName':
          aValue = (a.typeName || '').toLowerCase();
          bValue = (b.typeName || '').toLowerCase();
          break;
        case 'statusName':
          aValue = (a.statusName || '').toLowerCase();
          bValue = (b.statusName || '').toLowerCase();
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const getPaginatedAppointments = () => {
    const sorted = getSortedAppointments();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusId = (statusName: string) => {
    const status = appointmentStatuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    return status?.id;
  };

  type AppointmentAction = {
    id: string;
    label: string;
    icon: React.ReactNode;
  };

  const getAvailableActions = (status: string): AppointmentAction[] => {
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
    const lowerStatus = status.toLowerCase();
    return lowerStatus !== 'completed' && lowerStatus !== 'cancelled' && lowerStatus !== 'no-show';
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-lg p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-lg">
      <Table>
        <TableHeader className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 border-b-2 border-gradient-to-r border-blue-200/50 dark:border-gray-600/30">
          <TableRow className="hover:bg-transparent border-b border-blue-100/50 dark:border-gray-700/30">
            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4 bg-gradient-to-r from-transparent to-blue-50/20 dark:to-gray-700/20">
              <SortableHeader field="patientName">
                <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                Patient
              </SortableHeader>
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4">
              <SortableHeader field="doctorName">
                <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Doctor
              </SortableHeader>
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4">
              <SortableHeader field="date">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                Appointment Time
              </SortableHeader>
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4">
              <SortableHeader field="typeName">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Type
              </SortableHeader>
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4">
              <SortableHeader field="statusName">
                <ClipboardCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Status
              </SortableHeader>
            </TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Notes
              </div>
            </TableHead>
            <TableHead className="text-right text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-4 bg-gradient-to-l from-transparent to-indigo-50/20 dark:to-gray-700/20">
              <div className="flex items-center justify-end gap-2">
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                Actions
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getPaginatedAppointments().length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No appointments found
              </TableCell>
            </TableRow>
          ) : (
            getPaginatedAppointments().map((appointment) => (
              <TableRow key={appointment.appointmentId}>                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-full", "bg-primary/10")}>
                      <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>                      <div className="font-medium">
                        {appointment.patientName || getPatientName(appointment.patientId, patients) || 'Unknown Patient'}
                      </div>
                    </div>
                  </div>
                </TableCell>                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-full", "bg-teal-100 dark:bg-teal-900/30")}>
                      <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>                      <div className="font-medium">
                        {appointment.doctorName || getDoctorName(appointment.doctorId, doctors) || 'Unknown Doctor'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {appointment.slotId && 
                   appointment.slotId !== '00000000-0000-0000-0000-000000000000' && 
                   appointment.startTime && 
                   appointment.endTime ? (
                    <>
                      <div className="font-medium">
                        {format(new Date(appointment.date), 'MMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {`${format(new Date(`2000-01-01T${appointment.startTime}`), 'h:mm a')} - ${format(new Date(`2000-01-01T${appointment.endTime}`), 'h:mm a')}`}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <span className="italic text-gray-400">no time slot</span>
                    </div>
                  )}
                </TableCell>                <TableCell>
                  <div className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                    "bg-gray-100 dark:bg-gray-800",
                    appointment.typeName === 'Embassy' && "text-red-700 dark:text-red-500",
                    appointment.typeName === 'Online' && "text-teal-700 dark:text-teal-500",
                    appointment.typeName === 'Normal - Onsite' && "text-blue-700 dark:text-blue-500",
                    appointment.typeName === 'HouseCall' && "text-green-700 dark:text-green-500",
                    appointment.typeName === 'Emergency' && "text-yellow-700 dark:text-yellow-500"
                  )}>
                    <FileText className="h-4 w-4" />
                    {appointment.typeName}
                  </div>
                </TableCell>                <TableCell>
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg inline-flex items-center gap-2 font-medium",
                    getStatusColor(appointment.statusName).bg,
                    getStatusColor(appointment.statusName).text
                  )}>
                    <span className={cn(getStatusColor(appointment.statusName).icon)}>
                      {getStatusIcon(appointment.statusName)}
                    </span>
                    {appointment.statusName}
                  </div>
                </TableCell>
                <TableCell>
                  {appointment.notes ? (
                    <span className="text-sm text-muted-foreground">
                      {appointment.notes}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No notes</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {enabledActions?.includes('start-consultation') && 
                     appointment.statusName.toLowerCase() === 'checked-in' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onStartConsultation?.(appointment)}
                        disabled={isUpdatingStatus}
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Start Visit
                      </Button>
                    )}
                    {hasAvailableActions(appointment.statusName) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isUpdatingStatus}>
                            {isUpdatingStatus ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {getAvailableActions(appointment.statusName).map(action => (
                            <DropdownMenuItem
                              key={action.id}
                              onClick={() => {
                                const statusId = getStatusId(action.id);
                                if (statusId) {
                                  updateAppointmentStatus(appointment.appointmentId, statusId);
                                }
                              }}
                            >
                              {action.icon}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                          {enabledActions?.includes('view-history') && (
                            <DropdownMenuItem
                              key="view-history"
                              onClick={() => onViewHistory?.(appointment)}
                            >
                              <FileText className="mr-2 h-4 w-4 text-primary" />
                              View Patient History
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}        </TableBody>
      </Table>
      
      {/* Pagination info and controls */}
      <div className="px-6 py-4 border-t border-gray-200/60 dark:border-gray-700/40">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, appointments.length)} of {appointments.length} appointments
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === pageNum}
                        onClick={e => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};
