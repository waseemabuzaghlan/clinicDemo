'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, ChevronDown, Calendar, Stethoscope, ExternalLink, AlertCircle } from 'lucide-react';
import { PatientVisitHistory } from '@/types/database';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface PatientHistoryComponentProps {
  patientId: number | null;
  currentVisitId?: string;
}

export function PatientHistoryComponent({ patientId, currentVisitId }: PatientHistoryComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visits, setVisits] = useState<PatientVisitHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchPatientHistory = async () => {
    if (!patientId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/patient-visits/${patientId}`, {
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
      // Filter out current visit if provided
      const filteredVisits = currentVisitId 
        ? data.filter((visit: PatientVisitHistory) => visit.visitId !== currentVisitId)
        : data;
      
      setVisits(filteredVisits);
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

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientHistory();
    }
  }, [isOpen, patientId]);

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const handleViewConsultation = (visitId: string) => {
    router.push(`/visits/${visitId}/consultation?readOnly=true`);
  };

  if (!patientId) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="overflow-hidden border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5 dark:ring-white/10">
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl"
               style={{backgroundColor: '#f8f4ff'}}
               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3ebff'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8f4ff'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 backdrop-blur-sm border border-purple-200">
                    <History className="h-4 w-4 text-purple-600 drop-shadow-sm" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-white shadow-sm animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Previous Patient Visits</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    View complete history of patient consultations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {visits.length > 0 && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {visits.length} visit{visits.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-gray-600 drop-shadow-sm transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="transition-all duration-300 ease-in-out">
          <CardContent className="p-4 pt-0">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="text-lg font-medium">Loading patient history...</span>
                </div>
              </div>
            ) : visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                  <History className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No Previous Visits
                </h3>
                <p className="text-sm text-muted-foreground">
                  This patient doesn't have any previous consultation records.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border bg-card shadow-sm">
                <Table>
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
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
