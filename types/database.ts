export type Role = {
  id: string;
  name: string;
  description: string | null;
};

export type User = {
  employeeNumber: number;
  fullNameEnglish: string;
  fullNameArabic: string;
  gender: string;
  email: string;
  mobileNo: string;
  branchName: string;
  branchNo: number;
  department: string;
  jobTitle: string;
  roleName: string;
  specializationName?: string;
};

export type Specialization = {
  id: string;
  name: string;
  description: string;
};

export type DoctorAvailability = {
  availabilityId: string;
  doctorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

export type Appointment = {
  appointmentId: string;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  typeId: string;
  typeName: string;
  statusId: string;
  statusName: string;
  notes: string | null;
  createdAt?: string;
};

export type AppointmentCreate = {
  doctorId: number;
  doctorName?: string | null;
  patientId: number;
  patientName?: string | null;
  slotId?: string;
  typeId: string;
  notes?: string | null;
};

export type AppointmentType = {
  ID: string;
  Name: string;
  Description?: string | null;
};

export type AppointmentStatus = {
  id: string;
  name: string;
};

export type TimeSlot = {
  slotId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
};

export type Visit = {
  id: string;
  patientId: number;
  patientName: string;
  appointmentId: string;
  appointmentTime: string;
  doctorId: number;
  doctorName: string;
  status: 'pending' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled';
  identificationNumber: string;
  identificationType: 'passport' | 'id';
  fingerprintCollected: boolean;
  insuranceCardNumber: string;
  paymentType: 'cash' | 'visa';
  createdAt: string;
  visitType: string;
};

export type Patient = {
  patientID: number;
  fullName: string;
};

export type PatientVisitHistory = {
  visitId: string;
  appointmentId: string;
  doctorId: number;
  doctorName: string;
  patientID: number;
  startedAt: string;
  endedAt: string | null;
};