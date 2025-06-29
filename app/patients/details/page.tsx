'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'; // optional but useful
import countryList from 'react-select-country-list';
import Select from 'react-select';
import PhoneInput, { CountryData } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { User, Calendar, Globe, FileCheck, Phone, Mail, CreditCard, Camera, FileText, Fingerprint, Upload, Save, X, Plus, UserCheck, Edit, Eye, ArrowLeft, Search, ChevronsUpDown, Check } from 'lucide-react';
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

// Custom PhoneInput styles matching the Add New Patient page
const dropdownStyles = `
  .react-tel-input .country-list {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(229, 231, 235, 0.6) !important;
    border-radius: 12px !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    overflow: hidden !important;
    z-index: 99999 !important;
    position: absolute !important;
  }
  
  .react-tel-input .country-list .country {
    padding: 8px 12px !important;
    border-bottom: 1px solid rgba(229, 231, 235, 0.3) !important;
    transition: all 0.2s ease !important;
  }
  
  .react-tel-input .country-list .country:hover {
    background: rgba(59, 130, 246, 0.05) !important;
    border-left: 3px solid rgba(59, 130, 246, 0.5) !important;
  }
  
  .react-tel-input .country-list .country.highlight {
    background: rgba(59, 130, 246, 0.1) !important;
    border-left: 3px solid rgba(59, 130, 246, 0.7) !important;
  }
  
  .react-tel-input .country-list .country .country-name {
    color: #374151 !important;
    font-weight: 500 !important;
  }
  
  .react-tel-input .country-list .country .dial-code {
    color: #6b7280 !important;
    font-size: 0.875rem !important;
  }
  
  .react-tel-input .country-list .search {
    padding: 12px !important;
    background: rgba(249, 250, 251, 0.8) !important;
    backdrop-filter: blur(4px) !important;
    border-bottom: 1px solid rgba(229, 231, 235, 0.5) !important;
  }
  
  .react-tel-input .country-list .search-box {
    border: 1px solid rgba(209, 213, 219, 0.5) !important;
    border-radius: 8px !important;
    padding: 8px 12px !important;
    background: rgba(255, 255, 255, 0.9) !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
  }
  
  .react-tel-input .country-list .search-box:focus {
    outline: none !important;
    border-color: rgba(59, 130, 246, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  
  @media (prefers-color-scheme: dark) {
    .react-tel-input .country-list {
      background: rgba(17, 24, 39, 0.95) !important;
      border: 1px solid rgba(75, 85, 99, 0.6) !important;
    }
    
    .react-tel-input .country-list .country .country-name {
      color: #e5e7eb !important;
    }
    
    .react-tel-input .country-list .country .dial-code {
      color: #9ca3af !important;
    }
    
    .react-tel-input .country-list .country:hover {
      background: rgba(59, 130, 246, 0.1) !important;
    }
    
    .react-tel-input .country-list .search {
      background: rgba(31, 41, 55, 0.8) !important;
      border-bottom: 1px solid rgba(75, 85, 99, 0.5) !important;
    }
    
    .react-tel-input .country-list .search-box {
      background: rgba(31, 41, 55, 0.9) !important;
      border: 1px solid rgba(75, 85, 99, 0.5) !important;
      color: #e5e7eb !important;
    }
  }
`;

export default function PatientDetailsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams ? searchParams.get('id') : null;
    const [patient, setPatient] = useState<any>(null); // Explicitly type as any
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { toast } = useToast();
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        fetch(`/api/patients/details?id=${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch patient details');
                return res.json();
            })
            .then(data => {
                setPatient(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Could not load patient details.');
                setLoading(false);
            });
    }, [id]);

    // Add state for editable fields after patient is loaded
    const [editableIdentity, setEditableIdentity] = useState<any>({});
    const [editableInfo, setEditableInfo] = useState<any>({});
    const [editableContact, setEditableContact] = useState<any>({});

    // Add state for editable multi-value fields
    const [editableMobiles, setEditableMobiles] = useState<string[]>([]);
    const [editableEmails, setEditableEmails] = useState<string[]>([]);
    const [editableInsuranceCards, setEditableInsuranceCards] = useState<string[]>([]);

    // Add state for phone input
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('');

    // Add state for showing photo and loading photo
    const [showPhoto, setShowPhoto] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoLoading, setPhotoLoading] = useState(false);
    const [photoError, setPhotoError] = useState('');

    // Add state for showing scanned doc and loading scanned doc
    const [showScannedDoc, setShowScannedDoc] = useState(false);
    const [scannedDocUrl, setScannedDocUrl] = useState<string | null>(null);
    const [scannedDocLoading, setScannedDocLoading] = useState(false);
    const [scannedDocError, setScannedDocError] = useState('');

    // Add state for scanned document update
    const [scanningDoc, setScanningDoc] = useState(false);
    const [scannedDocBase64, setScannedDocBase64] = useState<string | null>(null);
    const [updateDocLoading, setUpdateDocLoading] = useState(false);
    const [updateDocError, setUpdateDocError] = useState('');
    const [updateDocSuccess, setUpdateDocSuccess] = useState(false);
    const scannedDocSocketRef = React.useRef<WebSocket | null>(null);

    // Nationality dropdown state
    const [nationalitySearchOpen, setNationalitySearchOpen] = useState(false);
    const [nationalitySearchValue, setNationalitySearchValue] = useState('');
    const [nationalitySearchTerm, setNationalitySearchTerm] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        if (patient) {
            const info = (patient as any)._Patient_Info || {};
            const nationality = info.patNationality?.toLowerCase();

            // Set editable info with auto idType
            setEditableInfo({
                ...info,
                idType: nationality === 'jordan' ? (info.idType || 'National ID') : 'Passport'
            });

            setEditableIdentity((patient as any).patient_identity || {});
            setEditableContact((patient as any)._Patient_ContactInfo || {});
            setEditableMobiles(
                (patient as any)._Patient_ContactInfo?._Patient_Mobile?.map((m: any) => `+${m.mobileCountryCode} ${m.patMobile}`) || []
            );
            setEditableEmails(
                (patient as any)._Patient_ContactInfo?._Patient_Email?.map((e: any) => e.patEmail) || []
            );
            setEditableInsuranceCards(
                ((patient as any)._Patient_InsuranceCard?._patient_Insurance || []).map((i: any) => i.cardNo) || []
            );
        }
    }, [patient]);


    const countryOptions = countryList().getData();

    // Add ChipInput for multi-value fields
    type ChipInputProps = {
        label: string;
        values: string[];
        setValues: (vals: string[]) => void;
        placeholder: string;
        type?: string;
        inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    };    function ChipInput({ label, values, setValues, placeholder, type = 'text', inputMode = 'text' }: ChipInputProps) {
        const [input, setInput] = useState('');
        const inputRef = React.useRef<HTMLInputElement>(null);
        const addValue = () => {
            const val = input.trim();
            if (!val || values.includes(val)) return;
            setValues([val, ...values]);
            setInput('');
            inputRef.current?.focus();
        };
        const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                e.preventDefault();
                addValue();
            }
            if (e.key === 'Backspace' && !input && values.length > 0) {
                setValues(values.slice(0, -1));
            }
        };
        return (
            <div>
                <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-2 block">{label}</Label>
                <div className="relative backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-h-[52px] flex flex-wrap items-center gap-2 px-3 py-2">
                    {values.map((val: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 shadow-sm">
                            {val}
                            {values.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setValues(values.filter((_, i) => i !== idx))}
                                    className="ml-1 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-800 dark:hover:text-red-300 transition-colors duration-200 flex items-center justify-center text-xs font-bold"
                                    aria-label={`Remove ${label} ${val}`}
                                >
                                    ×
                                </button>
                            )}
                        </span>
                    ))}
                    <input
                        ref={inputRef}
                        type={type}
                        inputMode={inputMode}
                        className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm py-2 px-2 placeholder-gray-400 dark:placeholder-gray-500 text-gray-700 dark:text-gray-200"
                        placeholder={placeholder}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        onBlur={addValue}
                    />
                    <button
                        type="button"
                        onClick={addValue}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200 text-sm font-bold"
                        tabIndex={-1}
                        aria-label={`Add ${label}`}
                    >
                        +
                    </button>
                </div>
            </div>
        );
    }

    const addMobile = () => {
        const val = (phoneCountryCode + phoneInput).trim();
        if (!val || editableMobiles.includes(val)) return;
        setEditableMobiles([val, ...editableMobiles]);
        setPhoneInput('');
        setPhoneCountryCode('');
    };

    // Handle creating appointment for a patient
    const handleCreateAppointment = () => {
        if (!patient) return;
        
        // Navigate to appointments page with patient info as query parameters
        const params = new URLSearchParams({
            patientId: (patient.patientID || patient.patNumber || '').toString(),
            patientName: patient.patient_identity?.firstEnName || patient.patName || '',
            openDialog: 'true'
        });
        router.push(`/appointments?${params.toString()}`);
    };

    // --- Scanned Document Scan & Update Logic ---
    const handleScanDocument = () => {
        setScanningDoc(true);
        setScannedDocBase64(null);
        setUpdateDocSuccess(false);
        setUpdateDocError('');
        if (!scannedDocSocketRef.current || scannedDocSocketRef.current.readyState !== WebSocket.OPEN) {
            const socket = new WebSocket('ws://localhost:12346/');
            scannedDocSocketRef.current = socket;
            socket.onopen = () => {
                socket.send('start-scan');
            };
            socket.onmessage = (event) => {
                const data = event.data as string;
                if (data.startsWith('IMG:')) {
                    const base64Img = data.substring(4).trim();
                    setScannedDocBase64(base64Img);
                    setScanningDoc(false);
                }
            };
            socket.onerror = (error) => {
                setScanningDoc(false);
                setUpdateDocError('Cannot connect to the scanner. Please make sure the scanner app is running.');
            };
        } else {
            scannedDocSocketRef.current.send('start-scan');
        }
    };

    const handleUpdateScannedDocument = async () => {
        if (!scannedDocBase64 || !patient) return;
        setUpdateDocLoading(true);
        setUpdateDocError('');
        setUpdateDocSuccess(false);
        try {
            debugger
            const id_ = patient.patientID || patient.patNumber;
            const document_ = scannedDocBase64;
            const res = await fetch(`/api/patients/UpdatePatientDocument`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id_,
                    document: document_
                }),
            });

            if (!res.ok) throw new Error('Failed to update scanned document');

            setUpdateDocSuccess(true);
            setScannedDocBase64(null);
        } catch (err: any) {
            setUpdateDocError(err.message || 'Failed to update scanned document');
        } finally {
            setUpdateDocLoading(false);
        }

    }

    const [showCamera, setShowCamera] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);

    // Add state to track which photo input is active
    const [photoInputMode, setPhotoInputMode] = useState<'none' | 'camera' | 'file'>('none');

    const handleOpenCamera = () => {
        setShowCamera(true);
        setCapturedPhoto(null);
        setPhotoUpdateMessage('');
        setPhotoUpdateSuccess(false);
        setPhotoInputMode('camera'); // Set mode to camera
        // Reset file input
        const fileInput = document.getElementById('photo') as HTMLInputElement | null;
        if (fileInput) fileInput.value = '';
    };

    const handleCancelCamera = () => {
        setShowCamera(false);
        setCapturedPhoto(null);
        setPhotoUpdateMessage('');
        setPhotoUpdateSuccess(false);
        setPhotoInputMode('none');
    };

    const aspectRatio = 4 / 3;
    const previewWidth = 320; // Reduced width for a smaller preview
    const previewHeight = Math.round(previewWidth / aspectRatio);

    const handleCapturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = previewWidth;
            canvas.height = previewHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const photo = canvas.toDataURL('image/png');
                setCapturedPhoto(photo);
                setShowCamera(false);
            }
        }
    };

    const [photoUpdateMessage, setPhotoUpdateMessage] = useState('');
    const [photoUpdateSuccess, setPhotoUpdateSuccess] = useState(false);

    const handleUpdateImage = async () => {
        if (!capturedPhoto || !id) return;
        try {
            const response = await fetch('/api/patients/UpdatePatientImage', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: parseInt(id), photo: capturedPhoto }),
            });

            if (!response.ok) {
                throw new Error('Failed to update image');
            }

            setPhotoUpdateMessage('Photo updated successfully!');
            setPhotoUpdateSuccess(true);
            setCapturedPhoto(null);
            setShowCamera(false);
            setShowPhoto(false); // Hide the photo preview so next View fetches the latest
            setPhotoInputMode('none'); // Enable both options again
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update patient',
                variant: 'destructive',
            });
            setPhotoUpdateSuccess(false);
        }
    };

    useEffect(() => {
        if (showCamera && videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                    }
                })
                .catch((err) => {
                    console.error('Error accessing camera:', err);
                    alert('Unable to access camera.');
                });
        } else if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
    }, [showCamera]);

    // Update handleFileChange to close camera
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhotoInputMode('file'); // Set mode to file
        setShowCamera(false); // Close camera if open
        setCapturedPhoto(null);
        setPhotoUpdateMessage('');
        setPhotoUpdateSuccess(false);
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size should not exceed 5MB');
                return;
            }
            try {
                const base64String = await convertFileToBase64(file);
                setCapturedPhoto(base64String);
            } catch (error) {
                alert('Failed to process the image');
            }
        }
    };

    useEffect(() => {
        if (photoUpdateSuccess) {
            setCapturedPhoto(null); // Clear the captured photo
            setShowCamera(false); // Close the camera if open
        }
    }, [photoUpdateSuccess]);

    // Initialize filtered countries when countryOptions are loaded
    useEffect(() => {
        setFilteredCountries(countryOptions);
    }, [countryOptions]);

    // Set initial nationality search value when patient data is loaded
    useEffect(() => {
        if (patient) {
            const info = (patient as any)._Patient_Info || {};
            if (info.patNationality) {
                const country = countryOptions.find(option => option.label === info.patNationality);
                if (country) {
                    setNationalitySearchValue(country.value);
                }
            }
        }
    }, [patient, countryOptions]);

    // Filter countries for nationality dropdown
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (nationalitySearchTerm && nationalitySearchTerm.trim().length >= 1) {
                const filtered = countryOptions.filter((country) =>
                    country.label.toLowerCase().includes(nationalitySearchTerm.toLowerCase()) ||
                    country.value.toLowerCase().includes(nationalitySearchTerm.toLowerCase())
                );
                setFilteredCountries(filtered);
            } else {
                setFilteredCountries(countryOptions);
            }
        }, 150);

        return () => clearTimeout(timeoutId);
    }, [nationalitySearchTerm, countryOptions]);

    if (!id) return <div className="p-8">No patient ID provided.</div>;
    if (loading) return <div className="p-8">Loading patient details...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    if (!patient) return <div className="p-8">No patient data found.</div>;

    // Extract fields from nested structure
    const identity = (patient as any).patient_identity || {};

    const info = (patient as any)._Patient_Info || {};
    const contact = (patient as any)._Patient_ContactInfo || {};
    const media = (patient as any)._Patient_Media || {};
    const mobiles = (contact._Patient_Mobile || []).map((m: any) => `+${m.mobileCountryCode} ${m.patMobile}`);
    const emails = (contact._Patient_Email || []).map((e: any) => e.patEmail);
    const insuranceCards = ((patient as any)._Patient_InsuranceCard?._patient_Insurance || []).map((i: any) => i.cardNo);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: dropdownStyles }} />
            <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10">
            <Sidebar />
            <div className="flex-1">
                <Header />                <main className="py-3 xl:py-4">
                    <div className="px-3 md:px-4 xl:px-6 w-full">
                        {/* Page Header */}
                        <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4 mb-3">                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg">
                                        <UserCheck className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 dark:from-gray-100 dark:to-blue-400 bg-clip-text text-transparent">
                                            Patient Details
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            View and edit patient information
                                        </p>
                                    </div>
                                </div>                                <div className="flex items-center gap-4">
                                    <Button 
                                        onClick={handleCreateAppointment}
                                        className="gap-2 shadow-lg hover:shadow-md transition-all bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                                        size="lg"
                                    >
                                        <Calendar className="h-5 w-5" />
                                        New Appointment
                                    </Button>
                                    <Button 
                                        onClick={() => router.push('/patients')}
                                        className="gap-2 shadow-lg hover:shadow-md transition-all bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-0"
                                        size="lg"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                        Back to Patients
                                    </Button>
                                </div>
                            </div>
                        </div>                        <div className="space-y-2">
                            {/* English Names Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-md">
                                        <User className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">English Names</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">First Name (English)</Label>
                                        <Input 
                                            value={editableIdentity.firstEnName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, firstEnName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Father's Name (English)</Label>
                                        <Input 
                                            value={editableIdentity.fatherEnName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, fatherEnName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl  transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Grandfather's Name (English)</Label>
                                        <Input 
                                            value={editableIdentity.familyEnName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, familyEnName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl  transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Family Name (English)</Label>
                                        <Input 
                                            value={editableIdentity.finalEnName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, finalEnName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl  transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>                            {/* Arabic Names Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-md">
                                        <Globe className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Arabic Names</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">اسم العائلة (عربي)</Label>
                                        <Input 
                                            value={editableIdentity.finalArName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, finalArName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">اسم الجد (عربي)</Label>
                                        <Input 
                                            value={editableIdentity.familyArName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, familyArName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">اسم الأب (عربي)</Label>
                                        <Input 
                                            value={editableIdentity.fatherArName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, fatherArName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">الاسم الأول (عربي)</Label>
                                        <Input 
                                            value={editableIdentity.firstArName || ''} 
                                            onChange={e => setEditableIdentity({ ...editableIdentity, firstArName: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                        />
                                    </div>
                                </div>
                            </div>                            {/* Personal Information Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-md">
                                        <Calendar className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Personal Information</h2>
                                </div>                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Date of Birth</Label>
                                        <Input
                                            type="date"
                                            value={
                                                editableInfo.patDateOfBirth && !isNaN(Date.parse(editableInfo.patDateOfBirth))
                                                    ? format(new Date(editableInfo.patDateOfBirth), 'yyyy-MM-dd')
                                                    : (info.patDateOfBirth && !isNaN(Date.parse(info.patDateOfBirth))
                                                        ? format(new Date(info.patDateOfBirth), 'yyyy-MM-dd')
                                                        : '')
                                            }
                                            onChange={e => setEditableInfo({ ...editableInfo, patDateOfBirth: e.target.value })}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Gender</Label>
                                        <select
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200"
                                            value={editableInfo.patSex || ''}
                                            onChange={e => setEditableInfo({ ...editableInfo, patSex: e.target.value })}
                                        >
                                            {info.patSex === 'Male' ? (
                                                <>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Female">Female</option>
                                                    <option value="Male">Male</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Nationality</Label>
                                        <Popover open={nationalitySearchOpen} onOpenChange={(open) => {
                                            setNationalitySearchOpen(open);
                                            if (!open) {
                                                setNationalitySearchTerm('');
                                                setFilteredCountries(countryOptions);
                                            } else {
                                                setFilteredCountries(countryOptions);
                                            }
                                        }}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={nationalitySearchOpen}
                                                    className="w-full max-w-sm justify-between h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus:outline-none focus-visible:outline-none focus:ring-2 focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-blue-500/20 focus:border-blue-400/70 focus:shadow-lg focus:shadow-blue-500/10 transition-all duration-300 hover:bg-white/90 dark:hover:bg-gray-800/90 hover:border-blue-300/70 hover:shadow-md group relative overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                                                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                                                            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        {nationalitySearchValue ? (
                                                            <div className="flex flex-col min-w-0 flex-1 text-left">
                                                                <span className="font-medium text-gray-900 dark:text-gray-100 truncate text-left w-full">
                                                                    {countryOptions.find((country) => country.value === nationalitySearchValue)?.label}
                                                                </span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 text-left w-full">
                                                                    Selected nationality
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-left truncate text-gray-500 dark:text-gray-400 w-full">
                                                                Search and select nationality...
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl rounded-xl overflow-hidden" align="start">
                                                <Command className="rounded-xl border-0 [&_[cmdk-input-wrapper]]:border-0 [&_[cmdk-input-wrapper]]:p-0 [&_[cmdk-input-wrapper]]:bg-transparent [&_[cmdk-input-wrapper]_svg]:hidden" shouldFilter={false}>
                                                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                                        <div className="flex items-center gap-4 w-full relative z-10">
                                                            <div className="relative group transition-all duration-300">
                                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
                                                                <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 shadow-lg border border-blue-200/50 dark:border-blue-700/30 flex-shrink-0 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                                                                    <Search className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 w-full space-y-2 group">
                                                                <div className="relative">
                                                                    <CommandInput 
                                                                        placeholder="Filter nationalities by name..." 
                                                                        value={nationalitySearchTerm}
                                                                        onValueChange={setNationalitySearchTerm}
                                                                        className="w-full border-0 focus:ring-0 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-semibold px-0 py-1 h-auto text-gray-800 dark:text-gray-200 focus:placeholder:text-gray-300 dark:focus:placeholder:text-gray-600 transition-colors duration-200"
                                                                    />
                                                                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 group-focus-within:w-full"></div>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-1">
                                                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                                                        </div>
                                                                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                                            {nationalitySearchTerm ? `Filtering "${nationalitySearchTerm}"...` : 'Filter available nationalities'}
                                                                        </p>
                                                                    </div>
                                                                    {nationalitySearchTerm && (
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                                {filteredCountries.length} found
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CommandList className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                                        <CommandEmpty>
                                                            <div className="text-center py-8">
                                                                <div className="p-3 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 mb-3 mx-auto w-fit">
                                                                    <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No nationality found</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {nationalitySearchTerm ? `No matches for "${nationalitySearchTerm}"` : 'Start typing to search nationalities'}
                                                                </p>
                                                            </div>
                                                        </CommandEmpty>
                                                        <CommandGroup className="p-3">
                                                            {/* Clear Selection Option */}
                                                            <CommandItem
                                                                value="clear-nationality"
                                                                onSelect={() => {
                                                                    setNationalitySearchValue('');
                                                                    setEditableInfo({ ...editableInfo, patNationality: '' });
                                                                    setNationalitySearchOpen(false);
                                                                }}
                                                                className="relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 dark:hover:from-gray-800/20 dark:hover:to-slate-800/20"
                                                            >
                                                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800/30 dark:to-slate-800/30 group-hover:from-gray-200 group-hover:to-slate-200 dark:group-hover:from-gray-700/40 dark:group-hover:to-slate-700/40 transition-all duration-200">
                                                                    <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                                </div>
                                                                <div className="flex flex-col flex-1 min-w-0">
                                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-200">
                                                                        Clear Selection
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        Remove nationality selection
                                                                    </span>
                                                                </div>
                                                                <div className="flex-shrink-0">
                                                                    {!nationalitySearchValue && (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                                                            <Check className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </CommandItem>

                                                            {/* Individual Countries */}
                                                            {filteredCountries.length > 0 && (
                                                                <div className="px-3 py-3 mb-3 bg-gradient-to-r from-gray-50 via-blue-50/50 to-cyan-50/50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-700 rounded-lg border border-gray-100 dark:border-gray-700">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                                                                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                                                                            {filteredCountries.length} Nationalit{filteredCountries.length !== 1 ? 'ies' : 'y'} {nationalitySearchTerm ? 'Found' : 'Available'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {filteredCountries.map((country, index) => (
                                                                <CommandItem
                                                                    key={country.value}
                                                                    value={`nationality-${country.value}`}
                                                                    onSelect={() => {
                                                                        setNationalitySearchValue(country.value);
                                                                        setEditableInfo({ ...editableInfo, patNationality: country.label });
                                                                        setNationalitySearchOpen(false);
                                                                    }}
                                                                    className="relative flex items-center gap-4 p-4 mb-2 last:mb-0 rounded-xl cursor-pointer transition-all duration-200 border border-transparent hover:shadow-sm group hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 focus:bg-gradient-to-r focus:from-blue-50 focus:to-cyan-50 dark:focus:from-blue-900/20 dark:focus:to-cyan-900/20 hover:border-blue-200/50 dark:hover:border-blue-700/30"
                                                                    style={{
                                                                        animationDelay: `${index * 50}ms`,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 group-hover:from-blue-200 group-hover:to-cyan-200 dark:group-hover:from-blue-800/40 dark:group-hover:to-cyan-800/40 transition-all duration-200">
                                                                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div className="flex flex-col flex-1 min-w-0">
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                                                            {country.label}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            Country code: {country.value}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex-shrink-0">
                                                                        {nationalitySearchValue === country.value && (
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                                                <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 scale-110" />
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
                                </div>
                            </div>                            {/* Identification Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 shadow-md">
                                        <CreditCard className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Identification</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Identification Type</Label>
                                        {editableInfo.patNationality?.toLowerCase() === 'jordan' ? (
                                            <select
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200"
                                                value={editableInfo.idType}
                                                onChange={(e) =>
                                                    setEditableInfo({ ...editableInfo, idType: e.target.value })
                                                }
                                            >
                                                <option value="National ID">National ID</option>
                                                <option value="Passport">Passport</option>
                                            </select>
                                        ) : (
                                            <Input 
                                                value="Passport" 
                                                readOnly 
                                                className="w-full max-w-xs backdrop-blur-sm bg-gray-100/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-600 dark:text-gray-400"
                                            />
                                        )}
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">ID Number</Label>
                                        <Input
                                            value={
                                                editableInfo.idType === 'National ID'
                                                    ? editableInfo.patnano ?? ''
                                                    : editableInfo.documentID ?? ''
                                            }
                                            onChange={(e) => {
                                                if (editableInfo.idType === 'National ID') {
                                                    setEditableInfo({ ...editableInfo, patnano: e.target.value });
                                                } else {
                                                    setEditableInfo({ ...editableInfo, documentID: e.target.value });
                                                }
                                            }}
                                            className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl  transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>                            {/* Contact Information Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md">
                                        <Phone className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Contact Information</h2>
                                </div>                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                                    <div className="lg:col-span-1">
                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Mobile Numbers</Label>
                                        <div className="flex flex-wrap items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-400/70 transition-all duration-300 px-3 py-2 min-h-[48px] max-w-sm">
                                            {editableMobiles.map((val, idx) => (
                                                <span key={idx} className="flex items-center bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm">
                                                    {val}
                                                    {editableMobiles.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditableMobiles(editableMobiles.filter((_, i) => i !== idx))}
                                                            className="ml-2 text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none transition-colors duration-200"
                                                            aria-label={`Remove Mobile Number ${val}`}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </span>
                                            ))}
                                            <div className="phone-input-container flex-1 min-w-[120px]">
                                                <PhoneInput
                                                    country={'jo'}
                                                    value={phoneCountryCode + phoneInput}
                                                    onChange={(val, data: CountryData) => {
                                                        if (data && 'dialCode' in data && data.dialCode) {
                                                            setPhoneCountryCode(data.dialCode);
                                                            const codeStr = data.dialCode;
                                                            let number = val.startsWith(codeStr)
                                                                ? val.slice(codeStr.length).replace(/^0+/, '')
                                                                : val.replace(/^0+/, '');
                                                            setPhoneInput(number);
                                                        } else {
                                                            setPhoneCountryCode('');
                                                            setPhoneInput(val);
                                                        }
                                                    }}
                                                    inputProps={{
                                                        placeholder: 'Enter mobile number',
                                                        className: 'flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm py-2 px-2 rounded-lg placeholder-gray-400 dark:placeholder-gray-500',
                                                        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
                                                            if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                                                                e.preventDefault();
                                                                addMobile();
                                                            }
                                                        },
                                                        onBlur: addMobile,
                                                    }}
                                                    inputStyle={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        fontSize: '0.875rem',
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        marginBottom: '2px',                                                           
                                                        minWidth: 120,
                                                        paddingLeft: 48,
                                                        outline: 'none',
                                                    }}
                                                    buttonStyle={{ 
                                                        border: 'none', 
                                                        background: 'transparent', 
                                                        marginRight: 8,
                                                        borderRadius: '0.5rem',
                                                    }}
                                                    dropdownStyle={{
                                                        position: 'absolute',
                                                        top: 'auto',
                                                        bottom: '100%',
                                                        marginBottom: '8px',
                                                        maxHeight: '200px',
                                                        width: '300px',
                                                        zIndex: 99999,
                                                        background: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(12px)',
                                                        border: '1px solid rgba(229, 231, 235, 0.6)',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                                        overflow: 'hidden',
                                                    }}
                                                    searchStyle={{
                                                        padding: '8px 12px',
                                                        margin: '8px',
                                                        borderRadius: '8px',
                                                        fontSize: '14px',
                                                        border: '1px solid rgba(209, 213, 219, 0.5)',
                                                        background: 'rgba(249, 250, 251, 0.8)',
                                                        backdropFilter: 'blur(4px)',
                                                    }}
                                                    containerClass="w-full react-tel-input"
                                                    containerStyle={{ flex: 1, minWidth: 180 }}
                                                    enableSearch
                                                    disableDropdown={false}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addMobile}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 transition-all duration-200 shadow-sm"
                                                tabIndex={-1}
                                                aria-label="Add Mobile Number"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-1 max-w-sm">
                                        <ChipInput
                                            label="Emails"
                                            values={editableEmails}
                                            setValues={setEditableEmails}
                                            placeholder="Type and press Enter to add"
                                            type="email"
                                            inputMode="email"
                                        />
                                    </div>
                                    <div className="lg:col-span-1 max-w-sm">
                                        <ChipInput
                                            label="Insurance Card Numbers"
                                            values={editableInsuranceCards}
                                            setValues={setEditableInsuranceCards}
                                            placeholder="Type and press Enter to add"
                                            type="text"
                                            inputMode="text"                                        />
                                    </div>
                                </div>
                            </div>                            {/* Biometric Information Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 shadow-md">
                                        <Fingerprint className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Biometric & Document Information</h2>
                                </div>                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <div>
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Fingerprint</Label>
                                        {media.patientFingerprint ? (
                                            <Button
                                                className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-default"
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                <svg className="h-4 w-4 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                Fingerprint collected
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/70 dark:to-slate-800/70 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 cursor-default"
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                <svg className="h-4 w-4 text-gray-400 mr-2" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="10" cy="10" r="8" stroke="currentColor" fill="none" />
                                                    <line x1="7" y1="7" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    <line x1="13" y1="7" x2="7" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                No fingerprint scanned
                                            </Button>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Scanned Document</Label>                                        {patient && (patient.patNumber || patient.patientID) ? (
                                            <div>
                                                <div className="flex flex-col gap-2">
                                                    <Button
                                                        type="button"
                                                        className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40"
                                                        onClick={async () => {
                                                            if (!showScannedDoc) {
                                                                setScannedDocLoading(true);
                                                                setScannedDocError('');
                                                                try {
                                                                    const id = patient.patientID || patient.patNumber;
                                                                    const res = await fetch(`/api/patients/GetPatientDocument?id=${id}`);
                                                                    if (!res.ok) throw new Error('Failed to fetch scanned document');
                                                                    const dataUrl = await res.text();
                                                                    setScannedDocUrl(dataUrl);
                                                                } catch (err: any) {
                                                                    setScannedDocError(err.message || 'Failed to fetch scanned document');
                                                                } finally {
                                                                    setScannedDocLoading(false);
                                                                }
                                                            }
                                                            setShowScannedDoc((prev: boolean) => !prev);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        {showScannedDoc ? 'Hide' : 'View'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 transition-all duration-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40"
                                                        onClick={handleScanDocument}
                                                        disabled={scanningDoc || updateDocLoading}
                                                    >
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        {scanningDoc ? 'Scanning...' : 'Scan New Document'}
                                                    </Button>
                                                </div>

                                                {scannedDocBase64 && (
                                                    <div className="mt-2">
                                                        <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                            <img
                                                                src={`data:image/png;base64,${scannedDocBase64}`}
                                                                alt="Scanned Document Preview"
                                                                className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                                                            />
                                                            <div className="flex gap-2 mt-2">
                                                                <Button
                                                                    type="button"
                                                                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    onClick={handleUpdateScannedDocument}
                                                                    disabled={updateDocLoading}
                                                                >
                                                                    <Save className="h-4 w-4 mr-2" />
                                                                    {updateDocLoading ? 'Updating...' : 'Update Document'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 font-medium hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-600 dark:hover:to-slate-600"
                                                                    onClick={() => {
                                                                        setScannedDocBase64(null);
                                                                        setUpdateDocError('');
                                                                        setUpdateDocSuccess(false);
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4 mr-2" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {updateDocSuccess && (
                                                    <div className="flex items-center mt-2 px-3 py-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-700/50 text-green-700 dark:text-green-300 shadow-lg">
                                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        <span className="font-medium">Scanned document updated successfully!</span>
                                                    </div>
                                                )}
                                                {updateDocError && <div className="mt-2 text-red-500 text-sm font-medium">{updateDocError}</div>}
                                                {scannedDocLoading && <div className="mt-2 text-gray-500 text-sm">Loading scanned document...</div>}
                                                {scannedDocError && <div className="mt-2 text-red-500 text-sm font-medium">{scannedDocError}</div>}
                                                {showScannedDoc && scannedDocUrl && (
                                                    <div className="mt-2">
                                                        <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                            <img
                                                                src={scannedDocUrl}
                                                                alt="Patient Scanned Document"
                                                                className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                                                            />                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 text-sm mt-2">No document scanned</div>
                                        )}
                                    </div>
                                </div>
                            </div>                            {/* Photo Management Section */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md">
                                        <Camera className="h-3 w-3 text-white" />
                                    </div>
                                    <h2 className="font-semibold text-gray-800 dark:text-gray-200">Patient Photo</h2>
                                </div>
                                
                                {/* View Photo Section */}
                                <div className="mb-3">
                                    <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Current Photo</Label>
                                    {patient && (patient.patNumber || patient.patientID) ? (
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                type="button"
                                                className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40"
                                                onClick={async () => {
                                                    if (!showPhoto) {
                                                        setPhotoLoading(true);
                                                        setPhotoError('');
                                                        try {
                                                            const id = patient.patientID || patient.patNumber;
                                                            const res = await fetch(`/api/patients/GetPatientImage?id=${id}`);
                                                            if (!res.ok) throw new Error('Failed to fetch photo');
                                                            const dataUrl = await res.text();
                                                            setPhotoUrl(dataUrl);
                                                        } catch (err: any) {
                                                            setPhotoError(err.message || 'Failed to fetch photo');
                                                        } finally {
                                                            setPhotoLoading(false);
                                                        }
                                                    }
                                                    setShowPhoto((prev: boolean) => !prev);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                {showPhoto ? 'Hide' : 'View'}
                                            </Button>
                                            {photoLoading && <div className="text-gray-500 text-sm">Loading photo...</div>}
                                            {photoError && <div className="text-red-500 text-sm font-medium">{photoError}</div>}
                                            {showPhoto && photoUrl && (
                                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                    <img
                                                        src={photoUrl}
                                                        alt="Patient Photo"
                                                        className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-gray-400 text-sm">No photo available</div>
                                    )}
                                </div>

                                {/* Capture New Photo Section */}
                                <div>
                                    <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Update Photo</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            className={`w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 ${photoInputMode === 'camera' ? 'ring-2 ring-blue-500/50' : ''}`}
                                            onClick={handleOpenCamera}
                                            disabled={photoInputMode === 'file'}
                                        >
                                            <Camera className="h-4 w-4 mr-2" />
                                            Capture New Photo
                                        </Button>

                                        <input
                                            type="file"
                                            id="photo"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            disabled={photoInputMode === 'camera'}
                                        />
                                        <label
                                            htmlFor="photo"
                                            className={`w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 transition-all duration-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 text-center cursor-pointer flex items-center justify-center text-sm ${photoInputMode === 'file' ? 'ring-2 ring-purple-500/50' : ''} ${photoInputMode === 'camera' ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Choose From Files
                                        </label>
                                    </div>

                                    {showCamera && (
                                        <div className="mt-3">
                                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                <video ref={videoRef} style={{ width: previewWidth, height: previewHeight }} className="rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg mx-auto" />
                                                <div className="flex gap-2 mt-2">
                                                    <Button 
                                                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                                        onClick={handleCapturePhoto}
                                                    >
                                                        <Camera className="h-4 w-4 mr-2" />
                                                        Capture
                                                    </Button>
                                                    <Button 
                                                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 font-medium hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-600 dark:hover:to-slate-600"
                                                        onClick={handleCancelCamera}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {capturedPhoto && (
                                        <div className="mt-3">
                                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                <img src={capturedPhoto} alt="Captured" style={{ width: previewWidth, height: previewHeight }} className="rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg mx-auto" />
                                                <div className="flex gap-2 mt-2">
                                                    <Button 
                                                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                                        onClick={handleOpenCamera}
                                                    >
                                                        <Camera className="h-4 w-4 mr-2" />
                                                        Retake
                                                    </Button>
                                                    <Button 
                                                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 font-medium hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-600 dark:hover:to-slate-600"
                                                        onClick={handleCancelCamera}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Cancel
                                                    </Button>
                                                    <Button 
                                                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                                                        onClick={handleUpdateImage}
                                                    >
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Update Image
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {photoUpdateMessage && (
                                        <div className={`flex items-center mt-2 px-3 py-2 rounded-xl shadow-lg ${photoUpdateSuccess ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-700/50 text-green-700 dark:text-green-300' : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200/50 dark:border-red-700/50 text-red-700 dark:text-red-300'}`}>
                                            <svg className={`w-5 h-5 mr-2 ${photoUpdateSuccess ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="font-medium">{photoUpdateMessage}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>                        {/* Action Buttons */}
                        <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                
                                <Button
                                    type="button"
                                    className="w-auto min-w-[250px] max-w-[400px] py-2 px-6 text-white rounded-xl bg-[#008ea9] hover:bg-[#007292] shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium focus:ring-2 focus:ring-[#008ea9]/50 focus:ring-offset-1 flex items-center justify-center gap-2"
                                onClick={async () => {
                                    setLoading(true);
                                    setError('');
                                    const now = new Date().toISOString();
                                    try {
                                        // Build payload to exactly match the API contract
                                        const payload: any = {
                                            patNumber: patient.patNumber || 0,
                                            patNumberEnc: patient.patNumberEnc || '',
                                            lastVisit: patient.lastVisit || '',
                                            gate: patient.gate || 0,
                                            have: patient.have || '',
                                            _Patient_Media: {
                                                id: (patient._Patient_Media && patient._Patient_Media.id) || '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                                patientID: (patient._Patient_Media && patient._Patient_Media.patientID) || patient.patNumber || 0,
                                                patientPhoto: (patient._Patient_Media && patient._Patient_Media.patientPhoto) || 'string',
                                                patientFingerprint: (patient._Patient_Media && patient._Patient_Media.patientFingerprint) || 'string',
                                                patientScannedDoc: (patient._Patient_Media && patient._Patient_Media.patientScannedDoc) || 'string'
                                            },
                                            patient_identity: {
                                                gate: editableIdentity.gate || 0,
                                                id: editableIdentity.id || 0,
                                                patNumber: patient.patNumber || 0,
                                                fK_PatNumberEnc: patient.patNumberEnc || '',
                                                img: editableIdentity.img || 'string',
                                                firstEnName: editableIdentity.firstEnName || 'string',
                                                fatherEnName: editableIdentity.fatherEnName || 'string',
                                                finalEnName: editableIdentity.finalEnName || 'string',
                                                familyEnName: editableIdentity.familyEnName || 'string',
                                                firstArName: editableIdentity.firstArName || 'string',
                                                fatherArName: editableIdentity.fatherArName || 'string',
                                                finalArName: editableIdentity.finalArName || 'string',
                                                familyArName: editableIdentity.familyArName || 'string',
                                                patName: editableIdentity.patName || 'string',
                                                countryId: editableIdentity.countryId || 0,
                                                patarName: editableIdentity.patarName || 'string',
                                                lastVisit: editableIdentity.lastVisit || 'string'
                                            },
                                            _Patient_Info: {
                                                id: editableInfo.id || 0,
                                                gate: editableInfo.gate || 0,
                                                patNumber: patient.patNumber || 0,
                                                fK_PatNumberEnc: patient.patNumberEnc || '',
                                                patDateOfBirth: editableInfo.patDateOfBirth || new Date().toISOString(),
                                                patDateOfBirthStr: editableInfo.patDateOfBirthStr || 'string',
                                                dateNotCorrect: editableInfo.dateNotCorrect || 0,
                                                bodValue: editableInfo.bodValue || 'string',
                                                patAge: editableInfo.patAge || 'string',
                                                patSex: editableInfo.patSex || 'string',
                                                patday: editableInfo.patday || 'string',
                                                communicationLanguage: editableInfo.communicationLanguage || 'string',
                                                patNationality: editableInfo.patNationality || 'string',
                                                fk_NationalityID: editableInfo.fk_NationalityID || 0,
                                                patnano: editableInfo.patnano || 'string',
                                                documentID: editableInfo.documentID || 'string',
                                                patientType: editableInfo.patientType || 0,
                                                deleted: typeof editableInfo.deleted === 'boolean' ? editableInfo.deleted : true,
                                                ocr: editableInfo.ocr || 'string',
                                                residency: editableInfo.residency || 'string',
                                                nationalityIdOrgen: editableInfo.nationalityIdOrgen || 'string',
                                                _Patient_Nationality: Array.isArray(editableInfo._Patient_Nationality) ? editableInfo._Patient_Nationality.map((n: any) => ({
                                                    id: n.id || 0,
                                                    fK_PatNumber: n.fK_PatNumber || 0,
                                                    fk_NationalityID: n.fk_NationalityID || 0,
                                                    nationality: n.nationality || 'string',
                                                    patNationalityNo: n.patNationalityNo || 0,
                                                    passportID: n.passportID || 'string',
                                                    nationalityType: n.nationalityType || 0,
                                                    nationalityTypeName: n.nationalityTypeName || 'string',
                                                    verifyBy: n.verifyBy || 0,
                                                    verifyByUserName: n.verifyByUserName || 'string',
                                                    verifyAt: n.verifyAt || new Date().toISOString(),
                                                    useByDefault: typeof n.useByDefault === 'boolean' ? n.useByDefault : true,
                                                    deleted: typeof n.deleted === 'boolean' ? n.deleted : true,
                                                    createdBy: n.createdBy || 0,
                                                    createdAt: n.createdAt || new Date().toISOString(),
                                                    modifiedBy: n.modifiedBy || 0,
                                                    modifiedAt: n.modifiedAt || new Date().toISOString(),
                                                    opr: n.opr || 'string'
                                                })) : [],
                                            },
                                            _Patient_ContactInfo: {
                                                id: editableContact.id || 0,
                                                gate: editableContact.gate || 0,
                                                patNumber: patient.patNumber || 0,
                                                fK_PatNumberEnc: patient.patNumberEnc || '',
                                                _Patient_Mobile: editableMobiles.map((m, idx) => {
                                                    const match = m.match(/^\+?(\d{1,3})\s?(\d+)$/); // handles "+962 79..." and "96279..."
                                                    const countryCode = match ? parseInt(match[1]) : 962;
                                                    const localNumberStr = match ? match[2] : '';
                                                    const patMobile = localNumberStr ? parseInt(localNumberStr) : 0;

                                                    const existing = editableContact._Patient_Mobile?.find((orig: any) =>
                                                        `${orig.mobileCountryCode}${orig.patMobile}` === `${countryCode}${patMobile}`
                                                    );

                                                    return {
                                                        id: existing?.id || 0,
                                                        fK_PatNumber: patient.patNumber || 0,
                                                        fK_PatNumberEnc: patient.patNumberEnc || '',
                                                        mobileCountryCode: countryCode,
                                                        patMobile: patMobile,
                                                        jorMobile: existing?.jorMobile || 0,
                                                        activemobile: existing?.activemobile || 0,
                                                        activemobileDate: now,
                                                        stopmobile: existing?.stopmobile || 0,
                                                        stopmobileDate: now,
                                                        useByDefault: idx === 0,
                                                        deleted: false, // mark as active
                                                        createdby: existing?.createdby || 0,
                                                        createdAt: existing?.createdAt || now,
                                                        modifiedBy: 0,
                                                        modifiedAt: now,
                                                        opr: 'string',
                                                    };
                                                }),




                                                _Patient_Email: editableEmails.map((email, idx) => ({
                                                    id: (editableContact._Patient_Email && editableContact._Patient_Email[idx] && editableContact._Patient_Email[idx].id) || 0,
                                                    fK_PatNumber: patient.patNumber || 0,
                                                    fK_PatNumberEnc: patient.patNumberEnc || '',
                                                    patEmail: email || 'string',
                                                    patpassword: 'string',
                                                    stopEmail: 0,
                                                    stopEmailDate: now,
                                                    activeEmail: 0,
                                                    activeEmailDate: now,
                                                    useByDefault: idx === 0,
                                                    deleted: true,
                                                    createdby: 0,
                                                    createdAt: now,
                                                    modifiedBy: 0,
                                                    modifiedAt: now,
                                                    opr: 'string'
                                                }))
                                            },
                                            _Patient_Notes: Array.isArray(patient._Patient_Notes) ? patient._Patient_Notes.map((n: any) => ({
                                                id: n.id || 0,
                                                gate: n.gate || 0,
                                                fK_PatNumber: n.fK_PatNumber || 0,
                                                fK_PatNumberEnc: n.fK_PatNumberEnc || '',
                                                viewNote: typeof n.viewNote === 'boolean' ? n.viewNote : true,
                                                note: n.note || 'string',
                                                useByDefault: typeof n.useByDefault === 'boolean' ? n.useByDefault : true,
                                                deleted: typeof n.deleted === 'boolean' ? n.deleted : true,
                                                createdby: n.createdby || 0,
                                                createdby_Name: n.createdby_Name || 'string',
                                                createdAt: n.createdAt || new Date().toISOString(),
                                                modifiedBy: n.modifiedBy || 0,
                                                modifiedBy_Name: n.modifiedBy_Name || 'string',
                                                modifiedAt: n.modifiedAt || new Date().toISOString(),
                                                opr: n.opr || 'string'
                                            })) : [],
                                            _Patient_Locations: patient._Patient_Locations ? {
                                                patNumber: patient._Patient_Locations.patNumber || patient.patNumber || 0,
                                                gate: patient._Patient_Locations.gate || 0,
                                                p_Locations: Array.isArray(patient._Patient_Locations.p_Locations) ? patient._Patient_Locations.p_Locations.map((l: any) => ({
                                                    id: l.id || 0,
                                                    gate: l.gate || 0,
                                                    fK_PatNumber: l.fK_PatNumber || 0,
                                                    fK_PatNumberEnc: l.fK_PatNumberEnc || '',
                                                    fK_Subject: l.fK_Subject || 'string',
                                                    fK_AreaId: l.fK_AreaId || 0,
                                                    fK_SubareaId: l.fK_SubareaId || 0,
                                                    street: l.street || 'string',
                                                    buildingNo: l.buildingNo || 'string',
                                                    aportmentNo: l.aportmentNo || 'string',
                                                    location: l.location || 'string',
                                                    latitude: l.latitude || 0,
                                                    longitude: l.longitude || 0,
                                                    useByDefault: typeof l.useByDefault === 'boolean' ? l.useByDefault : true,
                                                    deleted: typeof l.deleted === 'boolean' ? l.deleted : true,
                                                    createdby: l.createdby || 0,
                                                    createdAt: l.createdAt || 'string',
                                                    modifiedBy: l.modifiedBy || 0,
                                                    modifiedAt: l.modifiedAt || 'string',
                                                    opr: l.opr || 'string'
                                                })) : []
                                            } : { patNumber: patient.patNumber || 0, gate: 0, p_Locations: [] },
                                            _Patient_Options: patient._Patient_Options ? {
                                                id: patient._Patient_Options.id || 0,
                                                gate: patient._Patient_Options.gate || 0,
                                                fK_PatNumber: patient._Patient_Options.fK_PatNumber || 0,
                                                fK_PatNumberEnc: patient._Patient_Options.fK_PatNumberEnc || '',
                                                dontReprint: typeof patient._Patient_Options.dontReprint === 'boolean' ? patient._Patient_Options.dontReprint : true,
                                                dontPrint: typeof patient._Patient_Options.dontPrint === 'boolean' ? patient._Patient_Options.dontPrint : true,
                                                blockdata: typeof patient._Patient_Options.blockdata === 'boolean' ? patient._Patient_Options.blockdata : true,
                                                useByDefault: typeof patient._Patient_Options.useByDefault === 'boolean' ? patient._Patient_Options.useByDefault : true,
                                                deleted: typeof patient._Patient_Options.deleted === 'boolean' ? patient._Patient_Options.deleted : true,
                                                createdby: patient._Patient_Options.createdby || 0,
                                                createdAt: patient._Patient_Options.createdAt || 'string',
                                                modifiedBy: patient._Patient_Options.modifiedBy || 0,
                                                modifiedAt: patient._Patient_Options.modifiedAt || 'string',
                                                isActiveConditions: typeof patient._Patient_Options.isActiveConditions === 'boolean' ? patient._Patient_Options.isActiveConditions : true,
                                                requestUpdateData: typeof patient._Patient_Options.requestUpdateData === 'boolean' ? patient._Patient_Options.requestUpdateData : true
                                            } : {
                                                id: 0, gate: 0, fK_PatNumber: 0, fK_PatNumberEnc: '', dontReprint: true, dontPrint: true, blockdata: true, useByDefault: true, deleted: true, createdby: 0, createdAt: 'string', modifiedBy: 0, modifiedAt: 'string', isActiveConditions: true, requestUpdateData: true
                                            },
                                            _Patient_SendOptions: patient._Patient_SendOptions ? {
                                                ...patient._Patient_SendOptions,
                                                prints: typeof patient._Patient_SendOptions.prints === 'boolean' ? patient._Patient_SendOptions.prints : true,
                                                emailPatient: typeof patient._Patient_SendOptions.emailPatient === 'boolean' ? patient._Patient_SendOptions.emailPatient : true,
                                                anothercopytopatient: typeof patient._Patient_SendOptions.anothercopytopatient === 'boolean' ? patient._Patient_SendOptions.anothercopytopatient : true,
                                                whatsAppPatient: typeof patient._Patient_SendOptions.whatsAppPatient === 'boolean' ? patient._Patient_SendOptions.whatsAppPatient : true,
                                                whatsappStopInvoicePatient: typeof patient._Patient_SendOptions.whatsappStopInvoicePatient === 'boolean' ? patient._Patient_SendOptions.whatsappStopInvoicePatient : true,
                                                hasDoctor: typeof patient._Patient_SendOptions.hasDoctor === 'boolean' ? patient._Patient_SendOptions.hasDoctor : true,
                                                emailConsultant: typeof patient._Patient_SendOptions.emailConsultant === 'boolean' ? patient._Patient_SendOptions.emailConsultant : true,
                                                whatsAppConsultant: typeof patient._Patient_SendOptions.whatsAppConsultant === 'boolean' ? patient._Patient_SendOptions.whatsAppConsultant : true,
                                                copytodoctor: typeof patient._Patient_SendOptions.copytodoctor === 'boolean' ? patient._Patient_SendOptions.copytodoctor : true,
                                                hasInsurance: typeof patient._Patient_SendOptions.hasInsurance === 'boolean' ? patient._Patient_SendOptions.hasInsurance : true,
                                                emailInsurance: typeof patient._Patient_SendOptions.emailInsurance === 'boolean' ? patient._Patient_SendOptions.emailInsurance : true,
                                                whatsAppInsurance: typeof patient._Patient_SendOptions.whatsAppInsurance === 'boolean' ? patient._Patient_SendOptions.whatsAppInsurance : true,
                                                hasCorporate: typeof patient._Patient_SendOptions.hasCorporate === 'boolean' ? patient._Patient_SendOptions.hasCorporate : true,
                                                emailCorporate: typeof patient._Patient_SendOptions.emailCorporate === 'boolean' ? patient._Patient_SendOptions.emailCorporate : true,
                                                whatsAppCorporate: typeof patient._Patient_SendOptions.whatsAppCorporate === 'boolean' ? patient._Patient_SendOptions.whatsAppCorporate : true,
                                                hasReferral: typeof patient._Patient_SendOptions.hasReferral === 'boolean' ? patient._Patient_SendOptions.hasReferral : true,
                                                emailReferral: typeof patient._Patient_SendOptions.emailReferral === 'boolean' ? patient._Patient_SendOptions.emailReferral : true,
                                                useremailedReferral: typeof patient._Patient_SendOptions.useremailedReferral === 'boolean' ? patient._Patient_SendOptions.useremailedReferral : true,
                                                whatsAppReferral: typeof patient._Patient_SendOptions.whatsAppReferral === 'boolean' ? patient._Patient_SendOptions.whatsAppReferral : true,
                                                stopSendInvoiceToReferral: typeof patient._Patient_SendOptions.stopSendInvoiceToReferral === 'boolean' ? patient._Patient_SendOptions.stopSendInvoiceToReferral : true,
                                               
                                                dontPrintTransaction: typeof patient._Patient_SendOptions.dontPrintTransaction === 'boolean' ? patient._Patient_SendOptions.dontPrintTransaction : true,
                                                hideResults: typeof patient._Patient_SendOptions.hideResults === 'boolean' ? patient._Patient_SendOptions.hideResults : true,
                                                dontPrintPatient: typeof patient._Patient_SendOptions.dontPrintPatient === 'boolean' ? patient._Patient_SendOptions.dontPrintPatient : true,
                                                dontReprintPatient: typeof patient._Patient_SendOptions.dontReprintPatient === 'boolean' ? patient._Patient_SendOptions.dontReprintPatient : true,
                                                inpatient: typeof patient._Patient_SendOptions.inpatient === 'boolean' ? patient._Patient_SendOptions.inpatient : true,
                                                balance: patient._Patient_SendOptions.balance || 0,
                                                sendWhatsAppLog: Array.isArray(patient._Patient_SendOptions.sendWhatsAppLog) ? patient._Patient_SendOptions.sendWhatsAppLog.map((w: any) => ({
                                                    toAdress: w.toAdress || 'string',
                                                    messageBody: w.messageBody || 'string',
                                                    status: w.status || 'string',
                                                    requestedAt: w.requestedAt || 'string',
                                                    requestedBy: w.requestedBy || 'string',
                                                    branchcode: w.branchcode || 'string'
                                                })) : [],
                                                sendEmailsLog: Array.isArray(patient._Patient_SendOptions.sendEmailsLog) ? patient._Patient_SendOptions.sendEmailsLog.map((e: any) => ({
                                                    toAdress: e.toAdress || 'string',
                                                    messageBody: e.messageBody || 'string',
                                                    status: e.status || 'string',
                                                    requestedAt: e.requestedAt || 'string',
                                                    requestedBy: e.requestedBy || 'string',
                                                    branchcode: e.branchcode || 'string'
                                                })) : []
                                            } : {
                                                prints: true, printed: 'string', userPrinted: 'string', fK_PatNumber: 'string', fK_PatNumberEnc: 'string', patientName: 'string', emails: 'string', mobiles: 'string', emailPatient: true, emailedPatient: 'string', useremailedPatient: 'string', anothercopytopatient: true, anotheredcopytopatient: 'string', userAnotheredcopytopatient: 'string', whatsAppPatient: true, whatsAppedPatient: 'string', whatsappStopInvoicePatient: true, whatsappedStopInvoicePatient: 'string', hasDoctor: true, doctorOne: 'string', trarefnumber: 0, doctorTwo: 'string', trarefnumber2: 0, doctorOneEmail: 'string', doctorTwoEmail: 'string', emailConsultant: true, emailedConsultant: 'string', useremailedConsultant: 'string', doctorOneMobile: 'string', doctorTwoMobile: 'string', whatsAppConsultant: true, whatsAppedConsultant: 'string', copytodoctor: true, copyedtodoctor: 'string', userCopyedtodoctor: 'string', hasInsurance: true, insuranceName: 'string', insuranceEmail: 'string', emailInsurance: true, insuranceMobile: 'string', whatsAppInsurance: true, hasCorporate: true, corporateName: 'string', corporateEmail: 'string', emailCorporate: true, emailedCorporate: 'string', corporateMobile: 'string', whatsAppCorporate: true, whatsAppedCorporate: 'string', hasReferral: true, referralName: 'string', referralEmail: 'string', emailReferral: true, emailedReferral: 'string', useremailedReferral: true, referralMobile: 'string', whatsAppReferral: true, whatsAppedReferral: 'string', stopSendInvoiceToReferral: true, note: 'string', dontPrintTransaction: true, hideResults: true, dontPrintPatient: true, dontReprintPatient: true, inpatient: true, balance: 0, sendWhatsAppLog: [], sendEmailsLog: []
                                            },
                                            //insuranceCards
                                            _Patient_InsuranceCard: {
                                                ...(patient._Patient_InsuranceCard || {}),
                                                id: 0,
                                                gate: 0,
                                                patNumber: patient.patNumber || 0,
                                                _patient_Insurance: Array.isArray(editableInsuranceCards)
                                                    ? editableInsuranceCards.filter(Boolean).map((cardNo: string) => ({
                                                        id: 0,
                                                        fK_PatNumber: patient.patNumber || 0,
                                                        cardNo: cardNo,
                                                        fK_trarefnumber3: 0,
                                                        insuranceName: '',
                                                        useByDefault: true,
                                                        deleted: true,
                                                        createdby: 0,
                                                        createdAt: now,
                                                        modifiedBy: 0,
                                                        modifiedAt: now,
                                                        opr: '',
                                                    }))
                                                    : [],
                                            },
                                            _Patient_Cond: Array.isArray(patient._Patient_Cond) ? patient._Patient_Cond.map((c: any) => ({
                                                id: c.id || 0,
                                                condName: c.condName || 'string',
                                                condDescription: c.condDescription || 'string',
                                                condMessage: c.condMessage || 'string'
                                            })) : [],
                                            createdby: patient.createdby || 0,
                                            createdby_Name: patient.createdby_Name || 'string',
                                            createdAt: patient.createdAt || 'string',
                                            modifiedBy: patient.modifiedBy || 0,
                                            modifiedBy_Name: patient.modifiedBy_Name || 'string',
                                            modifiedAt: patient.modifiedAt || 'string',
                                            labTelephone: patient.labTelephone || 'string',
                                            labEmail: patient.labEmail || 'string',
                                            verifyAt: patient.verifyAt || 'string',
                                            lPat_Attachment: Array.isArray(patient.lPat_Attachment) ? patient.lPat_Attachment.map((a: any) => ({
                                                patNumber: a.patNumber || 0,
                                                fK_PatNumberEnc: a.fK_PatNumberEnc || 'string',
                                                path: a.path || 'string',
                                                name: a.name || 'string'
                                            })) : [],
                                            isNationalityInfoNotMatch: typeof patient.isNationalityInfoNotMatch === 'boolean' ? patient.isNationalityInfoNotMatch : true,
                                            _Search_PaitentProfile: patient._Search_PaitentProfile ? {
                                                gate: patient._Search_PaitentProfile.gate || 0,
                                                mobileCountryCode: patient._Search_PaitentProfile.mobileCountryCode || 0,
                                                ocrValue: patient._Search_PaitentProfile.ocrValue || 'string',
                                                ocrObj: patient._Search_PaitentProfile.ocrObj ? {
                                                    id: patient._Search_PaitentProfile.ocrObj.id || 'string',
                                                    idno: patient._Search_PaitentProfile.ocrObj.idno || 'string',
                                                    firstName: patient._Search_PaitentProfile.ocrObj.firstName || 'string',
                                                    secondName: patient._Search_PaitentProfile.ocrObj.secondName || 'string',
                                                    thirdName: patient._Search_PaitentProfile.ocrObj.thirdName || 'string',
                                                    fullName: patient._Search_PaitentProfile.ocrObj.fullName || 'string',
                                                    type: patient._Search_PaitentProfile.ocrObj.type || 'string',
                                                    name: patient._Search_PaitentProfile.ocrObj.name || 'string',
                                                    gender: patient._Search_PaitentProfile.ocrObj.gender || 'string',
                                                    natId: patient._Search_PaitentProfile.ocrObj.natId || 'string',
                                                    documentID: patient._Search_PaitentProfile.ocrObj.documentID || 'string',
                                                    date: patient._Search_PaitentProfile.ocrObj.date || 'string'
                                                } : {
                                                    id: 'string', idno: 'string', firstName: 'string', secondName: 'string', thirdName: 'string', fullName: 'string', type: 'string', name: 'string', gender: 'string', natId: 'string', documentID: 'string', date: 'string'
                                                },
                                                natID: patient._Search_PaitentProfile.natID || 'string',
                                                branch: patient._Search_PaitentProfile.branch || 'string',
                                                patNumber: patient._Search_PaitentProfile.patNumber || 0,
                                                patnano: patient._Search_PaitentProfile.patnano || 'string',
                                                trano: patient._Search_PaitentProfile.trano || 'string',
                                                documentID: patient._Search_PaitentProfile.documentID || 'string',
                                                patName: patient._Search_PaitentProfile.patName || 'string',
                                                patarName: patient._Search_PaitentProfile.patarName || 'string',
                                                mobile: patient._Search_PaitentProfile.mobile || 'string',
                                                email: patient._Search_PaitentProfile.email || 'string',
                                                patientType: patient._Search_PaitentProfile.patientType || 0,
                                                countryId: patient._Search_PaitentProfile.countryId || 0,
                                                isLinked: typeof patient._Search_PaitentProfile.isLinked === 'boolean' ? patient._Search_PaitentProfile.isLinked : true,
                                                flag: patient._Search_PaitentProfile.flag || 0,
                                                patientList: Array.isArray(patient._Search_PaitentProfile.patientList) ? patient._Search_PaitentProfile.patientList.map((p: any) => ({
                                                    patNumber: p.patNumber || 0,
                                                    patName: p.patName || 'string',
                                                    firstEnName: p.firstEnName || 'string',
                                                    fatherEnName: p.fatherEnName || 'string',
                                                    familyEnName: p.familyEnName || 'string',
                                                    finalEnName: p.finalEnName || 'string',
                                                    patarName: p.patarName || 'string',
                                                    firstArName: p.firstArName || 'string',
                                                    fatherArName: p.fatherArName || 'string',
                                                    finalArName: p.finalArName || 'string',
                                                    familyArName: p.familyArName || 'string',
                                                    patDateOfBirth: p.patDateOfBirth || 'string',
                                                    patAge: p.patAge || 'string',
                                                    patday: p.patday || 'string',
                                                    patSex: p.patSex || 'string',
                                                    patMobile: p.patMobile || 'string',
                                                    patEmail: p.patEmail || 'string',
                                                    isLinked: typeof p.isLinked === 'boolean' ? p.isLinked : true,
                                                    countryCode: p.countryCode || 'string'
                                                })) : []
                                            } : {
                                                gate: 0, mobileCountryCode: 0, ocrValue: 'string', ocrObj: { id: 'string', idno: 'string', firstName: 'string', secondName: 'string', thirdName: 'string', fullName: 'string', type: 'string', name: 'string', gender: 'string', natId: 'string', documentID: 'string', date: 'string' }, natID: 'string', branch: 'string', patNumber: 0, patnano: 'string', trano: 'string', documentID: 'string', patName: 'string', patarName: 'string', mobile: 'string', email: 'string', patientType: 0, countryId: 0, isLinked: true, flag: 0, patientList: []
                                            },
                                            transactionsCount: patient.transactionsCount || 0,
                                            _Patient_Nationality: Array.isArray(patient._Patient_Nationality) ? patient._Patient_Nationality.map((n: any) => ({
                                                id: n.id || 0,
                                                fK_PatNumber: n.fK_PatNumber || 0,
                                                fk_NationalityID: n.fk_NationalityID || 0,
                                                nationality: n.nationality || 'string',
                                                patNationalityNo: n.patNationalityNo || 0,
                                                passportID: n.passportID || 'string',
                                                nationalityType: n.nationalityType || 0,
                                                nationalityTypeName: n.nationalityTypeName || 'string',
                                                verifyBy: n.verifyBy || 0,
                                                verifyByUserName: n.verifyByUserName || 'string',
                                                verifyAt: n.verifyAt || new Date().toISOString(),
                                                useByDefault: typeof n.useByDefault === 'boolean' ? n.useByDefault : true,
                                                deleted: typeof n.deleted === 'boolean' ? n.deleted : true,
                                                createdBy: n.createdBy || 0,
                                                createdAt: n.createdAt || new Date().toISOString(),
                                                modifiedBy: n.modifiedBy || 0,
                                                modifiedAt: n.modifiedAt || new Date().toISOString(),
                                                opr: n.opr || 'string'
                                            })) : []
                                        };
                                        const res = await fetch('/api/patients/update', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(payload),
                                        });
                                        if (!res.ok) {
                                            const errData = await res.json();
                                            toast({
                                                title: 'Failure',
                                                description: 'Failed to update patient',
                                                variant: 'default',
                                            });
                                        } else {

                                            toast({
                                                title: 'Success',
                                                description: 'Patient updated successfully',
                                                variant: 'default',
                                            });
                                        }
                                    } catch (error: any) {
                                        toast({
                                            title: 'Failure',
                                            description: 'Failed to update patient',
                                            variant: 'default',
                                        });
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                >
                                    <Save className="h-4 w-4" />
                                    Update Patient Information
                                </Button>
                                <Button 
                                    onClick={handleCreateAppointment}
                                    className="w-auto min-w-[200px] max-w-[350px] py-2 px-6 text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium focus:ring-2 focus:ring-green-500/50 focus:ring-offset-1 flex items-center justify-center gap-2"
                                >
                                    <Calendar className="h-4 w-4" />
                                    New Appointment
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        </>
    );
}

// Add this utility function at the end of the file
const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

