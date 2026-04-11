'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getAppointments } from '@/lib/firestore';
import { formatDate, formatTime, formatPKR, getStatusColor } from '@/lib/utils';
import { StatCard } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Calendar, Clock, FileText, MessageSquare, Star, Video,
  ArrowRight, Stethoscope, Search, Bell,
} from 'lucide-react';
import type { Appointment } from '@/types';

export default function PatientDashboard() {
  const { profile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    getAppointments(profile.uid, 'patient').then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  const upcoming = appointments.filter((a) => a.status === 'confirmed' && new Date(a.scheduledAt) > new Date());
  const completed = appointments.filter((a) => a.status === 'completed').length;
  const pending = appointments.filter((a) => a.status === 'pending').length;

  const quickActions = [
    { label: 'Find a Doctor', href: '/patient/doctors', icon: Search, color: 'from-blue-500 to-cyan-500' },
    { label: 'My Appointments', href: '/patient/appointments', icon: Calendar, color: 'from-purple-500 to-violet-500' },
    { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText, color: 'from-green-500 to-emerald-500' },
    { label: 'Messages', href: '/patient/chat', icon: MessageSquare, color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-48 h-full opacity-10">
          <Stethoscope className="w-full h-full" />
        </div>
        <h2 className="text-xl font-bold mb-1">
          Good {getGreeting()}, {profile?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-blue-100 text-sm mb-4">
          {upcoming.length > 0
            ? `You have ${upcoming.length} upcoming appointment${upcoming.length > 1 ? 's' : ''}.`
            : 'No upcoming appointments. Stay healthy!'}
        </p>
        <Link
          href="/patient/doctors"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors"
        >
          Book Consultation <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={appointments.length} icon={Calendar} color="blue" />
        <StatCard label="Completed" value={completed} icon={Star} color="green" />
        <StatCard label="Pending" value={pending} icon={Clock} color="orange" />
        <StatCard label="Prescriptions" value={appointments.filter(a => a.prescriptionId).length} icon={FileText} color="purple" />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all text-center"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Upcoming Appointments</h3>
          <Link href="/patient/appointments" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl skeleton" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No upcoming appointments</p>
            <Link href="/patient/doctors" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-500 hover:underline">
              Find a doctor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Appointments */}
      {appointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Consultations</h3>
            <Link href="/patient/appointments" className="text-sm text-blue-500 hover:underline">View all</Link>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <Avatar name={apt.doctorName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{apt.doctorName}</p>
                    <p className="text-xs text-slate-500 truncate">{apt.doctorSpecialization} • {formatDate(apt.scheduledAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatPKR(apt.fee)}</span>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4 hover:shadow-sm transition-all">
      <Avatar name={appointment.doctorName} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 dark:text-white text-sm">{appointment.doctorName}</p>
        <p className="text-xs text-slate-500">{appointment.doctorSpecialization}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" /> {formatDate(appointment.scheduledAt)}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" /> {formatTime(appointment.scheduledAt)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={appointment.status} />
        {appointment.consultationType === 'video' && appointment.status === 'confirmed' && (
          <Link
            href={`/video-call/${appointment.id}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-medium hover:bg-blue-600 transition-colors"
          >
            <Video className="w-3 h-3" /> Join
          </Link>
        )}
        {appointment.chatRoomId && (
          <Link
            href={`/patient/chat/${appointment.chatRoomId}`}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 transition-colors"
          >
            <MessageSquare className="w-3 h-3" /> Chat
          </Link>
        )}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
