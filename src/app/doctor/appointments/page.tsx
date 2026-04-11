'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getAppointments, updateAppointment, createPrescription, createChatRoom } from '@/lib/firestore';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatTime, formatPKR } from '@/lib/utils';
import { Calendar, Video, MessageSquare, FileText, Check, X, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUS_TABS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' },
];

export default function DoctorAppointmentsPage() {
  const { profile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!profile?.uid) return;
    getAppointments(profile.uid, 'doctor').then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  const filtered = activeTab === 'all' ? appointments : appointments.filter((a) => a.status === activeTab);

  async function handleConfirm(id: string) {
    setActionId(id);
    try {
      await updateAppointment(id, { status: 'confirmed' });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'confirmed' } : a));
      toast.success('Appointment confirmed!');
    } catch {
      toast.error('Failed to confirm');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionId(rejectModal.id);
    try {
      await updateAppointment(rejectModal.id, { status: 'rejected', rejectionReason: rejectReason });
      setAppointments((prev) => prev.map((a) => a.id === rejectModal.id ? { ...a, status: 'rejected', rejectionReason: rejectReason } : a));
      toast.success('Appointment rejected');
      setRejectModal(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActionId(null);
    }
  }

  async function handleComplete(id: string) {
    setActionId(id);
    try {
      await updateAppointment(id, { status: 'completed', completedAt: new Date() });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'completed' } : a));
      toast.success('Marked as completed');
    } catch {
      toast.error('Failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-5">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appointments</h2>

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
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
              {tab.value === 'all' ? appointments.length : appointments.filter((a) => a.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-start gap-4">
                <Avatar name={apt.patientName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{apt.patientName}</h3>
                      <p className="text-xs text-slate-500">{apt.patientPhone}</p>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(apt.scheduledAt)}</span>
                    <span>{formatTime(apt.scheduledAt)}</span>
                    <span className="capitalize">{apt.consultationType}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatPKR(apt.fee)}</span>
                    <StatusBadge status={apt.paymentStatus} />
                  </div>
                  {apt.symptoms && <p className="text-xs text-slate-400 mt-1.5 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg italic">"{apt.symptoms}"</p>}
                  {apt.rejectionReason && <p className="text-xs text-red-500 mt-1">Rejection: {apt.rejectionReason}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex-wrap">
                {apt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleConfirm(apt.id)}
                      disabled={actionId === apt.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors"
                    >
                      {actionId === apt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Confirm
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: apt.id })}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                {apt.status === 'confirmed' && (
                  <button
                    onClick={() => handleComplete(apt.id)}
                    disabled={actionId === apt.id}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    {actionId === apt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Mark Completed
                  </button>
                )}
                {apt.status === 'confirmed' && apt.consultationType === 'video' && (
                  <Link href={`/video-call/${apt.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-colors">
                    <Video className="w-3.5 h-3.5" /> Start Video
                  </Link>
                )}
                {apt.chatRoomId && (
                  <Link href={`/doctor/chat/${apt.chatRoomId}`} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Link>
                )}
                {apt.status === 'completed' && !apt.prescriptionId && (
                  <Link href={`/doctor/prescriptions/new?appointmentId=${apt.id}&patientId=${apt.patientId}&patientName=${apt.patientName}`} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-medium hover:bg-purple-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Write Prescription
                  </Link>
                )}
                {apt.prescriptionId && (
                  <Link href={`/doctor/prescriptions/${apt.prescriptionId}`} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-medium hover:bg-purple-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> View Rx
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Reject Appointment</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-400">Cancel</button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!actionId}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {actionId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
