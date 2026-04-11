import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  DocumentData,
  writeBatch,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import type {
  UserProfile,
  DoctorProfile,
  PatientProfile,
  Appointment,
  ChatRoom,
  ChatMessage,
  Prescription,
  Payment,
  Review,
  Notification,
} from '@/types';

// ─── Helpers ─────────────────────────────────────────────────
export function toDate(ts: Timestamp | Date | null | undefined): Date {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

// ─── User Operations ─────────────────────────────────────────
export async function createUserProfile(user: Omit<UserProfile, 'createdAt' | 'updatedAt'>) {
  await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
    ...user,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  } as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Doctor Operations ───────────────────────────────────────
export async function getDoctors(filters?: {
  specialization?: string;
  city?: string;
  isApproved?: boolean;
}): Promise<DoctorProfile[]> {
  const constraints: QueryConstraint[] = [where('role', '==', 'doctor')];
  if (filters?.isApproved !== undefined) constraints.push(where('isApproved', '==', filters.isApproved));
  if (filters?.specialization) constraints.push(where('specialization', '==', filters.specialization));
  if (filters?.city) constraints.push(where('city', '==', filters.city));

  const q = query(collection(db, COLLECTIONS.USERS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, uid: d.id, createdAt: toDate(data.createdAt), updatedAt: toDate(data.updatedAt) } as DoctorProfile;
  });
}

export async function approveDoctor(uid: string, adminId: string) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    isApproved: true,
    approvedAt: serverTimestamp(),
    approvedBy: adminId,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectDoctor(uid: string, reason: string) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    isApproved: false,
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  });
}

// ─── Appointment Operations ──────────────────────────────────
export async function createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, COLLECTIONS.APPOINTMENTS), {
    ...appointment,
    scheduledAt: Timestamp.fromDate(appointment.scheduledAt),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAppointments(userId: string, role: 'patient' | 'doctor'): Promise<Appointment[]> {
  const field = role === 'patient' ? 'patientId' : 'doctorId';
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where(field, '==', userId),
    orderBy('scheduledAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      scheduledAt: toDate(data.scheduledAt),
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    } as Appointment;
  });
}

export async function updateAppointment(id: string, data: Partial<Appointment>) {
  await updateDoc(doc(db, COLLECTIONS.APPOINTMENTS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeAppointments(
  userId: string,
  role: 'patient' | 'doctor',
  callback: (appointments: Appointment[]) => void
) {
  const field = role === 'patient' ? 'patientId' : 'doctorId';
  const q = query(
    collection(db, COLLECTIONS.APPOINTMENTS),
    where(field, '==', userId),
    orderBy('scheduledAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const appointments = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        scheduledAt: toDate(data.scheduledAt),
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      } as Appointment;
    });
    callback(appointments);
  });
}

// ─── Chat Operations ─────────────────────────────────────────
export async function createChatRoom(room: Omit<ChatRoom, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.CHAT_ROOMS), {
    ...room,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function sendMessage(roomId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) {
  const batch = writeBatch(db);
  const msgRef = doc(collection(db, COLLECTIONS.CHAT_ROOMS, roomId, COLLECTIONS.MESSAGES));
  batch.set(msgRef, { ...message, createdAt: serverTimestamp() });
  const roomRef = doc(db, COLLECTIONS.CHAT_ROOMS, roomId);
  batch.update(roomRef, {
    lastMessage: message.content,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: message.senderId,
  });
  await batch.commit();
  return msgRef.id;
}

export function subscribeMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, COLLECTIONS.CHAT_ROOMS, roomId, COLLECTIONS.MESSAGES),
    orderBy('createdAt', 'asc'),
    limit(100)
  );
  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: toDate(data.createdAt),
      } as ChatMessage;
    });
    callback(messages);
  });
}

// ─── Prescription Operations ─────────────────────────────────
export async function createPrescription(
  prescription: Omit<Prescription, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.PRESCRIPTIONS), {
    ...prescription,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getPrescription(id: string): Promise<Prescription | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.PRESCRIPTIONS, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, id: snap.id, createdAt: toDate(data.createdAt) } as Prescription;
}

export async function getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
  const q = query(
    collection(db, COLLECTIONS.PRESCRIPTIONS),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, id: d.id, createdAt: toDate(data.createdAt) } as Prescription;
  });
}

// ─── Payment Operations ──────────────────────────────────────
export async function createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
    ...payment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePayment(id: string, data: Partial<Payment>) {
  await updateDoc(doc(db, COLLECTIONS.PAYMENTS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Review Operations ───────────────────────────────────────
export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
    ...review,
    createdAt: serverTimestamp(),
  });
  // Update doctor rating
  const doctorRef = doc(db, COLLECTIONS.USERS, review.doctorId);
  const doctorSnap = await getDoc(doctorRef);
  if (doctorSnap.exists()) {
    const doctor = doctorSnap.data() as DoctorProfile;
    const newTotal = (doctor.totalReviews || 0) + 1;
    const newRating = ((doctor.rating || 0) * (doctor.totalReviews || 0) + review.rating) / newTotal;
    await updateDoc(doctorRef, {
      rating: Math.round(newRating * 10) / 10,
      totalReviews: newTotal,
    });
  }
  return ref.id;
}

export async function getDoctorReviews(doctorId: string): Promise<Review[]> {
  const q = query(
    collection(db, COLLECTIONS.REVIEWS),
    where('doctorId', '==', doctorId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { ...data, id: d.id, createdAt: toDate(data.createdAt) } as Review;
  });
}

// ─── Notifications ───────────────────────────────────────────
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
  await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    ...notification,
    createdAt: serverTimestamp(),
  });
}

export function subscribeNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(30)
  );
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, id: d.id, createdAt: toDate(data.createdAt) } as Notification;
    });
    callback(notifications);
  });
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { isRead: true });
}

// ─── Admin Stats ─────────────────────────────────────────────
export async function getAdminStats() {
  const [usersSnap, appointmentsSnap, paymentsSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.USERS)),
    getDocs(collection(db, COLLECTIONS.APPOINTMENTS)),
    getDocs(collection(db, COLLECTIONS.PAYMENTS)),
  ]);

  const users = usersSnap.docs.map((d) => d.data());
  const appointments = appointmentsSnap.docs.map((d) => d.data());
  const payments = paymentsSnap.docs.map((d) => d.data());

  return {
    totalUsers: users.length,
    totalDoctors: users.filter((u) => u.role === 'doctor').length,
    totalPatients: users.filter((u) => u.role === 'patient').length,
    pendingApprovals: users.filter((u) => u.role === 'doctor' && !u.isApproved).length,
    totalAppointments: appointments.length,
    totalRevenue: payments.filter((p) => p.status === 'verified').reduce((sum, p) => sum + (p.amount || 0), 0),
    pendingPayments: payments.filter((p) => p.status === 'pending').length,
    todayAppointments: appointments.filter((a) => {
      const d = toDate(a.scheduledAt);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length,
  };
}
