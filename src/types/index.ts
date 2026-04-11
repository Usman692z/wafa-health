// ============================================================
// GLOBAL TYPES & INTERFACES
// ============================================================

export type UserRole = 'admin' | 'doctor' | 'patient';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded';

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'manual';

export type ConsultationType = 'chat' | 'video' | 'instant' | 'scheduled';

// ─── User ────────────────────────────────────────────────────
export interface BaseUser {
  uid: string;
  name: string;
  email?: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  isBlocked: boolean;
  fcmToken?: string;
  preferredLanguage: 'en' | 'ur';
}

export interface PatientProfile extends BaseUser {
  role: 'patient';
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  city?: string;
  address?: string;
  medicalHistory?: string[];
  wallet?: number; // PKR
}

export interface DoctorProfile extends BaseUser {
  role: 'doctor';
  pmdcNumber: string; // PMDC/PMC registration number
  specialization: string;
  subSpecialization?: string;
  qualifications: string[];
  experience: number; // years
  consultationFee: number; // PKR
  city: string;
  hospital?: string;
  about?: string;
  languages: string[];
  rating: number;
  totalReviews: number;
  totalConsultations: number;
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  documents?: DoctorDocument[];
  availability: AvailabilitySlot[];
  earnings: number; // PKR total
  bankDetails?: BankDetails;
  isOnline: boolean;
}

export interface AdminProfile extends BaseUser {
  role: 'admin';
  permissions: AdminPermission[];
}

export type UserProfile = PatientProfile | DoctorProfile | AdminProfile;

// ─── Doctor Documents ───────────────────────────────────────
export interface DoctorDocument {
  type: 'pmdc_certificate' | 'degree' | 'cnic' | 'other';
  url: string;
  name: string;
  uploadedAt: Date;
}

export interface BankDetails {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
}

// ─── Availability ───────────────────────────────────────────
export interface AvailabilitySlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDuration: number; // minutes (e.g. 15, 30)
  isActive: boolean;
}

export interface TimeSlot {
  time: string;
  isBooked: boolean;
  appointmentId?: string;
}

// ─── Appointment ────────────────────────────────────────────
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAvatar?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar?: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  scheduledAt: Date;
  duration: number; // minutes
  symptoms?: string;
  notes?: string;
  fee: number; // PKR
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  prescriptionId?: string;
  chatRoomId?: string;
  videoRoomId?: string;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
  completedAt?: Date;
  rating?: number;
  review?: string;
}

// ─── Chat ────────────────────────────────────────────────────
export interface ChatRoom {
  id: string;
  appointmentId: string;
  participants: string[]; // [patientId, doctorId]
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageBy?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  type: 'text' | 'image' | 'file' | 'system' | 'prescription';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  createdAt: Date;
}

// ─── Prescription ────────────────────────────────────────────
export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorPmdcNumber: string;
  diagnosis: string;
  medicines: Medicine[];
  tests?: string[];
  advice?: string;
  followUpDate?: string;
  createdAt: Date;
  pdfUrl?: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// ─── Payment ─────────────────────────────────────────────────
export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number; // PKR
  platformFee: number; // PKR (commission)
  doctorEarning: number; // PKR
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  screenshotUrl?: string; // for manual payments
  verifiedBy?: string;
  verifiedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ──────────────────────────────────────────────────
export interface Review {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  doctorId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

// ─── Notification ────────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type:
    | 'appointment_booked'
    | 'appointment_confirmed'
    | 'appointment_rejected'
    | 'appointment_reminder'
    | 'payment_verified'
    | 'new_message'
    | 'prescription_ready'
    | 'doctor_approved'
    | 'doctor_rejected'
    | 'system';
  data?: Record<string, string>;
  isRead: boolean;
  createdAt: Date;
}

// ─── Admin ───────────────────────────────────────────────────
export type AdminPermission =
  | 'manage_users'
  | 'manage_doctors'
  | 'manage_appointments'
  | 'manage_payments'
  | 'manage_content'
  | 'view_analytics'
  | 'manage_commission';

export interface CommissionSettings {
  percentage: number; // e.g. 10 = 10%
  minFee: number; // PKR
  updatedAt: Date;
  updatedBy: string;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  language: 'en' | 'ur';
  order: number;
  isActive: boolean;
}

// ─── Analytics ───────────────────────────────────────────────
export interface DashboardStats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number; // PKR
  pendingApprovals: number;
  pendingPayments: number;
  activeConsultations: number;
  todayAppointments: number;
  monthlyRevenue: MonthlyRevenue[];
  topSpecializations: { name: string; count: number }[];
  topDoctors: { doctorId: string; name: string; consultations: number; rating: number }[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  appointments: number;
}
