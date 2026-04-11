'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getAppointments, updateAppointment, createReview } from '@/lib/firestore';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatTime, formatPKR } from '@/lib/utils';
import { Calendar, Video, MessageSquare, FileText, Star, Loader2, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUS_TABS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function PatientAppointmentsPage() {
  const { profile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [reviewModal, setReviewModal] = useState<{ appointment: Appointment; rating: number; comment: string } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    getAppointments(profile.uid, 'patient').then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  const filtered = activeTab === 'all' ? appointments : appointments.filter((a) => a.status === activeTab);

  async function handleCancel(id: string) {
    await updateAppointment(id, { status: 'cancelled' });
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'cancelled' } : a));
    toast.success('Appointment cancelled');
  }

  async function handleReview() {
    if (!reviewModal || !profile) return;
    setSubmittingReview(true);
    try {
      await createReview({
        appointmentId: reviewModal.appointment.id,
        patientId: profile.uid,
        patientName: profile.name,
        doctorId: reviewModal.appointment.doctorId,
        rating: reviewModal.rating,
        comment: reviewModal.comment,
      });
      await updateAppointment(reviewModal.appointment.id, {
        rating: reviewModal.rating,
        review: reviewModal.comment,
      });
      setAppointments((prev) =>
        prev.map((a) => a.id === reviewModal.appointment.id ? { ...a, rating: reviewModal.rating } : a)
      );
      toast.success('Review submitted!');
      setReviewModal(null);
    } catch {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Appointments</h2>
        <Link href="/patient/doctors" className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
          + Book New
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-blue-300'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                {appointments.filter((a) => a.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No {activeTab === 'all' ? '' : activeTab} appointments</p>
          <Link href="/patient/doctors" className="mt-3 inline-block text-sm text-blue-500 hover:underline">Book a consultation</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-start gap-4">
                <Avatar name={apt.doctorName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Dr. {apt.doctorName}</h3>
                      <p className="text-xs text-blue-500">{apt.doctorSpecialization}</p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" /> {formatDate(apt.scheduledAt)}
                    </span>
                    <span className="text-xs text-slate-500">{formatTime(apt.scheduledAt)}</span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatPKR(apt.fee)}</span>
                    <span className="text-xs text-slate-400 capitalize">{apt.consultationType} consultation</span>
                  </div>
                  {apt.symptoms && (
                    <p className="text-xs text-slate-400 mt-1 italic">"{apt.symptoms}"</p>
                  )}
                  {apt.rejectionReason && (
                    <p className="text-xs text-red-500 mt-1">Reason: {apt.rejectionReason}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                {apt.status === 'confirmed' && apt.consultationType === 'video' && (
                  <Link
                    href={`/video-call/${apt.id}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" /> Join Video Call
                  </Link>
                )}
                {apt.chatRoomId && apt.status !== 'rejected' && apt.status !== 'cancelled' && (
                  <Link
                    href={`/patient/chat/${apt.chatRoomId}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Link>
                )}
                {apt.prescriptionId && (
                  <Link
                    href={`/patient/prescriptions/${apt.prescriptionId}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-medium hover:bg-purple-100 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> Prescription
                  </Link>
                )}
                {apt.status === 'completed' && !apt.rating && (
                  <button
                    onClick={() => setReviewModal({ appointment: apt, rating: 5, comment: '' })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium hover:bg-amber-100 transition-colors"
                  >
                    <Star className="w-3.5 h-3.5" /> Rate Doctor
                  </button>
                )}
                {apt.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(apt.id)}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Rate Dr. {reviewModal.appointment.doctorName}</h3>
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setReviewModal({ ...reviewModal, rating: s })}>
                  <Star className={`w-8 h-8 ${s <= reviewModal.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
            <textarea
              value={reviewModal.comment}
              onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
              placeholder="Share your experience (optional)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-400">Cancel</button>
              <button
                onClick={handleReview}
                disabled={submittingReview}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
