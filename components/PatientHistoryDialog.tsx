'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Calendar, Stethoscope, AlertCircle, ExternalLink } from 'lucide-react';
import { PatientVisitHistory, Appointment } from '@/types/database';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface PatientHistoryDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientHistoryDialog({ appointment, isOpen, onClose }: PatientHistoryDialogProps) {
  const [visits, setVisits] = useState<PatientVisitHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && appointment?.patientId) {
      fetchPatientHistory(appointment.patientId);
    }
  }, [isOpen, appointment?.patientId]);

  const fetchPatientHistory = async (patientId: number) => {
    setIsLoading(true);
    setError(null);
    try {      const response = await fetch(`/api/patient-visits/${patientId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch patient history');
      }

      const data = await response.json();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch patient history';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };
  const handleViewConsultation = (visitId: string) => {
    router.push(`/visits/${visitId}/consultation`);
    onClose(); // Close the dialog when navigating
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Patient Visit History</h2>
              {appointment && (
                <p className="text-sm text-muted-foreground mt-1">
                  {appointment.patientName} • ID: {appointment.patientId}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-lg font-medium">Loading patient history...</span>
              </div>
            </div>
          ) : visits.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Visit History Found
              </h3>
              <p className="text-sm text-muted-foreground">
                This patient doesn't have any previous visits recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <div className="rounded-xl border bg-card shadow-sm">                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead className="text-center">Consultation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.map((visit) => {
                      return (
                        <TableRow key={visit.visitId} className="hover:bg-muted/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {formatDateTime(visit.startedAt)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                <Stethoscope className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <div className="font-medium">
                                  {visit.doctorName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {visit.doctorId}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewConsultation(visit.visitId)}
                              className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
