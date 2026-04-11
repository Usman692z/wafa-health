'use client';

import { useEffect, useState } from 'react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { updatePayment } from '@/lib/firestore';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatPKR } from '@/lib/utils';
import { Check, X, Eye, Search, Loader2, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Payment, PaymentStatus } from '@/types';

const TABS: { label: string; value: PaymentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
];

export default function AdminPaymentsPage() {
  const { profile } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.PAYMENTS), orderBy('createdAt', 'desc'));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => {
        const p = d.data();
        return {
          ...p,
          id: d.id,
          createdAt: p.createdAt?.toDate() || new Date(),
          updatedAt: p.updatedAt?.toDate() || new Date(),
        } as Payment;
      });
      setPayments(data);
      setLoading(false);
    });
  }, []);

  const filtered = payments.filter((p) => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.appointmentId.includes(search) || p.method.includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  async function handleVerify(id: string) {
    if (!profile?.uid) return;
    setActionId(id);
    try {
      await updatePayment(id, {
        status: 'verified',
        verifiedBy: profile.uid,
        verifiedAt: new Date(),
      });
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'verified' } : p));
      toast.success('Payment verified!');
    } catch {
      toast.error('Failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    setActionId(id);
    try {
      await updatePayment(id, { status: 'rejected' });
      setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'rejected' } : p));
      toast.success('Payment rejected');
    } catch {
      toast.error('Failed');
    } finally {
      setActionId(null);
    }
  }

  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.platformFee, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment Management</h2>
        <div className="flex items-center gap-3 text-sm">
          <div className="px-3 py-1.5 bg-green-50 dark:bg-green-950/40 rounded-xl text-green-600 font-medium">
            Platform Revenue: {formatPKR(totalRevenue)}
          </div>
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 rounded-xl text-red-500 font-medium">
              {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by appointment ID or method..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setFilter(t.value)} className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${filter === t.value ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl skeleton" />)}</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Appointment</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">No payments found</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-4 text-xs text-slate-500 font-mono">{p.appointmentId.slice(0, 12)}...</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatPKR(p.amount)}</p>
                    <p className="text-xs text-green-600">Platform: {formatPKR(p.platformFee)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm capitalize text-slate-700 dark:text-slate-300">{p.method}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{formatDate(p.createdAt)}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {p.screenshotUrl && (
                        <button onClick={() => setViewScreenshot(p.screenshotUrl!)} className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {p.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(p.id)}
                            disabled={actionId === p.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                          >
                            {actionId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Verify
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            disabled={actionId === p.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Screenshot Modal */}
      {viewScreenshot && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewScreenshot(null)}>
          <div className="relative max-w-xl w-full">
            <button onClick={() => setViewScreenshot(null)} className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
            <img src={viewScreenshot} alt="Payment screenshot" className="w-full rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
