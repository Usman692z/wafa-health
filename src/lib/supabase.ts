import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type {
  UserProfile,
  DoctorProfile,
  PatientProfile,
  AdminProfile,
  Appointment,
  ChatRoom,
  ChatMessage,
  Prescription,
  Payment,
  Review,
  Notification,
} from '@/types';

// ─── Client ──────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type DoctorRow = Database['public']['Tables']['doctors']['Row'];
type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];
type PrescriptionRow = Database['public']['Tables']['prescriptions']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

// ─── Row mappers ─────────────────────────────────────────────
function baseFromRow(row: ProfileRow) {
  return {
    uid: row.uid,
    name: row.name,
    phone: row.phone,
    avatar: row.avatar ?? undefined,
    isBlocked: row.is_blocked,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    preferredLanguage: 'en' as const,
  };
}

function doctorFromRows(profile: ProfileRow, doctor: DoctorRow): DoctorProfile {
  return {
    ...baseFromRow(profile),
    role: 'doctor',
    pmdcNumber: doctor.pmdc_number,
    specialization: doctor.specialization,
    qualifications: doctor.qualifications,
    experience: doctor.experience,
    consultationFee: Number(doctor.consultation_fee),
    city: doctor.city,
    about: doctor.about ?? undefined,
    availability: (doctor.availability as unknown as DoctorProfile['availability']) ?? [],
    isApproved: doctor.is_approved,
    approvedBy: doctor.approved_by ?? undefined,
    approvedAt: doctor.approved_at ? new Date(doctor.approved_at) : undefined,
    rating: Number(doctor.rating),
    totalReviews: doctor.total_reviews,
    totalConsultations: doctor.total_consultations,
    languages: [],
    earnings: 0,
    isOnline: false,
  };
}

function appointmentFromRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    patientName: row.patient_name,
    patientPhone: '',
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    consultationType: row.type as Appointment['consultationType'],
    scheduledAt: new Date(row.scheduled_at),
    duration: row.duration_minutes,
    status: row.status as Appointment['status'],
    fee: 0,
    paymentStatus: 'pending',
    paymentId: row.payment_id ?? undefined,
    prescriptionId: row.prescription_id ?? undefined,
    chatRoomId: row.chat_room_id ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.created_at),
  };
}

function messageFromRow(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role as ChatMessage['senderRole'],
    type: (row.file_url ? (row.file_type?.startsWith('image') ? 'image' : 'file') : 'text') as ChatMessage['type'],
    content: row.content ?? '',
    fileUrl: row.file_url ?? undefined,
    isRead: row.is_read,
    createdAt: new Date(row.created_at),
  };
}

function prescriptionFromRow(row: PrescriptionRow): Prescription {
  return {
    id: row.id,
    appointmentId: row.appointment_id ?? '',
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    doctorSpecialization: row.doctor_specialization,
    doctorPmdcNumber: row.doctor_pmdc_number,
    diagnosis: row.diagnosis,
    medicines: row.medicines as unknown as Prescription['medicines'],
    tests: row.tests,
    advice: row.advice ?? undefined,
    followUpDate: row.follow_up_date ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function paymentFromRow(row: PaymentRow): Payment {
  return {
    id: row.id,
    appointmentId: row.appointment_id ?? '',
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    amount: Number(row.amount),
    platformFee: 0,
    doctorEarning: Number(row.amount),
    method: row.method as Payment['method'],
    status: row.status as Payment['status'],
    screenshotUrl: row.screenshot_url ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.created_at),
  };
}

function notificationFromRow(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    type: row.type as Notification['type'],
    data: (row.data as Record<string, string>) ?? undefined,
    isRead: row.is_read,
    createdAt: new Date(row.created_at),
  };
}

// ─── User / Profile Operations ───────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createUserProfile(user: Record<string, any>) {
  const { error } = await supabase.from('profiles').insert({
    uid: user.uid,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar ?? null,
    is_blocked: false,
  });
  if (error) throw error;

  if (user.role === 'doctor') {
    const { error: docError } = await supabase.from('doctors').insert({
      uid: user.uid,
      specialization: user.specialization ?? '',
      pmdc_number: user.pmdcNumber ?? '',
      experience: user.experience ?? 0,
      consultation_fee: user.consultationFee ?? 0,
      qualifications: user.qualifications ?? [],
      city: user.city ?? '',
      about: user.about ?? null,
      is_approved: false,
    });
    if (docError) throw docError;
  }

  if (user.role === 'patient') {
    const { error: patError } = await supabase.from('patients').insert({
      uid: user.uid,
      date_of_birth: user.dateOfBirth ?? null,
      gender: user.gender ?? null,
      blood_group: user.bloodGroup ?? null,
      city: user.city ?? null,
      address: user.address ?? null,
    });
    if (patError) throw patError;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('uid', uid)
    .single();

  if (error || !profile) return null;

  if (profile.role === 'doctor') {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('*')
      .eq('uid', uid)
      .single();
    if (doctor) return doctorFromRows(profile, doctor);
    // Return doctor without doctor-specific data as fallback
    return { ...baseFromRow(profile), role: 'doctor', pmdcNumber: '', specialization: '', qualifications: [], experience: 0, consultationFee: 0, city: '', availability: [], rating: 0, totalReviews: 0, totalConsultations: 0, languages: [], earnings: 0, isOnline: false, isApproved: false };
  }

  if (profile.role === 'patient') {
    const { data: patient } = await supabase
      .from('patients')
      .select('*')
      .eq('uid', uid)
      .single();
    const base: PatientProfile = { ...baseFromRow(profile), role: 'patient' };
    if (patient) {
      base.dateOfBirth = patient.date_of_birth ?? undefined;
      base.gender = (patient.gender as PatientProfile['gender']) ?? undefined;
      base.bloodGroup = patient.blood_group ?? undefined;
      base.city = patient.city ?? undefined;
      base.address = patient.address ?? undefined;
    }
    return base;
  }

  // admin
  return { ...baseFromRow(profile), role: 'admin', permissions: [] } as AdminProfile;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUserProfile(uid: string, data: Record<string, any>) {
  type PU = Database['public']['Tables']['profiles']['Update'];
  type DU = Database['public']['Tables']['doctors']['Update'];
  type PAU = Database['public']['Tables']['patients']['Update'];

  const profileFields: PU = {};
  if (data.name !== undefined) profileFields.name = data.name;
  if (data.avatar !== undefined) profileFields.avatar = data.avatar;
  if (data.isBlocked !== undefined) profileFields.is_blocked = data.isBlocked;

  if (Object.keys(profileFields).length > 0) {
    const { error } = await supabase.from('profiles').update(profileFields).eq('uid', uid);
    if (error) throw error;
  }

  const doctorFields: DU = {};
  if (data.pmdcNumber !== undefined) doctorFields.pmdc_number = data.pmdcNumber;
  if (data.specialization !== undefined) doctorFields.specialization = data.specialization;
  if (data.experience !== undefined) doctorFields.experience = data.experience;
  if (data.consultationFee !== undefined) doctorFields.consultation_fee = data.consultationFee;
  if (data.qualifications !== undefined) doctorFields.qualifications = data.qualifications;
  if (data.city !== undefined) doctorFields.city = data.city;
  if (data.about !== undefined) doctorFields.about = data.about;
  if (data.availability !== undefined) doctorFields.availability = data.availability as Database['public']['Tables']['doctors']['Update']['availability'];
  if (data.isApproved !== undefined) doctorFields.is_approved = data.isApproved;

  if (Object.keys(doctorFields).length > 0) {
    await supabase.from('doctors').update(doctorFields).eq('uid', uid);
  }

  const patientFields: PAU = {};
  if (data.dateOfBirth !== undefined) patientFields.date_of_birth = data.dateOfBirth;
  if (data.gender !== undefined) patientFields.gender = data.gender;
  if (data.bloodGroup !== undefined) patientFields.blood_group = data.bloodGroup;
  if (data.city !== undefined) patientFields.city = data.city;
  if (data.address !== undefined) patientFields.address = data.address;

  if (Object.keys(patientFields).length > 0) {
    await supabase.from('patients').update(patientFields).eq('uid', uid);
  }
}

// ─── Doctor Operations ───────────────────────────────────────
export async function getDoctors(filters?: {
  specialization?: string;
  city?: string;
  isApproved?: boolean;
}): Promise<DoctorProfile[]> {
  const approved = filters?.isApproved !== undefined ? filters.isApproved : true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('doctors')
    .select('*, profiles!inner(*)')
    .eq('is_approved', approved);

  if (filters?.specialization) query = query.eq('specialization', filters.specialization);
  if (filters?.city) query = query.eq('city', filters.city);

  const { data, error } = await query;
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const profile = row.profiles as ProfileRow;
    return doctorFromRows(profile, row as DoctorRow);
  });
}

export async function approveDoctor(uid: string, adminId: string) {
  const { error } = await supabase.from('doctors').update({
    is_approved: true,
    approved_by: adminId,
    approved_at: new Date().toISOString(),
  }).eq('uid', uid);
  if (error) throw error;
}

export async function rejectDoctor(uid: string, reason: string) {
  const { error } = await supabase.from('doctors').update({
    is_approved: false,
    rejection_reason: reason,
  }).eq('uid', uid);
  if (error) throw error;
}

// ─── Appointment Operations ──────────────────────────────────
export async function createAppointment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appointment: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase.from('appointments').insert({
    patient_id: appointment.patientId,
    doctor_id: appointment.doctorId,
    patient_name: appointment.patientName,
    doctor_name: appointment.doctorName,
    doctor_specialization: appointment.doctorSpecialization,
    scheduled_at: appointment.scheduledAt instanceof Date
      ? appointment.scheduledAt.toISOString()
      : appointment.scheduledAt,
    duration_minutes: appointment.durationMinutes ?? appointment.duration ?? 30,
    type: appointment.consultationType ?? appointment.type ?? 'chat',
    status: appointment.status ?? 'pending',
    notes: appointment.notes ?? null,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

export async function getAppointments(userId: string, role: 'patient' | 'doctor'): Promise<Appointment[]> {
  const field = role === 'patient' ? 'patient_id' : 'doctor_id';
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq(field, userId)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(appointmentFromRow);
}

export async function updateAppointment(id: string, data: Record<string, unknown>) {
  type AU = Database['public']['Tables']['appointments']['Update'];
  const update: AU = {};
  if (data.status) update.status = data.status as string;
  if (data.paymentId) update.payment_id = data.paymentId as string;
  if (data.prescriptionId) update.prescription_id = data.prescriptionId as string;
  if (data.chatRoomId) update.chat_room_id = data.chatRoomId as string;
  if (data.notes) update.notes = data.notes as string;

  const { error } = await supabase.from('appointments').update(update).eq('id', id);
  if (error) throw error;
}

export function subscribeAppointments(
  userId: string,
  role: 'patient' | 'doctor',
  callback: (appointments: Appointment[]) => void
): () => void {
  const field = role === 'patient' ? 'patient_id' : 'doctor_id';

  getAppointments(userId, role).then(callback).catch(console.error);

  const channel = supabase
    .channel(`appointments:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments', filter: `${field}=eq.${userId}` },
      () => getAppointments(userId, role).then(callback).catch(console.error)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─── Chat Operations ─────────────────────────────────────────
export async function createChatRoom(
  room: { appointmentId?: string; patientId: string; doctorId: string }
): Promise<string> {
  const { data, error } = await supabase.from('chat_rooms').insert({
    appointment_id: room.appointmentId ?? null,
    patient_id: room.patientId,
    doctor_id: room.doctorId,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

export async function sendMessage(
  roomId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase.from('messages').insert({
    room_id: roomId,
    sender_id: message.senderId,
    sender_name: message.senderName,
    sender_role: message.senderRole,
    content: message.content ?? null,
    file_url: message.fileUrl ?? null,
    file_type: message.fileType ?? null,
    is_read: false,
  }).select('id').single();
  if (error) throw error;

  await supabase.from('chat_rooms').update({
    last_message: message.content ?? '📎 File',
    last_message_at: new Date().toISOString(),
  }).eq('id', roomId);

  return data!.id;
}

export function subscribeMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const fetch = () =>
    supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => callback((data ?? []).map(messageFromRow)));

  fetch();

  const channel = supabase
    .channel(`messages:${roomId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, fetch)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ─── Prescription Operations ─────────────────────────────────
export async function createPrescription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prescription: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase.from('prescriptions').insert({
    appointment_id: prescription.appointmentId ?? null,
    patient_id: prescription.patientId,
    doctor_id: prescription.doctorId,
    patient_name: prescription.patientName,
    doctor_name: prescription.doctorName,
    doctor_specialization: prescription.doctorSpecialization,
    doctor_pmdc_number: prescription.doctorPmdcNumber,
    diagnosis: prescription.diagnosis,
    medicines: prescription.medicines,
    tests: prescription.tests ?? [],
    advice: prescription.advice ?? null,
    follow_up_date: prescription.followUpDate ?? null,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

export async function getPrescription(id: string): Promise<Prescription | null> {
  const { data, error } = await supabase
    .from('prescriptions').select('*').eq('id', id).single();
  if (error || !data) return null;
  return prescriptionFromRow(data);
}

export async function getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(prescriptionFromRow);
}

// ─── Payment Operations ──────────────────────────────────────
export async function createPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase.from('payments').insert({
    appointment_id: payment.appointmentId ?? null,
    patient_id: payment.patientId,
    doctor_id: payment.doctorId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status ?? 'pending',
    transaction_ref: payment.transactionId ?? payment.transactionRef ?? null,
    screenshot_url: payment.screenshotUrl ?? null,
    notes: payment.notes ?? null,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

export async function updatePayment(id: string, data: Record<string, unknown>) {
  type PayU = Database['public']['Tables']['payments']['Update'];
  const update: PayU = {};
  if (data.status) update.status = data.status as string;
  if (data.verifiedBy) update.verified_by = data.verifiedBy as string;
  if (data.notes) update.notes = data.notes as string;
  if (data.status === 'verified') update.verified_at = new Date().toISOString();

  const { error } = await supabase.from('payments').update(update).eq('id', id);
  if (error) throw error;
}

export async function getPayments(filters?: { patientId?: string; doctorId?: string; status?: string }): Promise<Payment[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
  if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(paymentFromRow);
}

// ─── Review Operations ───────────────────────────────────────
export async function createReview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  review: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase.from('reviews').insert({
    doctor_id: review.doctorId,
    patient_id: review.patientId,
    patient_name: review.patientName,
    appointment_id: review.appointmentId ?? null,
    rating: review.rating,
    comment: review.comment ?? null,
  }).select('id').single();
  if (error) throw error;
  return data!.id;
}

export async function getDoctorReviews(doctorId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    appointmentId: row.appointment_id ?? '',
    rating: row.rating,
    comment: row.comment ?? undefined,
    createdAt: new Date(row.created_at),
  } as Review));
}

// ─── Notifications ───────────────────────────────────────────
export async function createNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notification: Record<string, any>
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: notification.userId,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    data: notification.data ?? null,
    is_read: false,
  });
  if (error) throw error;
}

export function subscribeNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const fetch = () =>
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => callback((data ?? []).map(notificationFromRow)));

  fetch();

  const channel = supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, fetch)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

// ─── Admin Stats ─────────────────────────────────────────────
export async function getAdminStats() {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const [
    { count: totalUsers },
    { count: totalDoctors },
    { count: totalPatients },
    { count: pendingApprovals },
    { count: totalAppointments },
    { data: payments },
    { count: pendingPayments },
    { count: todayAppointments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'verified'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart)
      .lte('scheduled_at', todayEnd),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalDoctors: totalDoctors ?? 0,
    totalPatients: totalPatients ?? 0,
    pendingApprovals: pendingApprovals ?? 0,
    totalAppointments: totalAppointments ?? 0,
    totalRevenue: (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0),
    pendingPayments: pendingPayments ?? 0,
    todayAppointments: todayAppointments ?? 0,
  };
}
