"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2, UserPlus, Users, Camera, Fingerprint, FileText, Upload, User, Calendar, Mail, Phone, CreditCard, Globe, FileCheck, X, Plus, Search, ChevronsUpDown, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import PhoneInput, { CountryData } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Select from 'react-select';
import countryList from 'react-select-country-list';
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

interface MobileNumber {
    countryCode: number;
    number: string;
}

interface NewPatient {
    firstEnName: string;
    fatherEnName: string;
    finalEnName: string;
    familyEnName: string;
    firstArName: string;
    fatherArName: string;
    finalArName: string;
    familyArName: string;
    dateOfBirth: string;
    photo?: string;
    email: string[];
    mobileNo: MobileNumber[];
    gender: number;
    identificationType: 'passport' | 'id';
    identificationNumber: string;
    fingerprintCollected: boolean;
    insuranceCardNumber: string[];
    media: _Patient_Media;
    nationality: string;
    documentId: string;
    nationalId: string; 
}
interface _Patient_Media {
    PatientPhoto: string
    PatientScannedDoc: string
    PatientFingerprint: string
}
const initialNewPatient: NewPatient = {
    firstEnName: '',
    fatherEnName: '',
    finalEnName: '',
    familyEnName: '',
    firstArName: '',
    fatherArName: '',
    finalArName: '',
    familyArName: '',
    dateOfBirth: '',
    photo: '',
    email: [],
    mobileNo: [],
    gender: 1,
    identificationType: 'passport',
    identificationNumber: '',
    fingerprintCollected: false,
    insuranceCardNumber: [],
    media: {
        PatientPhoto: '',
        PatientScannedDoc: '',
        PatientFingerprint: '',
    },
    nationality: '',
    documentId: '',
    nationalId:'', 
}
const initialPatientMedia: _Patient_Media = {
    PatientPhoto: '',
    PatientScannedDoc: '',
    PatientFingerprint: '',
}
export default function AddPatientPage() {
    const [newPatient, setNewPatient] = useState<NewPatient>(initialNewPatient);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Camera UI state moved up to parent
    const [showCamera, setShowCamera] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isCaptured, setIsCaptured] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);

    // Fingerprint state moved up to parent
    const [fingerImage, setFingerImage] = useState<string>("");
    const [fingerMessage, setFingerMessage] = useState<{ text: string; type: MessageType }>({
        text: '',
        type: 'info',
    });
    const [imageSrc, setImageSrc] = useState<string>('');
    const socketRef = useRef<WebSocket | null>(null);
    const fingerSocketRef = useRef<WebSocket | null>(null);
    const documentSocketRef = useRef<WebSocket | null>(null);
    const messageTimer = useRef<NodeJS.Timeout | null>(null);

    const showMessage = (text: string, type: MessageType = 'info', delay: number = 0) => {
        if (messageTimer.current) clearTimeout(messageTimer.current);

        if (delay > 0) {
            messageTimer.current = setTimeout(() => {
                setFingerMessage({ text, type });
            }, delay);
        } else {
            setFingerMessage({ text, type });
        }
    };

    const initSocket = () => {
        showMessage('Initializing WebSocket connection...', 'info');
        socketRef.current = new WebSocket('ws://localhost:12345');

        socketRef.current.onopen = () => {
            showMessage('Scanner connected. Please start scanning...', 'primary');
            socketRef.current?.send('start-enroll');
        };

        socketRef.current.onmessage = (event: MessageEvent) => {
            const data = event.data;

            if (data.startsWith('ENROLL:')) {
                const msg = data.replace('ENROLL:', '').trim();
                showMessage(msg, 'primary');
            } else if (data.startsWith('IMG:')) {
                const base64Img = data.substring(4).trim();
                const fullImage = `data:image/png;base64,${base64Img}`;
                setImageSrc(fullImage);
            } else if (data.length > 1000) {
                setNewPatient(prev => ({ ...prev, media: { ...prev.media, PatientFingerprint: data } }));
            }
            else {
                showMessage(data, 'warning');
            }
        };

        socketRef.current.onerror = () => {
            showMessage('Cannot connect to fingerprint scanner. Please ensure the scanner app is running.', 'danger');
        };
    };

    const initFingerSocket = () => {
        setFingerMessage({ text: 'Connecting to fingerprint scanner...', type: 'info' });
        fingerSocketRef.current = new WebSocket('ws://localhost:12345');

        fingerSocketRef.current.onopen = () => {
            setFingerMessage({ text: 'Scanner connected. Please scan your finger...', type: 'primary' });
            fingerSocketRef.current?.send('start-enroll');
        };

        fingerSocketRef.current.onmessage = (event: MessageEvent) => {
            const data = event.data;

            if (data.startsWith('ENROLL:')) {
                const msg = data.replace('ENROLL:', '').trim();
                setFingerMessage({ text: msg, type: 'primary' });
            } else if (data.startsWith('IMG:')) {
                const base64Img = data.substring(4).trim().replace(/\r?\n|\r/g, '');
                const fullImage = `data:image/png;base64,${base64Img}`;
                setFingerImage(fullImage);
            } else if (data.length > 1000) {
                setNewPatient(prev => ({ ...prev, media: { ...prev.media, PatientFingerprint: data } }));
            } else {
                setFingerMessage({ text: data, type: 'warning' });
            }
        };

        fingerSocketRef.current.onerror = () => {
            setFingerMessage({ text: 'Error: Cannot connect to scanner. Please ensure it is running.', type: 'danger' });
        };
    };


    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };


    type CameraCaptureInputProps = {
        setNewPatient: React.Dispatch<React.SetStateAction<NewPatient>>;
        newPatient: NewPatient;
        showCamera: boolean;
        setShowCamera: React.Dispatch<React.SetStateAction<boolean>>;
        photo: string | null;
        setPhoto: React.Dispatch<React.SetStateAction<string | null>>;
        isCaptured: boolean;
        setIsCaptured: React.Dispatch<React.SetStateAction<boolean>>;
        isVideoReady: boolean;
        setIsVideoReady: React.Dispatch<React.SetStateAction<boolean>>;
    };

    function CameraCaptureInput({ newPatient, setNewPatient, showCamera, setShowCamera, photo, setPhoto, isCaptured, setIsCaptured, isVideoReady, setIsVideoReady }: CameraCaptureInputProps) {
        const videoRef = React.useRef<HTMLVideoElement | null>(null);
        const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
        const streamRef = React.useRef<MediaStream | null>(null);

        React.useEffect(() => {
            if (!showCamera) return;
            let active = true;
            const startCamera = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (!active) return;
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current?.play();
                            setIsVideoReady(true);
                        };
                    }
                } catch (err) { }
            };
            if (!isCaptured) {
                startCamera();
            }
            return () => {
                active = false;
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            };
        }, [isCaptured, showCamera, setIsVideoReady]);

        const captureImage = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (canvas && video && isVideoReady) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = canvas.toDataURL("image/png");
                    setPhoto(imageData);
                    setNewPatient({
                        ...newPatient,
                        photo: imageData,
                        media: { ...newPatient.media, PatientPhoto: imageData }
                    });
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach((track) => track.stop());
                        streamRef.current = null;
                    }
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                    }
                    setIsCaptured(true);
                }
            }
        };

        const retakePhoto = () => {
            setPhoto(null);
            setIsCaptured(false);
            setIsVideoReady(false);
            setNewPatient({ ...newPatient, photo: '' });
        };

        const closeCamera = () => {
            setShowCamera(false);
            setPhoto(null);
            setIsCaptured(false);
            setIsVideoReady(false);
        };

        if (!showCamera) {
            return (
                <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={photo !== null} // Disable the button when a photo is already selected
                    className="text-left cursor-pointer block rounded border px-3 py-1 text-sm font-normal bg-white dark:bg-gray-950 border-input shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
                >
                    Open camera to take picture
                </button>
            );
        }

        const aspectRatio = 4 / 3;
        const previewWidth = 320;
        const previewHeight = Math.round(previewWidth / aspectRatio);

        return (
            <div className="flex flex-col items-start justify-start w-full">
                <div className="w-fit bg-white dark:bg-gray-950 rounded-lg shadow-md border p-4 flex flex-col items-center">
                    {!isCaptured ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                width={previewWidth}
                                height={previewHeight}
                                className="rounded border max-h-48 object-cover mb-4"
                                style={{ width: previewWidth, height: previewHeight, objectFit: 'cover' }}
                            />
                            <canvas
                                ref={canvasRef}
                                width={previewWidth}
                                height={previewHeight}
                                style={{ display: "none" }}
                            />                            <div className="flex flex-row gap-3 w-full mt-4">
                                <button
                                    type="button"
                                    onClick={captureImage}
                                    disabled={!isVideoReady}
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border border-emerald-600 px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
                                >
                                    {isVideoReady ? (
                                        <>
                                            <Camera className="mr-2 h-4 w-4" />
                                            Capture Photo
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Loading Camera...
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCamera}
                                    className="px-4 py-3 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {photo && (
                                <img
                                    src={photo}
                                    alt="Captured"
                                    width={previewWidth}
                                    height={previewHeight}
                                    className="rounded border max-h-48 object-cover mb-4"
                                    style={{ width: previewWidth, height: previewHeight, objectFit: 'cover' }}
                                />                            )}
                            <div className="flex flex-row gap-3 w-full mt-4">
                                <button
                                    type="button"
                                    onClick={retakePhoto}
                                    className="flex-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center transition-all duration-300"
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCamera}
                                    className="px-4 py-3 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };



    type MessageType = 'info' | 'primary' | 'success' | 'danger' | 'warning';
    interface Props {
        newPatient: NewPatient;
        setNewPatient: React.Dispatch<React.SetStateAction<NewPatient>>;
        fingerImage: string;
        setFingerImage: React.Dispatch<React.SetStateAction<string>>;
        fingerMessage: { text: string; type: MessageType };
        setFingerMessage: React.Dispatch<React.SetStateAction<{ text: string; type: MessageType }>>;
    }

    const FingerprintScanner: React.FC<Props> = ({
        newPatient,
        setNewPatient,
        fingerImage,
        setFingerImage,
        fingerMessage,
        setFingerMessage,
    }) => {
        const socketRef = useRef<WebSocket | null>(null);

        const messageStyles = {
            info: 'bg-blue-100 text-blue-700 border-blue-300',
            primary: 'bg-blue-100 text-blue-800 border-blue-400',
            success: 'bg-green-100 text-green-700 border-green-300',
            danger: 'bg-red-100 text-red-700 border-red-300',
            warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        };

        const showMessage = (text: string, type: MessageType = 'info') => {
            setFingerMessage({ text, type });
        };

        const startScan = () => {
            showMessage('Initializing scan...', 'info');
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                initSocket();
            } else {
                showMessage("Reusing WebSocket connection. Sending 'start-enroll'...", 'info');
                socketRef.current.send('start-enroll');
            }
        };

        const initSocket = () => {
            showMessage('Connecting to fingerprint scanner...', 'info');
            socketRef.current = new WebSocket('ws://localhost:12345');

            socketRef.current.onopen = () => {
                showMessage('Scanner connected. Please scan your finger...', 'primary');
                socketRef.current?.send('start-enroll');
            };

            socketRef.current.onmessage = (event: MessageEvent) => {
                const data = event.data;

                if (data.startsWith('ENROLL:')) {
                    const msg = data.replace('ENROLL:', '').trim();
                    showMessage(msg, 'primary');
                } else if (data.startsWith('IMG:')) {
                    const base64Img = data.substring(4).trim().replace(/\r?\n|\r/g, '');
                    const fullImage = `data:image/png;base64,${base64Img}`;
                    setFingerImage(fullImage);
                } else if (data.length > 1000) {
                    setNewPatient(prev => ({ ...prev, media: { ...prev.media, PatientFingerprint: data } }));
                } else {
                    showMessage(data, 'warning');
                }
            };

            socketRef.current.onerror = () => {
                showMessage('Error: Cannot connect to scanner. Please ensure it is running.', 'danger');
            };
        };        return (
            <div className="fingerprint-section space-y-4">
                <input type="hidden" name="FingerIdentifier" value={fingerImage} />
                <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Fingerprint Scanner</Label>
                    <button
                        id="scanButton"
                        type="button"
                        onClick={startScan}
                        className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <Fingerprint className="h-4 w-4" />
                        Scan Fingerprint
                    </button>
                </div>

                {fingerMessage.text && (
                    <div
                        className={`text-sm px-4 py-3 rounded-xl border transition-all duration-300 ${fingerMessage.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700'
                            : fingerMessage.type === 'danger'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
                                : fingerMessage.type === 'warning'
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700'
                                    : fingerMessage.type === 'primary'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
                                        : 'bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        {fingerMessage.text === 'Success. Sending template...'
                            ? 'Fingerprint successfully scanned.'
                            : fingerMessage.text}
                    </div>
                )}

                {fingerImage ? (
                    <div className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Fingerprint className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Captured Fingerprint</span>
                        </div>
                        <img
                            src={fingerImage}
                            className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                            alt="Fingerprint"
                        />
                    </div>
                ) : null}
            </div>
        );
    };

    const DocumentScanner: React.FC<{ newPatient: NewPatient; setNewPatient: React.Dispatch<React.SetStateAction<NewPatient>> }> = ({ newPatient, setNewPatient }) => {
        const socketRef = useRef<WebSocket | null>(null);

        const handleScanClick = () => {
            if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
                const socket = new WebSocket('ws://localhost:12346/');
                socketRef.current = socket;

                socket.onopen = () => {
                    socket.send('start-scan');
                };

                socket.onmessage = (event: MessageEvent) => {
                    const data = event.data as string;
                    if (data.startsWith('IMG:')) {
                        const base64Img = data.substring(4).trim();
                        setNewPatient({ ...newPatient, media: { ...newPatient.media, PatientScannedDoc: base64Img } });
                    }
                };

                socket.onerror = (error: Event) => {
                    console.error('WebSocket Error:', error);
                    alert('Cannot connect to the scanner. Please make sure the scanner app is running.');
                };
            } else {
                socketRef.current.send('start-scan');
            }
        };        return (
            <div className="document-scanner space-y-4">
                <div className="space-y-2">
                    <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Document Scanner</Label>
                    <button
                        type="button"
                        onClick={handleScanClick}
                        className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 flex items-center justify-center gap-2 text-sm font-medium"
                    >
                        <FileText className="h-4 w-4" />
                        Scan Document
                    </button>
                </div>

                <input type="hidden" name="ScannedDocument" value={newPatient.media.PatientScannedDoc || ''} />

                {newPatient.media.PatientScannedDoc && (
                    <div className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileCheck className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scanned Document</span>
                        </div>
                        <img
                            src={`data:image/png;base64,${newPatient.media.PatientScannedDoc}`}
                            alt="Scanned Document"
                            className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                        />
                    </div>
                )}
            </div>
        );
    };

    const FingerprintResults: React.FC<{ fingerImage: string; fingerMessage: { text: string; type: MessageType } }> = ({ fingerImage, fingerMessage }) => {
        const messageStyles = {
            info: 'bg-blue-100 text-blue-700 border-blue-300',
            primary: 'bg-blue-100 text-blue-800 border-blue-400',
            success: 'bg-green-100 text-green-700 border-green-300',
            danger: 'bg-red-100 text-red-700 border-red-300',
            warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        };

        return (
            <div className="fingerprint-results space-y-4">
                <input type="hidden" name="FingerIdentifier" value={fingerImage} />

                {fingerMessage.text && (
                    <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${messageStyles[fingerMessage.type]}`}>
                        {fingerMessage.text}
                    </div>
                )}

                {fingerImage && (
                    <div className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Fingerprint className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fingerprint Captured</span>
                        </div>
                        <img
                            src={fingerImage}
                            alt="Fingerprint"
                            className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                        />
                    </div>
                )}
            </div>
        );
    };

    const DocumentResults: React.FC<{ newPatient: NewPatient }> = ({ newPatient }) => {
        return (
            <div className="document-results space-y-4">
                <input type="hidden" name="ScannedDocument" value={newPatient.media.PatientScannedDoc || ''} />

                {newPatient.media.PatientScannedDoc && (
                    <div className="mt-2 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileCheck className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scanned Document</span>
                        </div>
                        <img
                            src={`data:image/png;base64,${newPatient.media.PatientScannedDoc}`}
                            alt="Scanned Document"
                            className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                        />
                    </div>
                )}
            </div>
        );
    };

    const addMobile = () => {
        const val = (phoneCountryCode + phoneInput).trim();
        if (!val) return;
        
        // Check if mobile number already exists
        const exists = newPatient.mobileNo.some(mobile => 
            (mobile.countryCode.toString() + mobile.number) === val
        );
        if (exists) return;
        
        // Extract country code and number
        const countryCode = parseInt(phoneCountryCode) || 962; // Default to Jordan
        const number = phoneInput.trim();
        
        if (number.length <= 6) return; // Basic validation
        
        const newMobile: MobileNumber = {
            countryCode,
            number
        };
        
        setNewPatient({ 
            ...newPatient, 
            mobileNo: [newMobile, ...newPatient.mobileNo] 
        });
        setPhoneInput('');
        setPhoneCountryCode('');
    };

    const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Basic validation
        if (!newPatient.firstEnName || !newPatient.firstArName || !newPatient.fatherEnName || !newPatient.fatherArName
            || !newPatient.finalEnName || !newPatient.finalArName || !newPatient.familyArName || !newPatient.familyEnName) {
            toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
        }

        // Prepare payload: convert mobileNo to array of strings for legacy fields if needed
        const payload = {
            ...newPatient,
            mobileNo: newPatient.mobileNo.map(m => ({ countryCode: m.countryCode, number: m.number })),
        };

        try {
            const response = await fetch('/api/patients/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', response.status, errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            toast({
                title: 'Success',
                description: 'Patient added successfully',
                variant: 'default',
            });
            setNewPatient(initialNewPatient); // Reset form
            setPhoto(null);
            setIsCaptured(false);
            setIsVideoReady(false);
            setFingerImage("");
            setFingerMessage({ text: '', type: 'info' });
        } catch (error) {
            console.error('Fetch error:', error);
            toast({
                title: 'Error',
                description: 'Failed to add patient',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }

    };

    // ChipInput component for multi-value fields
    function ChipInput({ label, values, setValues, placeholder, type = 'text', inputMode = 'text', validate, phone }: {
        label: string;
        values: any[];
        setValues: (vals: any[]) => void;
        placeholder: string;
        type?: string;
        inputMode?: string;
        validate?: (val: any) => boolean;
        phone?: boolean;
    }) {
        const [input, setInput] = React.useState('');
        const [countryCode, setCountryCode] = React.useState<number>(962);
        const [phoneInput, setPhoneInput] = React.useState('');
        const inputRef = React.useRef<HTMLInputElement>(null);

        const addValue = () => {
            const val = phone ? phoneInput.trim() : input.trim();
            if (!val) return;
            if (phone) {
    let code = countryCode;
    let number = val;

    const codeStr = String(code);
    if (val.startsWith(codeStr)) {
        number = val.slice(codeStr.length).replace(/^0+/, '');
    } else {
        // fallback: keep original input
        number = val.replace(/^0+/, '');
    }

    if (validate && !validate({ countryCode: code, number })) return;
    if (values.some(v => v.number === number && v.countryCode === code)) return;

    setValues([{ countryCode: code, number }, ...values]);
    setPhoneInput('');
    setCountryCode(962); // reset to default
}
else {
                if (validate && !validate(val)) return;
                if (values.includes(val)) return;
                setValues([val, ...values]);
                setInput('');
            }
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
        };        return (
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
                <div className="flex flex-wrap items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-400/70 transition-all duration-300 px-3 py-2 min-h-[48px]">
                    {values.map((val, idx) => (
                        <span key={idx} className="flex items-center bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm">
                            {phone ? (
                                <>
                                    <span className="inline-flex items-center mr-1">
                                        <span className="mr-1 text-xs">+{val.countryCode}</span>
                                        {val.number}
                                    </span>
                                </>
                            ) : val}
                            {values.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setValues(values.filter((_, i) => i !== idx))}
                                    className="ml-2 text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none transition-colors duration-200"
                                    aria-label={`Remove ${label} ${phone ? val.number : val}`}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                    {phone ? (
                        <PhoneInput
                            country={'jo'}
                            value={phoneInput}
                            onChange={(val, data: CountryData) => {
                                setPhoneInput(val);
                                if (data && 'dialCode' in data && data.dialCode) setCountryCode(Number(data.dialCode));
                            }}
                            inputProps={{
                                onKeyDown,
                                onBlur: addValue,
                                placeholder,
                                ref: inputRef,
                                className: 'border-none outline-none bg-transparent text-sm py-2 px-2 rounded-lg',
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
                                borderRadius: '0.75rem',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            }}
                            containerStyle={{ flex: 1, minWidth: 180 }}
                            enableSearch
                            disableDropdown={false}
                        />
                    ) : (
                        <input
                            ref={inputRef}
                            type={type}
                            inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>["inputMode"]}
                            className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm py-2 px-2 rounded-lg placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder={placeholder}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            onBlur={addValue}
                        />
                    )}
                    <button
                        type="button"
                        onClick={addValue}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700 transition-all duration-200 shadow-sm"
                        tabIndex={-1}
                        aria-label={`Add ${label}`}
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Nationality dropdown state
    const [nationalitySearchOpen, setNationalitySearchOpen] = useState(false);
    const [nationalitySearchValue, setNationalitySearchValue] = useState('');
    const [nationalitySearchTerm, setNationalitySearchTerm] = useState('');
    const [filteredCountries, setFilteredCountries] = useState<{ label: string; value: string }[]>([]);
    
    // Mobile numbers input state
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('');

    const countryOptions = countryList().getData();

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

    // Initialize filtered countries
    useEffect(() => {
        setFilteredCountries(countryOptions);
    }, [countryOptions]);
    
    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    .react-tel-input .country-list {
                        background: rgba(255, 255, 255, 0.95) !important;
                        backdrop-filter: blur(12px) !important;
                        border: 1px solid rgba(229, 231, 235, 0.6) !important;
                        border-radius: 12px !important;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                        overflow: hidden !important;
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
                `
            }} />
            <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-indigo-900/10">
            <Sidebar />
            <div className="flex-1">
                <Header />
                <main className="py-3 xl:py-4">
                    <div className="px-3 md:px-4 xl:px-6 w-full">
                        {/* Page Header */}
                        <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4 mb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
                                        <UserPlus className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
                                            Add New Patient
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                            Create a new patient record with complete information and biometric data
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>                        
                        <div className="space-y-2">
                            <form onSubmit={handleAddPatient} className="space-y-2">
                                {/* Patient Information Cards */}                                {/* English Names Card */}
                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 shadow-md">
                                            <User className="h-3 w-3 text-white" />
                                        </div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">English Names</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
                                        <div className="md:col-span-1">
                                            <Label htmlFor="firstEnName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">First Name (English)</Label>
                                            <Input
                                                id="firstEnName"
                                                value={newPatient.firstEnName}
                                                onChange={(e) => setNewPatient({ ...newPatient, firstEnName: e.target.value })}
                                                placeholder="First name"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="fatherEnName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Father's Name (English)</Label>
                                            <Input
                                                id="fatherEnName"
                                                value={newPatient.fatherEnName}
                                                onChange={(e) => setNewPatient({ ...newPatient, fatherEnName: e.target.value })}
                                                placeholder="Father's name"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="finalEnName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Grandfather's Name (English)</Label>
                                            <Input
                                                id="finalEnName"
                                                value={newPatient.finalEnName}
                                                onChange={(e) => setNewPatient({ ...newPatient, finalEnName: e.target.value })}
                                                placeholder="Grandfather's name"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="familyEnName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Family Name (English)</Label>
                                            <Input
                                                id="familyEnName"
                                                value={newPatient.familyEnName}
                                                onChange={(e) => setNewPatient({ ...newPatient, familyEnName: e.target.value })}
                                                placeholder="Family name"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>                                {/* Arabic Names Card */}
                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-md">
                                            <Globe className="h-3 w-3 text-white" />
                                        </div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Arabic Names</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2">
                                        <div className="md:col-span-1">
                                            <Label htmlFor="familyArName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">اسم العائلة (عربي)</Label>
                                            <Input
                                                id="familyArName"
                                                value={newPatient.familyArName}
                                                onChange={(e) => setNewPatient({ ...newPatient, familyArName: e.target.value })}
                                                placeholder="اسم العائلة"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="finalArName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">اسم الجد (عربي)</Label>
                                            <Input
                                                id="finalArName"
                                                value={newPatient.finalArName}
                                                onChange={(e) => setNewPatient({ ...newPatient, finalArName: e.target.value })}
                                                placeholder="اسم الجد"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="fatherArName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">اسم الأب (عربي)</Label>
                                            <Input
                                                id="fatherArName"
                                                value={newPatient.fatherArName}
                                                onChange={(e) => setNewPatient({ ...newPatient, fatherArName: e.target.value })}
                                                placeholder="اسم الأب"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="firstArName" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">الاسم الأول (عربي)</Label>
                                            <Input
                                                id="firstArName"
                                                value={newPatient.firstArName}
                                                onChange={(e) => setNewPatient({ ...newPatient, firstArName: e.target.value })}
                                                placeholder="الاسم الأول"
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-right"
                                            />
                                        </div>
                                    </div>
                                </div>                                {/* Personal Information Card */}
                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-md">
                                            <Calendar className="h-3 w-3 text-white" />
                                        </div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Personal Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
                                        <div className="md:col-span-1">
                                            <Label htmlFor="dateOfBirth" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Date of Birth</Label>
                                            <Input
                                                id="dateOfBirth"
                                                type="date"
                                                value={newPatient.dateOfBirth}
                                                onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label htmlFor="gender" className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Gender</Label>
                                            <select
                                                id="gender"
                                                value={newPatient.gender}
                                                onChange={(e) => setNewPatient({ ...newPatient, gender: parseInt(e.target.value, 10) })}
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200"
                                            >
                                                <option value={1}>Male</option>
                                                <option value={2}>Female</option>
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
                                                                        setNewPatient({ ...newPatient, nationality: '' });
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
                                                                            setNewPatient({ ...newPatient, nationality: country.label });
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
                                </div>                                {/* Identification Card */}
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
                                            <select
                                                value={newPatient.identificationType}
                                                onChange={(e) => setNewPatient({ ...newPatient, identificationType: e.target.value as 'passport' | 'id' })}
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200"
                                            >
                                                <option value="passport">Passport</option>
                                                <option value="id">National ID</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">ID Number</Label>
                                            <Input
                                                value={newPatient.identificationType === 'passport' ? newPatient.documentId : newPatient.nationalId}
                                                onChange={e => {
                                                    if (newPatient.identificationType === 'passport') {
                                                        setNewPatient({ ...newPatient, documentId: e.target.value, identificationNumber: e.target.value });
                                                    } else {
                                                        setNewPatient({ ...newPatient, nationalId: e.target.value, identificationNumber: e.target.value });
                                                    }
                                                }}
                                                placeholder={`Enter ${newPatient.identificationType === 'passport' ? 'passport' : 'ID'} number`}
                                                required
                                                className="w-full max-w-xs backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information Card */}
                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 shadow-md">
                                            <Phone className="h-3 w-3 text-white" />
                                        </div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Contact Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-2">
                                        <div className="lg:col-span-1">
                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Mobile Numbers</Label>
                                            <div className="flex flex-wrap items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/40 rounded-xl focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-400/70 transition-all duration-300 px-3 py-2 min-h-[48px] max-w-sm">
                                                {newPatient.mobileNo.map((mobile, idx) => (
                                                    <span key={idx} className="flex items-center bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-lg px-3 py-1.5 text-sm font-medium shadow-sm">
                                                        +{mobile.countryCode}{mobile.number}
                                                        {newPatient.mobileNo.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewPatient({
                                                                    ...newPatient,
                                                                    mobileNo: newPatient.mobileNo.filter((_, i) => i !== idx)
                                                                })}
                                                                className="ml-2 text-emerald-600 dark:text-emerald-400 hover:text-red-500 dark:hover:text-red-400 focus:outline-none transition-colors duration-200"
                                                                aria-label={`Remove Mobile Number +${mobile.countryCode}${mobile.number}`}
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
                                                values={newPatient.email}
                                                setValues={vals => setNewPatient({ ...newPatient, email: vals })}
                                                placeholder="Type and press Enter to add"
                                                type="email"
                                                inputMode="email"
                                                validate={val => typeof val === 'string' ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val) : false}
                                            />
                                        </div>
                                        <div className="lg:col-span-1 max-w-sm">
                                            <ChipInput
                                                label="Insurance Card Numbers"
                                                values={newPatient.insuranceCardNumber}
                                                setValues={vals => setNewPatient({ ...newPatient, insuranceCardNumber: vals })}
                                                placeholder="Type and press Enter to add"
                                                type="text"
                                                inputMode="text"
                                            />
                                        </div>
                                    </div>
                                </div>                                {/* Biometric Data Card */}
                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md">
                                            <Fingerprint className="h-3 w-3 text-white" />
                                        </div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Biometric & Document Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <div>
                                            <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Fingerprint</Label>
                                            <button
                                                id="scanButton"
                                                type="button"
                                                onClick={() => {
                                                    setFingerMessage({ text: 'Initializing scan...', type: 'info' });
                                                    const socketRef = fingerSocketRef.current;
                                                    if (!socketRef || socketRef.readyState !== WebSocket.OPEN) {
                                                        initFingerSocket();
                                                    } else {
                                                        setFingerMessage({ text: "Reusing WebSocket connection. Sending 'start-enroll'...", type: 'info' });
                                                        socketRef.send('start-enroll');
                                                    }
                                                }}
                                                className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <Fingerprint className="h-4 w-4" />
                                                Scan Fingerprint
                                            </button>
                                            
                                            <div className="mt-4">
                                                <FingerprintResults
                                                    fingerImage={fingerImage}
                                                    fingerMessage={fingerMessage}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Scanned Document</Label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const socketRef = documentSocketRef.current;
                                                    if (!socketRef || socketRef.readyState !== WebSocket.OPEN) {
                                                        const socket = new WebSocket('ws://localhost:12346/');
                                                        documentSocketRef.current = socket;

                                                        socket.onopen = () => {
                                                            socket.send('start-scan');
                                                        };

                                                        socket.onmessage = (event: MessageEvent) => {
                                                            const data = event.data as string;
                                                            if (data.startsWith('IMG:')) {
                                                                const base64Img = data.substring(4).trim();
                                                                setNewPatient({ ...newPatient, media: { ...newPatient.media, PatientScannedDoc: base64Img } });
                                                            }
                                                        };

                                                        socket.onerror = (error: Event) => {
                                                            console.error('WebSocket Error:', error);
                                                            alert('Cannot connect to the scanner. Please make sure the scanner app is running.');
                                                        };
                                                    } else {
                                                        socketRef.send('start-scan');
                                                    }
                                                }}
                                                className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Scan Document
                                            </button>
                                            
                                            <div className="mt-4">
                                                <DocumentResults newPatient={newPatient} />
                                            </div>
                                        </div>
                                    </div>
                                </div>                                {/* Patient Photo Section */}
                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 shadow-md">
                                            <Camera className="h-3 w-3 text-white" />
                                        </div>
                                        <h2 className="font-semibold text-gray-800 dark:text-gray-200">Patient Photo</h2>
                                    </div>
                                    
                                    {/* Current Photo Preview Section */}
                                    {(photoPreview || photo) && (
                                        <div className="mb-3">
                                            <Label className="text-sm font-normal text-gray-800 dark:text-gray-200 mb-1 block">Current Photo</Label>
                                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                <img
                                                    src={photoPreview || photo || ''}
                                                    alt="Patient Photo"
                                                    className="w-full max-w-md mx-auto h-auto max-h-[200px] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-lg"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Capture New Photo Section */}
                                    <div>
                                        <Label className="font-normal text-gray-800 dark:text-gray-200 mb-1 block">Add Photo</Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                disabled={!!photoPreview || !!photo}
                                                onClick={() => { if (!photoPreview && !photo) setShowCamera(true); }}
                                                className={`w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 flex items-center justify-center gap-2 text-sm font-medium ${(photoPreview || photo) ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                <Camera className="h-4 w-4" />
                                                Capture New Photo
                                            </button>

                                            <input
                                                id="photo"
                                                type="file"
                                                accept="image/*"
                                                ref={fileInputRef}
                                                disabled={!!(photo || photoPreview)}
                                                onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            toast({
                                                                title: 'Error',
                                                                description: 'File size should not exceed 5MB',
                                                                variant: 'destructive',
                                                            });
                                                            return;
                                                        }
                                                        try {
                                                            const base64String = await convertFileToBase64(file);
                                                            setNewPatient({
                                                                ...newPatient,
                                                                photo: base64String,
                                                                media: { ...newPatient.media, PatientPhoto: base64String }
                                                            });
                                                            setPhotoPreview(base64String);
                                                        } catch (error) {
                                                            toast({
                                                                title: 'Error',
                                                                description: 'Failed to process the image',
                                                                variant: 'destructive',
                                                            });
                                                        }
                                                    } else {
                                                        setPhotoPreview(null);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="photo"
                                                className={`w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/40 dark:hover:to-pink-900/40 text-center cursor-pointer flex items-center justify-center gap-2 text-sm font-medium ${(photo || photoPreview) ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                <Upload className="h-4 w-4" />
                                                Choose From Files
                                            </label>
                                        </div>

                                        {showCamera && (
                                            <div className="mt-3">
                                                <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl p-4">
                                                    <CameraCaptureInput
                                                        newPatient={newPatient}
                                                        setNewPatient={setNewPatient}
                                                        showCamera={showCamera && !photoPreview}
                                                        setShowCamera={setShowCamera}
                                                        photo={photo}
                                                        setPhoto={setPhoto}
                                                        isCaptured={isCaptured}
                                                        setIsCaptured={setIsCaptured}
                                                        isVideoReady={isVideoReady}
                                                        setIsVideoReady={setIsVideoReady}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Clear Photo Button */}
                                        {(photoPreview || photo) && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    className="w-48 py-2 px-3 rounded-xl bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-600 dark:hover:to-slate-600 flex items-center justify-center gap-2 text-sm font-medium"
                                                    onClick={() => {
                                                        setPhotoPreview(null);
                                                        setPhoto(null);
                                                        setNewPatient({ ...newPatient, photo: '', media: { ...newPatient.media, PatientPhoto: '' } });
                                                        setIsCaptured(false);
                                                        setIsVideoReady(false);
                                                        setShowCamera(false);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                    Clear Photo
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            {/* Submit Button */}
                            <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3 xl:p-4">
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-auto min-w-[250px] max-w-[400px] py-2 px-6 text-white rounded-xl bg-[#008ea9] hover:bg-[#007292] shadow-lg hover:shadow-xl transition-all duration-300 text-sm font-medium focus:ring-2 focus:ring-[#008ea9]/50 focus:ring-offset-1 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Adding Patient...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4" />
                                                Add New Patient
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                        </div>
                    </div>
                </main>
            </div>
        </div>
        </>
    );
}
