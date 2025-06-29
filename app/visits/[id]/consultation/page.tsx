'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronDown,
  FileText,
  FilePlus,
  Pill,
  Stethoscope,
  TestTube,
  Upload,
  Loader2,
  Plus,
  Trash,
  Check,
  ChevronsUpDown,
  User,
  Globe,
  Calendar,
  Users,
  MapPin,
  Clock,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
// Update the import path below if your useToast hook is located elsewhere
import { getBaseUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { PatientHistoryComponent } from '@/components/PatientHistoryComponent';

type SeverityType = 'mild' | 'moderate' | 'severe';
type StatusType = 'pending' | 'completed';
type PriorityType = 'routine' | 'urgent' | 'emergency';

interface PatientComplaint {
  complaintId: string;
  complaint: string;  
  duration: string;
  severity: SeverityType;
  createdAt: string;
}

interface MedicalProcedure {
  id: string;
  visitId: string;
  procedureId: string;
  procedureCode: string;
  procedureName: string;
  description: string;
  createdAt: string;
}

interface ProcedureDropdown {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface Diagnose {
  id: string;
  visitId: string;
  diagnoseId: string;
  diagnoseCode: string;
  diagnoseName: string;
  description: string;
  createdAt: string;
}

interface ICD9Diagnosis {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface VisitPrescription {
  prescriptionId: string;
  visitId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  createdAt: string;
}

interface LabTest {
  id: string;
  visitId: string;
  labTestId: string;
  labTestCode: string;
  labTestName: string;
  description: string;
  createdAt: string;
}

interface LabTestDropdown {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface RadiologyType {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface VisitRadiology {
  id: string;
  visitId: string;
  radioTypeId: string;
  radioTypeCode: string;
  radioTypeName: string;
  bodyPart: string;
  description: string;
  createdAt: string;
}

interface PatientInfo {
  patientId: number;
  // Required fields from API response
  fullNameEnglish: string;
  fullNameArabic: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;  
  age: string; // This will contain age data based on your mapping 
}



const dummyDiagnoses: Diagnose[] = [
  {
    id: 'diag-001',
    visitId: 'sample-visit-id',
    diagnoseId: '1',
    diagnoseCode: '401.1',
    diagnoseName: 'Hypertension',
    description: 'Stage 1 hypertension with elevated systolic pressure',
    createdAt: new Date().toISOString(),
  },
];

const dummyPrescriptions: VisitPrescription[] = [];

const dummyLabTests: LabTest[] = [];

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Check if page is in read-only mode
  const isReadOnly = searchParams.get('readOnly') === 'true';
  
  const [visit, setVisit] = useState<{
    visitId: string; 
    appointmentId: string;
    patientId: number; 
    doctorId: number;
    doctorName: string | null;
    startedAt: string;
    endedAt: string | null;
  } | null>(null);const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false); // Start as false
  const [isPatientInfoExpanded, setIsPatientInfoExpanded] = useState(false); // Collapsible state
  const [diagnoses, setDiagnoses] = useState<Diagnose[]>(dummyDiagnoses);
  const [prescriptions, setPrescriptions] = useState<VisitPrescription[]>(dummyPrescriptions);
  const [labTests, setLabTests] = useState<LabTest[]>(dummyLabTests);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newDiagnose, setNewDiagnose] = useState({ diagnose: '', description: '', selectedDiagnoseId: '' });
  const [newPrescription, setNewPrescription] = useState<{
    drugName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>({
    drugName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [newLabTest, setNewLabTest] = useState({ labTest: '', description: '', selectedLabTestId: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [radiologyRequests, setRadiologyRequests] = useState<VisitRadiology[]>([]);
  const [newRadiologyRequest, setNewRadiologyRequest] = useState<{
    radioTypeId: string;
    bodyPart: string;
    description: string;
  }>({
    radioTypeId: '',
    bodyPart: '',
    description: '',
  });
  const [complaints, setComplaints] = useState<PatientComplaint[]>([]);
  const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
  const [newComplaint, setNewComplaint] = useState<{
    ComplaintId: string; 
    description: string;
    duration: string;
    severity: SeverityType;
    CreatedAt?: string;
  }>({
    ComplaintId: Math.random().toString(36).substr(2, 9), // Generate a random ID
    description: '',
    duration: '',
    severity: 'moderate',
    CreatedAt: new Date().toISOString(), // Default to current date
  });
  const [newProcedure, setNewProcedure] = useState({ procedure: '', description: '', selectedProcedureId: '' });
  const [isLoadingComplaints, setIsLoadingComplaints] = useState(true);
  const [isDeletingComplaint, setIsDeletingComplaint] = useState<string | null>(null);
  const [isLoadingDiagnoses, setIsLoadingDiagnoses] = useState(true);
  const [isDeletingDiagnose, setIsDeletingDiagnose] = useState<string | null>(null);
  const [icd9Diagnoses, setIcd9Diagnoses] = useState<ICD9Diagnosis[]>([]);
  const [isLoadingIcd9, setIsLoadingIcd9] = useState(false);
  const [isDiagnosePopoverOpen, setIsDiagnosePopoverOpen] = useState(false);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(true);
  const [isDeletingProcedure, setIsDeletingProcedure] = useState<string | null>(null);
  const [procedureDropdown, setProcedureDropdown] = useState<ProcedureDropdown[]>([]);
  const [isLoadingProcedureDropdown, setIsLoadingProcedureDropdown] = useState(false);
  const [isProcedurePopoverOpen, setIsProcedurePopoverOpen] = useState(false);
  const [isLoadingLabTests, setIsLoadingLabTests] = useState(true);
  const [isDeletingLabTest, setIsDeletingLabTest] = useState<string | null>(null);
  const [labTestDropdown, setLabTestDropdown] = useState<LabTestDropdown[]>([]);
  const [isLoadingLabTestDropdown, setIsLoadingLabTestDropdown] = useState(false);
  const [isLabTestPopoverOpen, setIsLabTestPopoverOpen] = useState(false);
  const [radiologyTypeDropdown, setRadiologyTypeDropdown] = useState<RadiologyType[]>([]);
  const [isLoadingRadiologyDropdown, setIsLoadingRadiologyDropdown] = useState(false);
  const [isRadiologyPopoverOpen, setIsRadiologyPopoverOpen] = useState(false);
  const [isDeletingRadiology, setIsDeletingRadiology] = useState<string | null>(null);
  const [isLoadingRadiologyRequests, setIsLoadingRadiologyRequests] = useState(true);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(true);
  const [isDeletingPrescription, setIsDeletingPrescription] = useState<string | null>(null);
  useEffect(() => {
    // Try to get visit data from localStorage first
    const storedVisit = null;//localStorage.getItem('currentVisit');
    if (storedVisit) {
      const visitData = JSON.parse(storedVisit);
      setVisit(visitData);
    } else {      // Call server API that calls backend API to get visit data
      const loadVisit = async () => {
        try {
          console.log('Loading visit data for ID:', params.id);
          const response = await fetch(`/api/visits/${params.id}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include',
          });
debugger;
          if (!response.ok) {
            throw new Error(`Failed to fetch visit details: ${response.status} ${response.statusText}`);
          }

          const visitData = await response.json();
          console.log('Visit data received from server API:', visitData);
          
          // Map the backend response to our expected format
          const mappedVisitData = {
            visitId: visitData.visitId,
            appointmentId: visitData.appointmentId,
            patientId: visitData.patientID, // Note: backend uses patientID, we use patientId
            doctorId: visitData.doctorId,
            doctorName: visitData.doctorName,
            startedAt: visitData.startedAt,
            endedAt: visitData.endedAt
          };
          
          setVisit(mappedVisitData);
          console.log('Mapped visit data:', mappedVisitData);
        } catch (error) {
          console.error('Error loading visit:', error);
          toast({
            title: "Error",
            description: "Failed to load visit details",
            variant: "destructive",
          });
        }
      };

      loadVisit();
    }
  }, [params.id, toast]);// Fetch patient information when visit data is available
  useEffect(() => {
    console.log('Visit data changed:', visit);
    if (visit && visit.patientId) {
      console.log('Fetching patient info for ID:', visit.patientId);
      fetchPatientInfo(visit.patientId);
    } else {
      console.log('No visit data or patient ID available');
      // Set loading to false if no patient ID is available
      setIsLoadingPatient(false);
    }
  }, [visit]);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('Current state debug:', {
      visit,
      patientInfo,
      isLoadingPatient,
      patientId: visit?.patientId
    });
  }, [visit, patientInfo, isLoadingPatient]);  const fetchPatientInfo = async (patientId: number) => {
    console.log('Starting to fetch patient info for ID:', patientId);
    setIsLoadingPatient(true);
    
    fetch(`/api/patients/details?id=${patientId}`)
      .then(res => {
        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);
        if (!res.ok) throw new Error('Failed to fetch patient details');
        return res.json();
      })
      .then(data => {
        console.log('Raw patient data received:', data);
        
        // Extract specific fields from the response
        const extractedPatientInfo: PatientInfo = {
          // Keep existing fields if they exist
          patientId: data.patNumber || patientId,
          fullNameEnglish: data.patient_identity.patName || '',
          fullNameArabic: data.patient_identity.patarName || '',          
          dateOfBirth: data._Patient_Info.patDateOfBirth || '',
          gender: data._Patient_Info.patSex || '',         
          nationality: data._Patient_Info.patNationality || '',         
          age: data._Patient_Info.patAge + ' '+ data._Patient_Info.patday  || '', 
        };
        debugger;
        console.log('Extracted patient info:', extractedPatientInfo);
        setPatientInfo(extractedPatientInfo);
        setIsLoadingPatient(false);
        
        toast({
          title: "Success",
          description: "Patient information loaded successfully",
        });
      })
      .catch(error => {
        console.error('Error fetching patient info:', error);
        // Set patientInfo to null to show the "not available" message
        setPatientInfo(null);
        setIsLoadingPatient(false);
        toast({
          title: "Error",
          description: "Failed to load patient information",
          variant: "destructive",
        });
      });
  };

  const fetchComplaints = async (visitId: string) => {
    try {
      const response = await fetch(`/api/visit-complaint?visitId=${visitId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();
      setComplaints(data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComplaints(false);
    }
  };

  const fetchDiagnoses = async (visitId: string) => {
    try {
      const response = await fetch(`/api/visit-diagnose?visitId=${visitId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch diagnoses');
      }

      const data = await response.json();
      setDiagnoses(data);
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      toast({
        title: "Error",
        description: "Failed to load diagnoses",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDiagnoses(false);
    }
  };

  const fetchIcd9Diagnoses = async () => {
    setIsLoadingIcd9(true);
    try {
      const response = await fetch('/api/dropdown/diagnoses', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ICD-9 diagnoses');
      }

      const data = await response.json();
      setIcd9Diagnoses(data);
    } catch (error) {
      console.error('Error fetching ICD-9 diagnoses:', error);
      toast({
        title: "Error",
        description: "Failed to load ICD-9 diagnoses dropdown",
        variant: "destructive",
      });
    } finally {
      setIsLoadingIcd9(false);
    }
  };

  useEffect(() => {
    if (visit?.visitId) {
      fetchComplaints(visit.visitId);
      fetchDiagnoses(visit.visitId);
      fetchProcedures(visit.visitId);
      fetchLabTests(visit.visitId);
      fetchRadiologyRequests(visit.visitId);
      fetchPrescriptions(visit.visitId);
    }
    if (visit?.patientId) {
      fetchPatientInfo(visit.patientId);
    }
  }, [visit?.visitId, visit?.patientId]);

  const fetchProcedures = async (visitId: string) => {
    try {
      const response = await fetch(`/api/visit-procedure?visitId=${visitId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch procedures');
      }

      const data = await response.json();
      setProcedures(data);
    } catch (error) {
      console.error('Error fetching procedures:', error);
      toast({
        title: "Error",
        description: "Failed to load procedures",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProcedures(false);
    }
  };

  const fetchProcedureDropdown = async () => {
    setIsLoadingProcedureDropdown(true);
    try {
      const response = await fetch('/api/dropdown/procedures', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch procedure dropdown');
      }

      const data = await response.json();
      setProcedureDropdown(data);
    } catch (error) {
      console.error('Error fetching procedure dropdown:', error);
      toast({
        title: "Error",
        description: "Failed to load procedure dropdown",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProcedureDropdown(false);
    }
  };

  const fetchLabTests = async (visitId: string) => {
    try {
      const response = await fetch(`/api/visit-lab-test?visitId=${visitId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lab tests');
      }

      const data = await response.json();
      setLabTests(data);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      toast({
        title: "Error",
        description: "Failed to load lab tests",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLabTests(false);
    }
  };

  const fetchLabTestDropdown = async () => {
    setIsLoadingLabTestDropdown(true);
    try {
      const response = await fetch('/api/dropdown/lab-tests', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lab test dropdown');
      }

      const data = await response.json();
      setLabTestDropdown(data);
    } catch (error) {
      console.error('Error fetching lab test dropdown:', error);
      toast({
        title: "Error",
        description: "Failed to load lab test dropdown",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLabTestDropdown(false);
    }
  };

  const fetchRadiologyRequests = async (visitId: string) => {
    try {
      setIsLoadingRadiologyRequests(true);
      const response = await fetch(`/api/visit-radiology?visitId=${visitId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch radiology requests');
      }

      const data = await response.json();
      setRadiologyRequests(data);
    } catch (error) {
      console.error('Error fetching radiology requests:', error);
      toast({
        title: "Error",
        description: "Failed to load radiology requests",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRadiologyRequests(false);
    }
  };

  const fetchRadiologyTypeDropdown = async () => {
    setIsLoadingRadiologyDropdown(true);
    try {
      const response = await fetch('/api/dropdown/radiology-types', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch radiology types dropdown');
      }

      const data = await response.json();
      setRadiologyTypeDropdown(data);
    } catch (error) {
      console.error('Error fetching radiology types dropdown:', error);
      toast({
        title: "Error",
        description: "Failed to load radiology types dropdown",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRadiologyDropdown(false);
    }
  };

  const handleAddDiagnose = async () => {
    if (!newDiagnose.selectedDiagnoseId || !newDiagnose.description) {
      toast({
        title: "Validation Error",
        description: "Please select a diagnose and enter description",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!visit) {
        throw new Error('Visit details not found');
      }

      // Find the selected diagnose details
      const selectedDiagnose = icd9Diagnoses.find(d => d.id === newDiagnose.selectedDiagnoseId);
      if (!selectedDiagnose) {
        throw new Error('Selected diagnose not found');
      }

      const response = await fetch('/api/visit-diagnose', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          diagnoseId: newDiagnose.selectedDiagnoseId,
          description: newDiagnose.description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add diagnose');
      }

      const data = await response.json();
      
      // Extract the actual diagnosis data from the response
      const newDiagnosisData = data.data || data;
      
      setDiagnoses([...diagnoses, {
        id: newDiagnosisData.id || Math.random().toString(36).substr(2, 9),
        visitId: visit.visitId,
        diagnoseId: newDiagnose.selectedDiagnoseId,
        diagnoseCode: selectedDiagnose.code,
        diagnoseName: selectedDiagnose.name,
        description: newDiagnose.description,
        createdAt: newDiagnosisData.createdAt || new Date().toISOString(),
      }]);

      setNewDiagnose({ diagnose: '', description: '', selectedDiagnoseId: '' });
      
      toast({
        title: "Success",
        description: "Diagnose added successfully",
      });
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add diagnose",
        variant: "destructive",
      });
    }
  };

  const fetchPrescriptions = async (visitId: string) => {
    try {
      setIsLoadingPrescriptions(true);
      const response = await fetch(`/api/visit-prescription?visitId=${visitId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      setPrescriptions(data);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrescriptions(false);
    }
  };

  const handleAddPrescription = async () => {
    if (!newPrescription.drugName || !newPrescription.dosage || 
        !newPrescription.frequency || !newPrescription.duration) {
      toast({
        title: "Validation Error",
        description: "Please fill in all prescription fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!visit) {
        throw new Error('Visit details not found');
      }

      const response = await fetch('/api/visit-prescription', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          drugName: newPrescription.drugName,
          dosage: newPrescription.dosage,
          frequency: newPrescription.frequency,
          duration: newPrescription.duration,
          instructions: newPrescription.instructions
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add prescription');
      }

      const data = await response.json();
      
      // Extract the actual prescription data from the response
      const newPrescriptionData = data.data || data;
      
      const newPrescriptionRecord: VisitPrescription = {
        prescriptionId: newPrescriptionData.prescriptionId || Math.random().toString(36).substr(2, 9),
        visitId: visit.visitId,
        drugName: newPrescription.drugName,
        dosage: newPrescription.dosage,
        frequency: newPrescription.frequency,
        duration: newPrescription.duration,
        instructions: newPrescription.instructions,
        createdAt: newPrescriptionData.createdAt || new Date().toISOString(),
      };

      setPrescriptions([...prescriptions, newPrescriptionRecord]);
      setNewPrescription({
        drugName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
      });
      
      toast({
        title: "Success",
        description: "Prescription added successfully",
      });
    } catch (error) {
      console.error('Error adding prescription:', error);
      toast({
        title: "Error",
        description: "Failed to add prescription",
        variant: "destructive",
      });
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      setIsDeletingPrescription(prescriptionId);
      
      const response = await fetch(`/api/visit-prescription/prescription/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prescription');
      }

      setPrescriptions(prescriptions.filter(p => p.prescriptionId !== prescriptionId));
      
      toast({
        title: "Success",
        description: "Prescription deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting prescription:', error);
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      });
    } finally {
      setIsDeletingPrescription(null);
    }
  };

  const handleAddLabTest = async () => {
    if (!newLabTest.selectedLabTestId || !newLabTest.description) {
      toast({
        title: "Validation Error",
        description: "Please select a lab test and enter description",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!visit) {
        throw new Error('Visit details not found');
      }

      // Find the selected lab test details
      const selectedLabTest = labTestDropdown.find(lt => lt.id === newLabTest.selectedLabTestId);
      if (!selectedLabTest) {
        throw new Error('Selected lab test not found');
      }

      const response = await fetch('/api/visit-lab-test', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          labTestId: newLabTest.selectedLabTestId,
          description: newLabTest.description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add lab test');
      }

      const data = await response.json();
      
      // Extract the actual lab test data from the response
      const newLabTestData = data.data || data;
      
      setLabTests([...labTests, {
        id: newLabTestData.id || Math.random().toString(36).substr(2, 9),
        visitId: visit.visitId,
        labTestId: newLabTest.selectedLabTestId,
        labTestCode: selectedLabTest.code,
        labTestName: selectedLabTest.name,
        description: newLabTest.description,
        createdAt: newLabTestData.createdAt || new Date().toISOString(),
      }]);

      setNewLabTest({ labTest: '', description: '', selectedLabTestId: '' });
      
      toast({
        title: "Success",
        description: "Lab test requested successfully",
      });
    } catch (error) {
      console.error('Error adding lab test:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request lab test",
        variant: "destructive",
      });
    }
  };

  const handleAddRadiologyRequest = async () => {
    if (!newRadiologyRequest.radioTypeId || !newRadiologyRequest.bodyPart || !newRadiologyRequest.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!visit) {
        throw new Error('Visit details not found');
      }

      // Find the selected radiology type details
      const selectedRadiologyType = radiologyTypeDropdown.find(rt => rt.id === newRadiologyRequest.radioTypeId);
      if (!selectedRadiologyType) {
        throw new Error('Selected radiology type not found');
      }

      const response = await fetch('/api/visit-radiology', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          radioTypeId: newRadiologyRequest.radioTypeId,
          bodyPart: newRadiologyRequest.bodyPart,
          description: newRadiologyRequest.description
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to add radiology request');
      }

      const data = await response.json();
      
      // Extract the actual radiology data from the response
      const newRadiologyData = data.data || data;
      
      setRadiologyRequests([...radiologyRequests, {
        id: newRadiologyData.id || Math.random().toString(36).substr(2, 9),
        visitId: visit.visitId,
        radioTypeId: newRadiologyRequest.radioTypeId,
        radioTypeCode: selectedRadiologyType.code,
        radioTypeName: selectedRadiologyType.name,
        bodyPart: newRadiologyRequest.bodyPart,
        description: newRadiologyRequest.description,
        createdAt: newRadiologyData.createdAt || new Date().toISOString(),
      }]);

      setNewRadiologyRequest({
        radioTypeId: '',
        bodyPart: '',
        description: '',
      });
      
      toast({
        title: "Success",
        description: "Radiology request added successfully",
      });
    } catch (error) {
      console.error('Error adding radiology request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add radiology request",
        variant: "destructive",
      });
    }
  };

  const handleAddComplaint = async () => {
  
    if (!newComplaint.description || !newComplaint.duration || !newComplaint.severity) {
      toast({
        title: "Validation Error",
        description: "Please fill in all complaint fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!visit) {
        throw new Error('Visit details not found');
      }

      const response = await fetch('/api/visit-complaint', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          appointmentId: visit.appointmentId,
          complaint: newComplaint.description,
          duration: newComplaint.duration,
          severity: newComplaint.severity
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add complaint');
      }

      const data = await response.json();
      
      setComplaints([...complaints, {
        complaintId: data.ComplaintId || Math.random().toString(36).substr(2, 9), // Use ID from response or generate new
        complaint: newComplaint.description,
        duration: newComplaint.duration,
        severity: newComplaint.severity,
        createdAt: newComplaint.CreatedAt || new Date().toISOString(),
      }]);

      setNewComplaint({
        ComplaintId: Math.random().toString(36).substr(2, 9), // Generate a new ID
        description: '',
        duration: '',
        severity: 'moderate',
        CreatedAt: new Date().toISOString(), // Reset to current date
      });
      
      toast({
        title: "Success",
        description: "Patient complaint added successfully",
      });
    } catch (error) {
      console.error('Error adding complaint:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add complaint",
        variant: "destructive",
      });
    }
  };

  const handleAddProcedure = async () => {
    if (!newProcedure.selectedProcedureId || !newProcedure.description) {
      toast({
        title: "Validation Error",
        description: "Please select a procedure and enter description",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!visit) {
        throw new Error('Visit details not found');
      }

      // Find the selected procedure details
      const selectedProcedure = procedureDropdown.find(p => p.id === newProcedure.selectedProcedureId);
      if (!selectedProcedure) {
        throw new Error('Selected procedure not found');
      }

      const response = await fetch('/api/visit-procedure', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId: visit.visitId,
          procedureId: newProcedure.selectedProcedureId,
          description: newProcedure.description
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add procedure');
      }

      const data = await response.json();
      
      // Extract the actual procedure data from the response
      const newProcedureData = data.data || data;
      
      setProcedures([...procedures, {
        id: newProcedureData.id || Math.random().toString(36).substr(2, 9),
        visitId: visit.visitId,
        procedureId: newProcedure.selectedProcedureId,
        procedureCode: selectedProcedure.code,
        procedureName: selectedProcedure.name,
        description: newProcedure.description,
        createdAt: newProcedureData.createdAt || new Date().toISOString(),
      }]);

      setNewProcedure({ procedure: '', description: '', selectedProcedureId: '' });
      
      toast({
        title: "Success",
        description: "Procedure added successfully",
      });
    } catch (error) {
      console.error('Error adding procedure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add procedure",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProcedure = async (procedureId: string) => {
    setIsDeletingProcedure(procedureId);
    try {
      const response = await fetch(`/api/visit-procedure/procedures/${procedureId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete procedure');
      }
      
      // Remove procedure from local state
      setProcedures(procedures.filter(p => p.id !== procedureId));
      toast({
        title: "Success",
        description: "Procedure deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting procedure:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete procedure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingProcedure(null);
    }
  };

  const handleDeleteLabTest = async (labTestId: string) => {
    setIsDeletingLabTest(labTestId);
    try {
      const response = await fetch(`/api/visit-lab-test/lab-tests/${labTestId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete lab test');
      }
      
      // Remove lab test from local state
      setLabTests(labTests.filter(lt => lt.id !== labTestId));
      toast({
        title: "Success",
        description: "Lab test deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting lab test:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete lab test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingLabTest(null);
    }
  };

  const handleDeleteRadiology = async (radiologyId: string) => {
    setIsDeletingRadiology(radiologyId);
    try {
      const response = await fetch(`/api/visit-radiology/radiology/${radiologyId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete radiology request');
      }
      
      // Remove radiology request from local state
      setRadiologyRequests(radiologyRequests.filter(r => r.id !== radiologyId));
      toast({
        title: "Success",
        description: "Radiology request deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting radiology request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete radiology request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingRadiology(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast({
        title: "File Selected",
        description: `${file.name} ready to upload`,
      });
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visit?.visitId) {
      toast({
        title: "Error",
        description: "Visit ID not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      debugger;
      // Get current user info
      const userResponse = await fetch('/api/auth/me', { credentials: 'include' });
      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }

      const userData = await userResponse.json();
      const updatedBy =  userData.userId || 'Unknown User';
      
      if (!updatedBy) {
        throw new Error('User information is missing');
      }

      const consultationData = {
        visitId: visit.visitId,
        note: notes || '',
        updatedBy,
      };

      // Debug log
      console.log('Submitting consultation:', consultationData);
      
      const response = await fetch('/api/visit-consultation', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(consultationData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.title || data?.message || 'Failed to save consultation');
      }

      toast({
        title: "Success",
        description: "Consultation saved successfully",
      });
      
      router.push(`/visits/${visit.visitId}`);
    } catch (error) {
      console.error('Error saving consultation:', error);
      toast({
        title: "Error saving consultation",
        description: error instanceof Error ? error.message : "Failed to save consultation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    setIsDeletingComplaint(complaintId);
    try {
      const response = await fetch(`/api/visit-complaint/complaints/${complaintId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete complaint');
      }
      
      // Remove complaint from local state
      setComplaints(complaints.filter(c => c.complaintId !== complaintId));
      toast({
        title: "Success",
        description: "Complaint deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingComplaint(null);
    }
  };

  const handleDeleteDiagnose = async (diagnoseId: string) => {
    setIsDeletingDiagnose(diagnoseId);
    try {
      const response = await fetch(`/api/visit-diagnose/diagnoses/${diagnoseId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete diagnosis');
      }
      
      // Remove diagnosis from local state using the correct ID field
      setDiagnoses(diagnoses.filter(d => d.id !== diagnoseId));
      toast({
        title: "Success",
        description: "Diagnose deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete diagnose. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingDiagnose(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <div className="flex-1">
        <Header />        <main className="p-4 lg:p-6">
          {/* Enhanced Header Section */}
          <div className="mb-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-900/10 dark:via-indigo-900/5 dark:to-purple-900/10 rounded-xl"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/20 to-indigo-300/20 dark:from-blue-700/10 dark:to-indigo-800/10 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
            
            <div className="relative p-4 lg:p-5">              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Enhanced Back Button */}
                  <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="group gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-md hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="p-0.5 rounded-md bg-blue-100/80 dark:bg-blue-900/40 group-hover:bg-blue-200/80 dark:group-hover:bg-blue-800/60 transition-colors duration-300">
                      <ChevronLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {isReadOnly ? 'Back to Current Visit' : 'Back'}
                    </span>
                  </Button>                  {/* Enhanced Title Section */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                        <Stethoscope className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                          Consultation
                          {isReadOnly && (
                            <span className="ml-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Read-Only
                            </span>
                          )}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                          <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
                            {isReadOnly ? 'View consultation details' : 'Record patient consultation details'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Save Button */}
                {!isReadOnly && (
                  <Button
                    onClick={handleSaveConsultation}
                    className="group gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 rounded-lg font-semibold hover:-translate-y-1 border border-blue-500/20"
                    disabled={isLoading}
                  >
                    <div className="p-0.5 rounded-md bg-white/20 group-hover:bg-white/30 transition-colors duration-300">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm">
                      {isLoading ? 'Saving...' : 'Save Consultation'}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>          {/* Enhanced Read-Only Mode Banner */}
          {isReadOnly && (
            <div className="mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-yellow-50/80 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-yellow-900/20 rounded-xl"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-200/30 to-orange-300/30 dark:from-amber-700/15 dark:to-orange-800/15 rounded-full blur-lg transform translate-x-8 -translate-y-8"></div>
              
              <div className="relative p-4 border border-amber-200/50 dark:border-amber-800/50 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md shadow-amber-500/25">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">Read-Only Mode</h3>
                    <p className="text-amber-700 dark:text-amber-300 font-medium text-sm">You are viewing historical consultation data. Editing is not allowed.</p>                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patient Information Section - Compact & Collapsible */}
          {!isReadOnly && (
            <Card className="mb-4 overflow-hidden border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg ring-1 ring-black/5 dark:ring-white/10">{/* Compact Header - Always Visible */}
            <div 
              className="p-3 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{backgroundColor: '#f3f7fb'}}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8f2fe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f7fb'}
              onClick={() => setIsPatientInfoExpanded(!isPatientInfoExpanded)}
            ><div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 backdrop-blur-sm border border-blue-200">
                      <svg className="h-4 w-4 text-blue-600 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 drop-shadow-sm">Patient Information</h3>
                    {patientInfo && (
                      <div className="text-xs text-gray-600 font-medium">
                        {patientInfo.fullNameEnglish} • Age: {patientInfo.age}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {patientInfo?.dateOfBirth && (
                    <div className="text-right text-gray-600 hidden sm:block">
                      <div className="text-xs font-medium bg-blue-100/60 px-2 py-1 rounded-md backdrop-blur-sm border border-blue-200/50">
                        Patient Number: {patientInfo.patientId}
                      </div>
                    </div>
                  )}
                  <ChevronDown 
                    className={`h-4 w-4 text-gray-600 drop-shadow-sm transition-transform duration-300 ${
                      isPatientInfoExpanded ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
              </div>
            </div>

            {/* Expandable Content */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isPatientInfoExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <CardContent className="p-4">
                {isLoadingPatient ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                ) : patientInfo ? (
                  <div className="space-y-3">                    {/* Compact Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* English Name */}
                      <div className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(59,130,246,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-blue-300/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-transparent to-blue-100/30 opacity-60"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-blue-600/5 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 group-hover:from-blue-500/20 group-hover:to-blue-600/10 transition-all duration-300 ring-1 ring-blue-500/10">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">English Name</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-blue-500/60 animate-pulse"></div>
                          </div>                          <div className="text-sm font-medium text-gray-900 truncate">
                            {patientInfo.fullNameEnglish || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Arabic Name */}
                      <div className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-transparent to-emerald-100/30 opacity-60"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/10 to-emerald-600/5 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 group-hover:from-emerald-500/20 group-hover:to-emerald-600/10 transition-all duration-300 ring-1 ring-emerald-500/10">
                                <Globe className="h-4 w-4 text-emerald-600" />
                              </div>
                              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Arabic Name</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-emerald-500/60 animate-pulse"></div>
                          </div>                          <div className="text-sm font-medium text-gray-900 truncate" dir="rtl">
                            {patientInfo.fullNameArabic || 'غير محدد'}
                          </div>
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(147,51,234,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-purple-300/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 via-transparent to-purple-100/30 opacity-60"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-purple-600/5 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 group-hover:from-purple-500/20 group-hover:to-purple-600/10 transition-all duration-300 ring-1 ring-purple-500/10">
                                <Calendar className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">Birth Date</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-purple-500/60 animate-pulse"></div>
                          </div>                          <div className="text-sm font-medium text-gray-900">
                            {patientInfo.dateOfBirth 
                              ? new Date(patientInfo.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'N/A'
                            }
                          </div>
                          {patientInfo.dateOfBirth && (
                            <div className="flex items-center gap-1.5 text-xs text-purple-600 mt-2 font-medium">
                              <Clock className="h-3 w-3" />
                              <span>Age: {new Date().getFullYear() - new Date(patientInfo.dateOfBirth).getFullYear()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gender */}
                      <div className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(236,72,153,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-pink-300/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-transparent to-pink-100/30 opacity-60"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-400/10 to-pink-600/5 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 group-hover:from-pink-500/20 group-hover:to-pink-600/10 transition-all duration-300 ring-1 ring-pink-500/10">
                                <Users className="h-4 w-4 text-pink-600" />
                              </div>
                              <span className="text-xs font-medium text-pink-600 uppercase tracking-wider">Gender</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-pink-500/60 animate-pulse"></div>
                          </div>
                          <div className="text-sm font-bold text-slate-800 capitalize leading-tight">
                            {patientInfo.gender || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>                    {/* Additional Info Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nationality */}
                      <div className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(79,70,229,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-indigo-300/50">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-transparent to-indigo-100/30 opacity-60"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400/10 to-indigo-600/5 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 group-hover:from-indigo-500/20 group-hover:to-indigo-600/10 transition-all duration-300 ring-1 ring-indigo-500/10">
                                <MapPin className="h-4 w-4 text-indigo-600" />
                              </div>
                              <span className="text-[10px] font-bold text-indigo-700/80 uppercase tracking-[0.5px] leading-none">Nationality</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-indigo-500/60 animate-pulse"></div>
                          </div>
                          <div className="text-sm font-bold text-slate-800 leading-tight">
                            {patientInfo.nationality || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      {/* Age Info (from patSex field) */}
                      {patientInfo.gender && (
                        <div className="group relative overflow-hidden bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(245,158,11,0.15)] transition-all duration-500 hover:-translate-y-1 hover:border-amber-300/50">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-transparent to-amber-100/30 opacity-60"></div>
                          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/10 to-amber-600/5 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 group-hover:from-amber-500/20 group-hover:to-amber-600/10 transition-all duration-300 ring-1 ring-amber-500/10">
                                  <User className="h-4 w-4 text-amber-600" />
                                </div>
                                <span className="text-[10px] font-bold text-amber-700/80 uppercase tracking-[0.5px] leading-none">Age Info</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-amber-500/60 animate-pulse"></div>
                            </div>
                            <div className="text-sm font-bold text-slate-800 leading-tight">
                              {patientInfo.age}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Patient information not available</p>
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      <div>Visit: {visit ? '✅ Loaded' : '❌ Not loaded'}</div>
                      <div>Patient ID: {visit?.patientId || 'None'}</div>
                    </div>
                  </div>
                )}
              </CardContent>            </div>          </Card>
          )}

          {/* Patient History Section */}
          {!isReadOnly && (
            <PatientHistoryComponent 
              patientId={visit?.patientId || null}
              currentVisitId={visit?.visitId}
            />
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Patient Complaints */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white/95 to-blue-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <svg
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                      >
                        <path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c1-1.1 1-2.7 0-3.8-.7-.7-1.7-1-2.7-.7a3 3 0 0 0-4.4-3.6C10 4.2 9 5.3 9 6.6c-1-.3-2 0-2.7.7-1 1.1-1 2.7 0 3.8a4 4 0 0 0-1.6 4.5A4 4 0 0 0 8 19Z"/>
                        <path d="M12 12v4"/>
                        <path d="M12 3v3"/>
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Patient Complaints</span>                  </div>
                  {!isReadOnly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add Complaint
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                      <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <svg
                              className="h-4 w-4 text-blue-600 dark:text-blue-400"
                              fill="none"
                              height="24"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="24"
                            >
                              <path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c1-1.1 1-2.7 0-3.8-.7-.7-1.7-1-2.7-.7a3 3 0 0 0-4.4-3.6C10 4.2 9 5.3 9 6.6c-1-.3-2 0-2.7.7-1 1.1-1 2.7 0 3.8a4 4 0 0 0-1.6 4.5A4 4 0 0 0 8 19Z"/>
                              <path d="M12 12v4"/>
                              <path d="M12 3v3"/>
                            </svg>
                          </div>
                          Add New Complaint
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Complaint</Label>
                          <Textarea
                            value={newComplaint.description}
                            onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                            placeholder="Enter patient's complaint"
                            className="min-h-[80px] border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                          <Input
                            value={newComplaint.duration}
                            onChange={(e) => setNewComplaint({ ...newComplaint, duration: e.target.value })}
                            placeholder="e.g. 2 days, 1 week"
                            className="border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity</Label>
                          <Select
                            value={newComplaint.severity}
                            onValueChange={(value: SeverityType) => 
                              setNewComplaint({ ...newComplaint, severity: value })
                            }
                          >
                            <SelectTrigger className="border-gray-200/60 dark:border-gray-700/60 focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 rounded-lg transition-all duration-300 backdrop-blur-sm">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                              <SelectItem value="mild" className="focus:bg-green-50 dark:focus:bg-green-900/20">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  Mild
                                </div>
                              </SelectItem>
                              <SelectItem value="moderate" className="focus:bg-yellow-50 dark:focus:bg-yellow-900/20">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  Moderate
                                </div>
                              </SelectItem>
                              <SelectItem value="severe" className="focus:bg-red-50 dark:focus:bg-red-900/20">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                  Severe
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>                        <Button onClick={handleAddComplaint} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg py-2.5 font-medium">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Complaint
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingComplaints ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : complaints.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No complaints recorded
                    </div>
                  ) : (
                    complaints.map((complaint) => (
                      <div
                        key={complaint.complaintId}
                        className="rounded-xl border border-gray-100/80 dark:border-gray-700/60 p-5 hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-indigo-50/60 dark:hover:from-gray-700/30 dark:hover:to-gray-600/20 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-md shadow-sm hover:shadow-md border-l-4 border-l-blue-400/60"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              complaint.severity === 'severe'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : complaint.severity === 'moderate'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {complaint.severity}
                            </span>                          </div>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                              onClick={() => handleDeleteComplaint(complaint.complaintId)}
                              disabled={isDeletingComplaint === complaint.complaintId}
                            >
                              {isDeletingComplaint === complaint.complaintId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-sm mb-2">{complaint.complaint}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Duration: {complaint.duration}</span> <span>Added: {new Date(complaint.createdAt).toLocaleDateString('en-GB')}</span>
                         
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Diagnoses */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white/95 to-green-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Stethoscope className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-lg font-semibold">Diagnoses</span>                  </div>
                  {!isReadOnly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-all duration-200"
                          onClick={() => fetchIcd9Diagnoses()}
                        >
                          <Plus className="h-4 w-4" />
                          Add Diagnose
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                      <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Stethoscope className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          Add New Diagnose
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">ICD-9 Diagnose</Label>
                          {isLoadingIcd9 ? (
                            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                              <Loader2 className="h-5 w-5 animate-spin mr-3 text-blue-600" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Loading diagnoses...</span>
                            </div>
                          ) : (
                            <Popover open={isDiagnosePopoverOpen} onOpenChange={setIsDiagnosePopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isDiagnosePopoverOpen}
                                  className="w-full justify-between h-12 border-gray-200/60 dark:border-gray-700/60 hover:border-green-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 backdrop-blur-sm rounded-xl transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
                                >
                                  {newDiagnose.selectedDiagnoseId ? (
                                    (() => {
                                      const selectedDiagnose = icd9Diagnoses.find(
                                        (diagnose) => diagnose.id === newDiagnose.selectedDiagnoseId
                                      );
                                      return selectedDiagnose ? (
                                        <div className="flex flex-col items-start">
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{selectedDiagnose.name}</span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">Code: {selectedDiagnose.code}</span>
                                        </div>
                                      ) : "Select ICD-9 diagnose";
                                    })()
                                  ) : (
                                    <span className="text-gray-500 dark:text-gray-400">Select ICD-9 diagnose</span>
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0 border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl" align="start">
                                <Command className="rounded-xl">
                                  <CommandInput placeholder="Search diagnoses..." className="h-12 border-0 focus:ring-0" />
                                  <CommandList className="max-h-[200px]">
                                    <CommandEmpty className="py-6 text-center text-gray-500">No diagnoses found.</CommandEmpty>
                                    <CommandGroup>
                                      {icd9Diagnoses.map((diagnose) => (
                                        <CommandItem
                                          key={diagnose.id}
                                          value={`${diagnose.name} ${diagnose.code}`}
                                          onSelect={() => {
                                            setNewDiagnose({ 
                                              ...newDiagnose, 
                                              selectedDiagnoseId: diagnose.id === newDiagnose.selectedDiagnoseId ? "" : diagnose.id 
                                            });
                                            setIsDiagnosePopoverOpen(false);
                                          }}
                                          className="p-3 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg m-1"
                                        >
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{diagnose.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Code: {diagnose.code}</span>
                                          </div>
                                          <Check
                                            className={cn(
                                              "ml-2 h-4 w-4 text-green-600",
                                              newDiagnose.selectedDiagnoseId === diagnose.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                          <Textarea
                            value={newDiagnose.description}
                            onChange={(e) => setNewDiagnose({ ...newDiagnose, description: e.target.value })}
                            placeholder="Enter description"
                            className="min-h-[80px] border-gray-200/60 dark:border-gray-700/60 hover:border-green-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-green-500/15 focus:border-green-300/70 focus:shadow-lg focus:shadow-green-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>                        <Button onClick={handleAddDiagnose} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg py-2.5 font-medium">
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Add Diagnose
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingDiagnoses ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : diagnoses.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No diagnoses recorded
                    </div>
                  ) : (
                    diagnoses.map((diagnose) => (
                      <div
                        key={diagnose.id}
                        className="rounded-xl border border-gray-100/80 dark:border-gray-700/60 p-5 hover:bg-gradient-to-br hover:from-green-50/80 hover:to-emerald-50/60 dark:hover:from-gray-700/30 dark:hover:to-gray-600/20 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-md shadow-sm hover:shadow-md border-l-4 border-l-green-400/60"
                      >
                        <div className="flex items-center justify-between mb-2">                          <h3 className="font-medium">{diagnose.diagnoseName}</h3>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                              onClick={() => handleDeleteDiagnose(diagnose.id)}
                              disabled={isDeletingDiagnose === diagnose.id}
                            >
                              {isDeletingDiagnose === diagnose.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Code: {diagnose.diagnoseCode}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {diagnose.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Added: {new Date(diagnose.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medical Procedures */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white/95 to-purple-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <svg
                        className="h-5 w-5 text-purple-600 dark:text-purple-400"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17 3v10"/>
                        <path d="M12 3v10"/>
                        <path d="M7 3v10"/>
                        <path d="M17 17v4"/>
                        <path d="M12 17v4"/>
                        <path d="M7 17v4"/>
                        <path d="M3 13h18"/>
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Medical Procedures</span>                  </div>
                  {!isReadOnly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-all duration-200"
                          onClick={() => fetchProcedureDropdown()}
                        >
                          <Plus className="h-4 w-4" />
                          Add Procedure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                      <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                            <svg
                              className="h-4 w-4 text-purple-600 dark:text-purple-400"
                              fill="none"
                              height="24"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17 3v10"/>
                              <path d="M12 3v10"/>
                              <path d="M7 3v10"/>
                              <path d="M17 17v4"/>
                              <path d="M12 17v4"/>
                              <path d="M7 17v4"/>
                              <path d="M3 13h18"/>
                            </svg>
                          </div>
                          Add New Procedure
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label>Procedure</Label>
                          {isLoadingProcedureDropdown ? (
                            <div className="flex items-center justify-center p-3 border rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Loading procedures...</span>
                            </div>
                          ) : (
                            <Popover open={isProcedurePopoverOpen} onOpenChange={setIsProcedurePopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isProcedurePopoverOpen}
                                  className="w-full justify-between"
                                >
                                  {newProcedure.selectedProcedureId ? (
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">
                                        {procedureDropdown.find(p => p.id === newProcedure.selectedProcedureId)?.name || "Select procedure"}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Code: {procedureDropdown.find(p => p.id === newProcedure.selectedProcedureId)?.code || ""}
                                      </span>
                                    </div>
                                  ) : (
                                    "Select procedure"
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search procedures..." className="h-9" />
                                  <CommandList>
                                    <CommandEmpty>No procedures found.</CommandEmpty>
                                    <CommandGroup>
                                      {procedureDropdown.map((procedure) => (
                                        <CommandItem
                                          key={procedure.id}
                                          value={`${procedure.name} ${procedure.code}`}
                                          onSelect={() => {
                                            setNewProcedure({ 
                                              ...newProcedure, 
                                              selectedProcedureId: procedure.id === newProcedure.selectedProcedureId ? "" : procedure.id 
                                            });
                                            setIsProcedurePopoverOpen(false);
                                          }}
                                        >
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{procedure.name}</span>
                                            <span className="text-xs text-muted-foreground">Code: {procedure.code}</span>
                                          </div>
                                          <Check
                                            className={cn(
                                              "ml-2 h-4 w-4",
                                              newProcedure.selectedProcedureId === procedure.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Description</Label>
                          <Textarea
                            value={newProcedure.description}
                            onChange={(e) => setNewProcedure({ ...newProcedure, description: e.target.value })}
                            placeholder="Enter description"
                            className="min-h-[80px] border-gray-200/60 dark:border-gray-700/60 hover:border-purple-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-purple-500/15 focus:border-purple-300/70 focus:shadow-lg focus:shadow-purple-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>                        <Button onClick={handleAddProcedure} className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg py-2.5 font-medium">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Procedure
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingProcedures ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : procedures.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No procedures recorded
                    </div>
                  ) : (
                    procedures.map((procedure) => (
                      <div
                        key={procedure.id}
                        className="rounded-xl border border-gray-100/80 dark:border-gray-700/60 p-5 hover:bg-gradient-to-br hover:from-purple-50/80 hover:to-violet-50/60 dark:hover:from-gray-700/30 dark:hover:to-gray-600/20 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-md shadow-sm hover:shadow-md border-l-4 border-l-purple-400/60"
                      >
                        <div className="flex items-center justify-between mb-2">                          <h3 className="font-medium">{procedure.procedureName}</h3>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                              onClick={() => handleDeleteProcedure(procedure.id)}
                              disabled={isDeletingProcedure === procedure.id}
                            >
                              {isDeletingProcedure === procedure.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Code: {procedure.procedureCode}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {procedure.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Added: {new Date(procedure.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white/95 to-orange-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                      <Pill className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-lg font-semibold">Prescriptions</span>                  </div>                  {!isReadOnly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4" />
                          Add Prescription
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                      <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <Pill className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          Add New Prescription
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Drug Name</Label>
                          <Input
                            value={newPrescription.drugName}
                            onChange={(e) => setNewPrescription({ ...newPrescription, drugName: e.target.value })}
                            placeholder="Enter drug name"
                            className="h-10 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Dosage</Label>
                            <Input
                              value={newPrescription.dosage}
                              onChange={(e) => setNewPrescription({ ...newPrescription, dosage: e.target.value })}
                              placeholder="e.g. 500mg"
                              className="h-10 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</Label>
                            <Input
                              value={newPrescription.frequency}
                              onChange={(e) => setNewPrescription({ ...newPrescription, frequency: e.target.value })}
                              placeholder="e.g. 3 times daily"
                              className="h-10 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                          <Input
                            value={newPrescription.duration}
                            onChange={(e) => setNewPrescription({ ...newPrescription, duration: e.target.value })}
                            placeholder="e.g. 7 days"
                            className="h-10 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructions</Label>
                          <Textarea
                            value={newPrescription.instructions}
                            onChange={(e) => setNewPrescription({ ...newPrescription, instructions: e.target.value })}
                            placeholder="Enter special instructions (e.g. Take with food, Before meals)"
                            className="min-h-[80px] border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-orange-500/15 focus:border-orange-300/70 focus:shadow-lg focus:shadow-orange-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>                        <Button onClick={handleAddPrescription} className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg py-2.5 font-medium">
                          <Pill className="h-4 w-4 mr-2" />
                          Add Prescription
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingPrescriptions ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : prescriptions.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No prescriptions recorded
                    </div>
                  ) : (
                    prescriptions.map((prescription) => (
                      <div
                        key={prescription.prescriptionId}
                        className="rounded-xl border border-gray-100/80 dark:border-gray-700/60 p-5 hover:bg-gradient-to-br hover:from-orange-50/80 hover:to-amber-50/60 dark:hover:from-gray-700/30 dark:hover:to-gray-600/20 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-md shadow-sm hover:shadow-md border-l-4 border-l-orange-400/60"
                      >
                        <div className="flex items-center justify-between mb-2">                          <h3 className="font-medium">{prescription.drugName}</h3>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                              onClick={() => handleDeletePrescription(prescription.prescriptionId)}
                              disabled={isDeletingPrescription === prescription.prescriptionId}
                            >
                              {isDeletingPrescription === prescription.prescriptionId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Dosage:</span>
                            <p>{prescription.dosage}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Frequency:</span>
                            <p>{prescription.frequency}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <p>{prescription.duration}</p>
                          </div>
                        </div>
                        {prescription.instructions && (
                          <p className="text-sm text-muted-foreground">
                            Instructions: {prescription.instructions}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Added: {new Date(prescription.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lab Tests */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white/95 to-red-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <TestTube className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-lg font-semibold">Lab Tests</span>                  </div>
                  {!isReadOnly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-all duration-200"
                          onClick={() => fetchLabTestDropdown()}
                        >
                          <Plus className="h-4 w-4" />
                          Request Test
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                      <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <TestTube className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          Request Lab Test
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label>Lab Test</Label>
                          {isLoadingLabTestDropdown ? (
                            <div className="flex items-center justify-center p-3 border rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-muted-foreground">Loading lab tests...</span>
                            </div>
                          ) : (
                            <Popover open={isLabTestPopoverOpen} onOpenChange={setIsLabTestPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isLabTestPopoverOpen}
                                  className="w-full justify-between"
                                >
                                  {newLabTest.selectedLabTestId ? (
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">
                                        {labTestDropdown.find(lt => lt.id === newLabTest.selectedLabTestId)?.name || "Select lab test"}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        Code: {labTestDropdown.find(lt => lt.id === newLabTest.selectedLabTestId)?.code || ""}
                                      </span>
                                    </div>
                                  ) : (
                                    "Select lab test"
                                  )}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search lab tests..." className="h-9" />
                                  <CommandList>
                                    <CommandEmpty>No lab tests found.</CommandEmpty>
                                    <CommandGroup>
                                      {labTestDropdown.map((labTest) => (
                                        <CommandItem
                                          key={labTest.id}
                                          value={`${labTest.name} ${labTest.code}`}
                                          onSelect={() => {
                                            setNewLabTest({ 
                                              ...newLabTest, 
                                              selectedLabTestId: labTest.id === newLabTest.selectedLabTestId ? "" : labTest.id 
                                            });
                                            setIsLabTestPopoverOpen(false);
                                          }}
                                        >
                                          <div className="flex flex-col flex-1">
                                            <span className="font-medium">{labTest.name}</span>
                                            <span className="text-xs text-muted-foreground">Code: {labTest.code}</span>
                                          </div>
                                          <Check
                                            className={cn(
                                              "ml-2 h-4 w-4",
                                              newLabTest.selectedLabTestId === labTest.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label>Description</Label>
                          <Textarea
                            value={newLabTest.description}
                            onChange={(e) => setNewLabTest({ ...newLabTest, description: e.target.value })}
                            placeholder="Enter description"
                            className="min-h-[80px] border-gray-200/60 dark:border-gray-700/60 hover:border-red-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-red-500/15 focus:border-red-300/70 focus:shadow-lg focus:shadow-red-500/8 rounded-lg transition-all duration-300 backdrop-blur-sm"
                          />
                        </div>                        <Button onClick={handleAddLabTest} className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg py-2.5 font-medium">
                          <TestTube className="h-4 w-4 mr-2" />
                          Request Test
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingLabTests ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : labTests.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No lab tests requested
                    </div>
                  ) : (
                    labTests.map((labTest) => (
                      <div
                        key={labTest.id}
                        className="rounded-xl border border-gray-100/80 dark:border-gray-700/60 p-5 hover:bg-gradient-to-br hover:from-red-50/80 hover:to-rose-50/60 dark:hover:from-gray-700/30 dark:hover:to-gray-600/20 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-md shadow-sm hover:shadow-md border-l-4 border-l-red-400/60"
                      >
                        <div className="flex items-center justify-between mb-2">                          <h3 className="font-medium">{labTest.labTestName}</h3>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                              onClick={() => handleDeleteLabTest(labTest.id)}
                              disabled={isDeletingLabTest === labTest.id}
                            >
                              {isDeletingLabTest === labTest.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Code: {labTest.labTestCode}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {labTest.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Added: {new Date(labTest.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Radiology */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white/95 to-cyan-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                      <svg
                        className="h-5 w-5 text-cyan-600 dark:text-cyan-400"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
                        <path d="M3 12h6"/>
                        <path d="M15 12h6"/>
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Radiology</span>                  </div>
                  {!isReadOnly && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 transition-all duration-200"
                          onClick={() => {
                            if (radiologyTypeDropdown.length === 0) {
                              fetchRadiologyTypeDropdown();
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Request Radiology
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                      <DialogHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                        <DialogTitle className="text-lg font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                            <svg
                              className="h-4 w-4 text-cyan-600 dark:text-cyan-400"
                              fill="none"
                              height="24"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
                              <path d="M3 12h6"/>
                              <path d="M15 12h6"/>
                            </svg>
                          </div>
                          Request Radiology
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Radiology Type</Label>
                          {radiologyTypeDropdown.length > 0 && (
                            <Popover open={isRadiologyPopoverOpen} onOpenChange={setIsRadiologyPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isRadiologyPopoverOpen}
                                  className="w-full justify-between h-12 border-gray-200/60 dark:border-gray-700/60 hover:border-cyan-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-cyan-500/15 focus:border-cyan-300/70 focus:shadow-lg focus:shadow-cyan-500/8 backdrop-blur-sm rounded-xl transition-all duration-300 bg-white/50 dark:bg-gray-800/50"
                                  onClick={() => {
                                    if (radiologyTypeDropdown.length === 0) {
                                      fetchRadiologyTypeDropdown();
                                    }
                                  }}
                                >
                                  <span className={newRadiologyRequest.radioTypeId ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
                                    {newRadiologyRequest.radioTypeId
                                      ? radiologyTypeDropdown.find(
                                          (radiologyType) => radiologyType.id === newRadiologyRequest.radioTypeId
                                        )?.name
                                      : "Select radiology type..."}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0 border-0 shadow-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                                <Command className="rounded-xl">
                                  <CommandInput placeholder="Search radiology types..." className="h-12 border-0 focus:ring-0" />
                                  <CommandList className="max-h-[200px]">
                                    <CommandEmpty className="py-6 text-center text-gray-500">No radiology type found.</CommandEmpty>
                                    <CommandGroup>
                                      {radiologyTypeDropdown.map((radiologyType) => (
                                        <CommandItem
                                          key={radiologyType.id}
                                          value={radiologyType.name}
                                          onSelect={() => {
                                            setNewRadiologyRequest({
                                              ...newRadiologyRequest,
                                              radioTypeId: radiologyType.id,
                                            });
                                            setIsRadiologyPopoverOpen(false);
                                          }}
                                          className="p-3 cursor-pointer hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg m-1"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-3 h-4 w-4 text-cyan-600",
                                              newRadiologyRequest.radioTypeId === radiologyType.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col items-start">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{radiologyType.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {radiologyType.code}
                                            </span>
                                            {radiologyType.description && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {radiologyType.description}
                                              </span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Body Part</Label>
                          <Input
                            value={newRadiologyRequest.bodyPart}
                            onChange={(e) => 
                              setNewRadiologyRequest({ ...newRadiologyRequest, bodyPart: e.target.value })
                            }
                            placeholder="Specify body part (e.g. Chest, Abdomen, Head)"
                            className="h-10 border-gray-200/60 dark:border-gray-700/60 hover:border-cyan-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-cyan-500/15 focus:border-cyan-300/70 focus:shadow-lg focus:shadow-cyan-500/8 backdrop-blur-sm rounded-lg transition-all duration-300"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                          <Textarea
                            value={newRadiologyRequest.description}
                            onChange={(e) => 
                              setNewRadiologyRequest({ ...newRadiologyRequest, description: e.target.value })
                            }
                            placeholder="Enter description and clinical notes..."
                            className="min-h-[80px] border-gray-200/60 dark:border-gray-700/60 hover:border-cyan-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-cyan-500/15 focus:border-cyan-300/70 focus:shadow-lg focus:shadow-cyan-500/8 backdrop-blur-sm rounded-lg transition-all duration-300"
                          />
                        </div>
                        <Button onClick={handleAddRadiologyRequest} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg py-2.5 font-medium">
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                          </svg>
                          Submit Request
                        </Button>                      </div>
                    </DialogContent>
                  </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingRadiologyRequests ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : radiologyRequests.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No radiology requests
                    </div>
                  ) : (
                    radiologyRequests.map((request) => (
                      <div
                        key={request.id}
                        className="rounded-xl border border-gray-100/80 dark:border-gray-700/60 p-5 hover:bg-gradient-to-br hover:from-cyan-50/80 hover:to-blue-50/60 dark:hover:from-gray-700/30 dark:hover:to-gray-600/20 transition-all duration-300 bg-gradient-to-br from-white/90 to-gray-50/70 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-md shadow-sm hover:shadow-md border-l-4 border-l-cyan-400/60"
                      >
                        <div className="flex items-center justify-between mb-2">                          <h3 className="font-medium">{request.radioTypeName}</h3>
                          {!isReadOnly && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                              onClick={() => handleDeleteRadiology(request.id)}
                              disabled={isDeletingRadiology === request.id}
                            >
                              {isDeletingRadiology === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          Code: {request.radioTypeCode} • Body Part: {request.bodyPart}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Added: {new Date(request.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes & Attachments - Full Width */}
            <Card className="col-span-2 shadow-xl border-0 bg-gradient-to-br from-white/95 to-indigo-50/80 dark:from-gray-800/95 dark:to-gray-700/80 backdrop-blur-lg border border-white/20 dark:border-gray-700/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                    <FilePlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-lg font-semibold">Notes & Attachments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Consultation Notes</Label>                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isReadOnly ? "No consultation notes available" : "Enter consultation notes..."}
                      disabled={isReadOnly}
                      className="min-h-[200px] border-gray-200/60 dark:border-gray-600/60 hover:border-blue-300/70 hover:shadow-sm focus:outline-none focus-visible:outline-none focus:ring-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/15 focus:border-blue-300/70 focus:shadow-lg focus:shadow-blue-500/8 backdrop-blur-sm rounded-lg transition-all duration-300"
                    />                  </div>
                  {!isReadOnly && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Attachments</Label>
                      <div className="mt-2">
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Label
                            htmlFor="file-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600"
                          >
                            <Upload className="h-4 w-4" />
                            Upload File
                          </Label>
                          {selectedFile && (
                            <span className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-md border">
                              {selectedFile.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
