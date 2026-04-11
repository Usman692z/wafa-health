'use client';

import { useEffect, useState } from 'react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { updateAppointment } from '@/lib/firestore';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatTime, formatPKR } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Appointment, AppointmentStatus } from '@/types';

const TABS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' }, { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' }, { label: 'Completed', value: 'completed' },
  { label: 'Rejected', value: 'rejected' }, { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.APPOINTMENTS), orderBy('scheduledAt', 'desc'));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => {
        const a = d.data();
        return { ...a, id: d.id, scheduledAt: a.scheduledAt?.toDate() || new Date(), createdAt: a.createdAt?.toDate() || new Date(), updatedAt: a.updatedAt?.toDate() || new Date() } as Appointment;
      });
      setAppointments(data);
      setLoading(false);
    });
  }, []);

  const filtered = appointments.filter((a) => {
    const matchFilter = filter === 'all' || a.status === filter;
    const matchSearch = !search ||
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Appointments</h2>
        <span className="text-sm text-slate-500">{appointments.length} total</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient or doctor..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === t.value ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`}>
              {t.label} ({t.value === 'all' ? appointments.length : appointments.filter(a => a.status === t.value).length})
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                {['Patient', 'Doctor', 'Date & Time', 'Type', 'Fee', 'Payment', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">No appointments found</td></tr>
              ) : filtered.map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={apt.patientName} size="xs" />
                      <span className="text-xs font-medium text-slate-900 dark:text-white">{apt.patientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">Dr. {apt.doctorName}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div>{formatDate(apt.scheduledAt)}</div>
                    <div>{formatTime(apt.scheduledAt)}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 capitalize">{apt.consultationType}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-900 dark:text-white">{formatPKR(apt.fee)}</td>
                  <td className="px-4 py-3"><StatusBadge status={apt.paymentStatus} /></td>
                  <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
