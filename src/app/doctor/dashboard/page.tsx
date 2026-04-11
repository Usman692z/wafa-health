'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getAppointments, updateAppointment } from '@/lib/firestore';
import { Avatar } from '@/components/ui/Avatar';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatDate, formatTime, formatPKR } from '@/lib/utils';
import {
  Calendar, Clock, Users, DollarSign, Video, MessageSquare,
  Check, X, AlertCircle, ArrowRight, TrendingUp, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Appointment, DoctorProfile } from '@/types';

export default function DoctorDashboard() {
  const { profile } = useAuthStore();
  const doctor = profile as DoctorProfile;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    getAppointments(profile.uid, 'doctor').then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  const pending = appointments.filter((a) => a.status === 'pending');
  const todayApts = appointments.filter((a) => {
    const d = new Date(a.scheduledAt);
    return d.toDateString() === new Date().toDateString() && a.status === 'confirmed';
  });
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const totalEarnings = appointments
    .filter((a) => a.status === 'completed' && a.paymentStatus === 'verified')
    .reduce((sum, a) => sum + (a.fee * 0.9), 0);

  async function handleAction(id: string, status: 'confirmed' | 'rejected', reason?: string) {
    setActionLoading(id);
    try {
      await updateAppointment(id, {
        status,
        rejectionReason: reason,
        updatedAt: new Date(),
      });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      toast.success(status === 'confirmed' ? 'Appointment confirmed!' : 'Appointment rejected');
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Approval Banner */}
      {!doctor?.isApproved && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">Profile Under Review</p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">Your profile is being verified by admin. You&apos;ll be notified once approved and can start accepting patients.</p>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Welcome back, Dr. {profile?.name?.split(' ')[0]} 👋</h2>
        <p className="text-blue-200 text-sm">
          {todayApts.length > 0
            ? `You have ${todayApts.length} appointment${todayApts.length > 1 ? 's' : ''} today.`
            : 'No appointments today. Update your availability schedule.'}
        </p>
        {pending.length > 0 && (
          <p className="text-amber-300 text-sm mt-1 font-medium">⚡ {pending.length} pending request{pending.length > 1 ? 's' : ''} need your attention</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={appointments.filter(a => a.status === 'completed').length} icon={Users} color="blue" />
        <StatCard label="Today's Appointments" value={todayApts.length} icon={Calendar} color="purple" />
        <StatCard label="Completed" value={completed} icon={Check} color="green" />
        <StatCard label="Total Earnings" value={formatPKR(totalEarnings)} icon={DollarSign} color="orange" />
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Pending Requests
              <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-500 text-xs rounded-full font-medium">{pending.length}</span>
            </h3>
          </div>
          <div className="space-y-3">
            {pending.map((apt) => (
              <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-700/50 p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={apt.patientName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{apt.patientName}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(apt.scheduledAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(apt.scheduledAt)}</span>
                      <span className="capitalize">{apt.consultationType} • {formatPKR(apt.fee)}</span>
                    </div>
                    {apt.symptoms && <p className="text-xs text-slate-400 mt-1 italic">"{apt.symptoms}"</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(apt.id, 'rejected')}
                      disabled={!!actionLoading}
                      className="w-9 h-9 rounded-xl border border-red-200 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors"
                    >
                      {actionLoading === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleAction(apt.id, 'confirmed')}
                      disabled={!!actionLoading}
                      className="w-9 h-9 rounded-xl bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-colors"
                    >
                      {actionLoading === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Today&apos;s Schedule</h3>
          <Link href="/doctor/appointments" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
        ) : todayApts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No appointments today</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
            {todayApts.map((apt) => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-4">
                <div className="text-center w-14">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{formatTime(apt.scheduledAt)}</p>
                  <p className="text-xs text-slate-400">{apt.duration}min</p>
                </div>
                <div className="w-px h-10 bg-blue-200 dark:bg-blue-700" />
                <Avatar name={apt.patientName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{apt.patientName}</p>
                  <p className="text-xs text-slate-500 capitalize">{apt.consultationType} consultation</p>
                </div>
                <div className="flex items-center gap-2">
                  {apt.consultationType === 'video' && (
                    <Link href={`/video-call/${apt.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-colors">
                      <Video className="w-3.5 h-3.5" /> Start
                    </Link>
                  )}
                  {apt.chatRoomId && (
                    <Link href={`/doctor/chat/${apt.chatRoomId}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl text-xs font-medium hover:bg-green-100 transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" /> Chat
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
