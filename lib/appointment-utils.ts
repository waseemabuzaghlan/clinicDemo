import { User } from '@/types/database';

interface Patient {
  patientID: number;
  fullName: string;
}

export interface AppointmentStatus {
  id: string;
  name: string;
}

export const getPatientName = (patientId: number, patients: Patient[] = []) => {
  if (!patients?.length) return `Patient #${patientId}`;
  const patient = patients.find(d => d.patientID === patientId);
  return patient ? patient.fullName : `Patient #${patientId}`;
};

export const getDoctorName = (doctorId: number, doctors: User[] = []) => {
  if (!doctors?.length) return `Doctor #${doctorId}`;
  const doctor = doctors.find(d => d.employeeNumber === doctorId);
  return doctor ? doctor.fullNameEnglish : `Doctor #${doctorId}`;
};

export const fetchAppointmentStatuses = async (): Promise<AppointmentStatus[]> => {
  try {
    const response = await fetch('/api/lookup/appointment-statuses', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment statuses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching appointment statuses:', error);
    throw error;
  }
};
