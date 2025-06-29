'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Calendar,
  ClipboardList,
  FileText,
  Activity,
  Pill,
  AlertCircle,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Visit {
  id: string;
  patientId: number;
  patientName: string;
  appointmentId: string;
  appointmentTime: string;
  doctorName: string;
  status: string;
  identificationNumber: string;
  identificationType: string;
  fingerprintCollected: boolean;
  insuranceCardNumber: string;
  paymentType: string;
  createdAt: string;
}

interface Patient {
  id: number;
  name: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
}

interface MedicalHistory {
  id: string;
  date: string;
  type: string;
  description: string;
  doctor: string;
  diagnosis: string;
  prescription?: string;
}

// Dummy data for medical history
const dummyMedicalHistory: MedicalHistory[] = [
  {
    id: '1',
    date: '2024-03-15',
    type: 'Consultation',
    description: 'Regular checkup',
    doctor: 'Dr. Sarah Wilson',
    diagnosis: 'Healthy, no concerns',
    prescription: 'None required'
  },
  {
    id: '2',
    date: '2024-02-20',
    type: 'Follow-up',
    description: 'Follow-up for previous condition',
    doctor: 'Dr. Michael Brown',
    diagnosis: 'Condition improving',
    prescription: 'Continue current medication'
  }
];

// Dummy patient data
const dummyPatient: Patient = {
  id: 1,
  name: 'John Doe',
  dateOfBirth: '1985-06-15',
  gender: 'Male',
  bloodType: 'O+',
  allergies: ['Penicillin', 'Pollen'],
  chronicConditions: ['Hypertension', 'Asthma']
};

export default function VisitPage({ params }: { params: { id: string } }) {
  const [visit, setVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchVisitDetails();
  }, [params.id]);

  const fetchVisitDetails = async () => {
    try {
      const response = await fetch(`/api/visits/${params.id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch visit details');
      }

      const data = await response.json();
      setVisit(data);
    } catch (error) {
      console.error('Error fetching visit details:', error);
      toast({
        title: "Error",
        description: "Failed to load visit details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              <span className="text-lg font-medium">Loading patient details...</span>
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
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Patient Visit
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    View patient information and medical history
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Patient Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-lg font-medium">{dummyPatient.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p>{format(new Date(dummyPatient.dateOfBirth), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p>{dummyPatient.gender}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blood Type</label>
                    <p>{dummyPatient.bloodType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergies Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dummyPatient.allergies.map((allergy, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chronic Conditions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  Chronic Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dummyPatient.chronicConditions.map((condition, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical History Tabs */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {dummyMedicalHistory.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {format(new Date(record.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {record.doctor}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Type</label>
                          <p>{record.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Description</label>
                          <p>{record.description}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Diagnosis</label>
                          <p>{record.diagnosis}</p>
                        </div>
                        {record.prescription && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Prescription</label>
                            <div className="flex items-center gap-2">
                              <Pill className="h-4 w-4 text-primary" />
                              <p>{record.prescription}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}