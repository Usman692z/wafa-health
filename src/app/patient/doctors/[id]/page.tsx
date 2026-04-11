'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getUserProfile, getDoctorReviews, createAppointment, createChatRoom, createPayment } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatPKR, formatDate, generateTimeSlots } from '@/lib/utils';
import {
  MapPin, Star, Clock, Shield, Video, MessageSquare, Calendar,
  ChevronLeft, ChevronRight, Upload, Check, Loader2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { DoctorProfile, Review, PaymentMethod } from '@/types';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile: patientProfile } = useAuthStore();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStep, setBookingStep] = useState<'select' | 'payment' | 'confirm' | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'chat' | 'video'>('video');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('jazzcash');
  const [symptoms, setSymptoms] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getUserProfile(id), getDoctorReviews(id)]).then(([doc, revs]) => {
      setDoctor(doc as DoctorProfile);
      setReviews(revs);
      setLoading(false);
    });
  }, [id]);

  // Get available days
  const today = new Date();
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const selectedDayName = DAYS[selectedDate.getDay()];
  const availabilityForDay = doctor?.availability?.find((a) => a.day === selectedDayName && a.isActive);
  const timeSlots = availabilityForDay
    ? generateTimeSlots(availabilityForDay.startTime, availabilityForDay.endTime, availabilityForDay.slotDuration || 30)
    : [];

  async function handleBooking() {
    if (!doctor || !patientProfile || !selectedTime) return;
    setSubmitting(true);
    try {
      const scheduledAt = new Date(selectedDate);
      const [time, ampm] = selectedTime.split(' ');
      const [h, m] = time.split(':').map(Number);
      scheduledAt.setHours(ampm === 'PM' && h !== 12 ? h + 12 : h === 12 && ampm === 'AM' ? 0 : h, m);

      let screenshotUrl: string | undefined;
      if (paymentMethod === 'manual' && paymentScreenshot) {
        const storageRef = ref(storage, `payments/${Date.now()}_${paymentScreenshot.name}`);
        await uploadBytes(storageRef, paymentScreenshot);
        screenshotUrl = await getDownloadURL(storageRef);
      }

      const chatRoomId = await createChatRoom({
        appointmentId: '',
        participants: [patientProfile.uid, doctor.uid],
        isActive: true,
        lastMessage: undefined,
        lastMessageAt: undefined,
        lastMessageBy: undefined,
      });

      const appointmentId = await createAppointment({
        patientId: patientProfile.uid,
        patientName: patientProfile.name,
        patientPhone: patientProfile.phone,
        doctorId: doctor.uid,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        consultationType,
        status: 'pending',
        scheduledAt,
        duration: availabilityForDay?.slotDuration || 30,
        symptoms,
        fee: doctor.consultationFee,
        paymentStatus: paymentMethod === 'manual' ? 'pending' : 'pending',
        paymentMethod,
        chatRoomId,
        videoRoomId: consultationType === 'video' ? `room_${Date.now()}` : undefined,
      });

      await createPayment({
        appointmentId,
        patientId: patientProfile.uid,
        doctorId: doctor.uid,
        amount: doctor.consultationFee,
        platformFee: Math.round(doctor.consultationFee * 0.1),
        doctorEarning: Math.round(doctor.consultationFee * 0.9),
        method: paymentMethod,
        status: 'pending',
        screenshotUrl,
      });

      toast.success('Appointment booked! Waiting for doctor confirmation.', { duration: 5000 });
      router.push('/patient/appointments');
    } catch (err) {
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return <div className="text-center py-20 text-slate-500">Doctor not found.</div>;
  }

  return (
    <div className="max-w-4xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-500 mb-4 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Search
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-start gap-5">
              <Avatar name={doctor.name} src={doctor.avatar} size="xl" online={doctor.isOnline} />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dr. {doctor.name}</h1>
                <p className="text-blue-500 font-medium text-sm">{doctor.specialization}</p>
                {doctor.subSpecialization && (
                  <p className="text-xs text-slate-500">{doctor.subSpecialization}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" /> {doctor.city}{doctor.hospital ? `, ${doctor.hospital}` : ''}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" /> {doctor.experience} years experience
                  </span>
                  <span className="flex items-center gap-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-current" /> {doctor.rating?.toFixed(1)} ({doctor.totalReviews} reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {doctor.qualifications?.map((q) => <Badge key={q} variant="info">{q}</Badge>)}
                </div>
              </div>
            </div>
            {doctor.about && (
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{doctor.about}</p>
            )}
            <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs text-green-700 dark:text-green-400">PMDC verified: {doctor.pmdcNumber}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{doctor.totalConsultations || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Consultations</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{doctor.experience}</p>
              <p className="text-xs text-slate-500 mt-1">Yrs Experience</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{doctor.rating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-slate-500 mt-1">Rating</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Patient Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar name={review.patientName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{review.patientName}</p>
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.comment && <p className="text-sm text-slate-600 dark:text-slate-400">{review.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPKR(doctor.consultationFee)}</p>
                <p className="text-xs text-slate-400">per consultation</p>
              </div>
              <Badge variant={doctor.isOnline ? 'success' : 'default'}>
                {doctor.isOnline ? '● Online' : '○ Offline'}
              </Badge>
            </div>

            {bookingStep === null ? (
              <div className="space-y-3">
                <button
                  onClick={() => { setConsultationType('video'); setBookingStep('select'); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-sm"
                >
                  <Video className="w-4 h-4" /> Book Video Consultation
                </button>
                <button
                  onClick={() => { setConsultationType('chat'); setBookingStep('select'); }}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 rounded-xl text-sm font-semibold hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" /> Start Chat Consultation
                </button>
              </div>
            ) : bookingStep === 'select' ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Select Date</h4>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {nextDays.map((d) => (
                    <button
                      key={d.toISOString()}
                      onClick={() => { setSelectedDate(d); setSelectedTime(''); }}
                      className={`shrink-0 flex flex-col items-center p-2.5 rounded-xl border text-xs transition-colors ${
                        d.toDateString() === selectedDate.toDateString()
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                      }`}
                    >
                      <span className="font-medium">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}</span>
                      <span className="text-sm font-bold mt-0.5">{d.getDate()}</span>
                    </button>
                  ))}
                </div>

                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Select Time</h4>
                {timeSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">Doctor not available on this day</p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          selectedTime === slot
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Symptoms / Reason (Optional)</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={2}
                    placeholder="Describe your symptoms..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setBookingStep(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                  <button
                    onClick={() => setBookingStep('payment')}
                    disabled={!selectedTime}
                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : bookingStep === 'payment' ? (
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Payment Method</h4>
                {[
                  { value: 'jazzcash', label: 'JazzCash', icon: '💳', color: 'text-red-500', desc: 'Pay via JazzCash mobile wallet' },
                  { value: 'easypaisa', label: 'Easypaisa', icon: '📱', color: 'text-green-500', desc: 'Pay via Easypaisa' },
                  { value: 'manual', label: 'Manual Transfer', icon: '🏦', color: 'text-blue-500', desc: 'Bank transfer & upload screenshot' },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value as PaymentMethod)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                      paymentMethod === m.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${m.color}`}>{m.label}</p>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                    {paymentMethod === m.value && <Check className="w-4 h-4 text-blue-500 ml-auto" />}
                  </button>
                ))}

                {paymentMethod === 'manual' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">
                      Transfer {formatPKR(doctor.consultationFee)} to account:
                      <br /><strong className="text-slate-900 dark:text-white">Wafa Health • 0321-1234567</strong>
                    </p>
                    <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <span className="text-xs text-slate-500">Upload payment screenshot</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)} />
                    </label>
                    {paymentScreenshot && <p className="text-xs text-green-600 mt-1">✓ {paymentScreenshot.name}</p>}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Consultation ({consultationType})</span>
                    <span>{formatPKR(doctor.consultationFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-600 pt-1.5">
                    <span>Total</span>
                    <span>{formatPKR(doctor.consultationFee)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setBookingStep('select')} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm">Back</button>
                  <button
                    onClick={handleBooking}
                    disabled={submitting || (paymentMethod === 'manual' && !paymentScreenshot)}
                    className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
