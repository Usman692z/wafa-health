'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getDoctors, approveDoctor, rejectDoctor, updateUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatPKR } from '@/lib/utils';
import { Search, Check, X, Eye, Shield, MapPin, Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DoctorProfile } from '@/types';

function AdminDoctorsPageInner() {
  const { profile } = useAuthStore();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDoctor, setViewDoctor] = useState<DoctorProfile | null>(null);

  useEffect(() => {
    getDoctors().then((data) => {
      setDoctors(data);
      setLoading(false);
    });
  }, []);

  const filtered = doctors.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase()) ||
      d.pmdcNumber.toLowerCase().includes(search.toLowerCase());
    if (filter === 'pending') return matchSearch && !d.isApproved;
    if (filter === 'approved') return matchSearch && d.isApproved;
    if (filter === 'blocked') return matchSearch && d.isBlocked;
    return matchSearch;
  });

  async function handleApprove(uid: string) {
    if (!profile?.uid) return;
    setActionId(uid);
    try {
      await approveDoctor(uid, profile.uid);
      setDoctors((prev) => prev.map((d) => d.uid === uid ? { ...d, isApproved: true } : d));
      toast.success('Doctor approved!');
    } catch {
      toast.error('Failed to approve');
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(uid: string) {
    if (!rejectReason.trim()) return;
    setActionId(uid);
    try {
      await rejectDoctor(uid, rejectReason);
      setDoctors((prev) => prev.map((d) => d.uid === uid ? { ...d, isApproved: false } : d));
      toast.success('Doctor rejected');
      setRejectModal(null);
      setRejectReason('');
    } catch {
      toast.error('Failed');
    } finally {
      setActionId(null);
    }
  }

  async function handleBlock(uid: string, isBlocked: boolean) {
    setActionId(uid);
    try {
      await updateUserProfile(uid, { isBlocked: !isBlocked });
      setDoctors((prev) => prev.map((d) => d.uid === uid ? { ...d, isBlocked: !isBlocked } : d));
      toast.success(isBlocked ? 'Doctor unblocked' : 'Doctor blocked');
    } catch {
      toast.error('Failed');
    } finally {
      setActionId(null);
    }
  }

  const tabs = [
    { value: 'all', label: 'All', count: doctors.length },
    { value: 'pending', label: 'Pending', count: doctors.filter(d => !d.isApproved).length },
    { value: 'approved', label: 'Approved', count: doctors.filter(d => d.isApproved).length },
    { value: 'blocked', label: 'Blocked', count: doctors.filter(d => d.isBlocked).length },
  ];

  return (
    <div className="max-w-6xl space-y-5">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Doctor Management</h2>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors ${filter === t.value ? 'bg-blue-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-slate-400">
          No doctors found
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.map((doc) => (
            <div key={doc.uid} className="flex items-center gap-4 px-5 py-4">
              <Avatar name={doc.name} src={doc.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Dr. {doc.name}</h3>
                  {doc.isApproved ? <Badge variant="success">Approved</Badge> : <Badge variant="warning">Pending</Badge>}
                  {doc.isBlocked && <Badge variant="danger">Blocked</Badge>}
                </div>
                <p className="text-xs text-blue-500">{doc.specialization}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {doc.pmdcNumber}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {doc.city}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {doc.rating?.toFixed(1) || '0.0'}</span>
                  <span>{formatPKR(doc.consultationFee)}/consult</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewDoctor(doc)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {!doc.isApproved && (
                  <button
                    onClick={() => handleApprove(doc.uid)}
                    disabled={actionId === doc.uid}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {actionId === doc.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
                  </button>
                )}
                {!doc.isApproved && (
                  <button
                    onClick={() => setRejectModal({ id: doc.uid })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                )}
                <button
                  onClick={() => handleBlock(doc.uid, doc.isBlocked)}
                  disabled={actionId === doc.uid}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${doc.isBlocked ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-500 hover:bg-orange-100'}`}
                >
                  {doc.isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Doctor Detail Modal */}
      {viewDoctor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Doctor Profile</h3>
              <button onClick={() => setViewDoctor(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-start gap-4 mb-4">
              <Avatar name={viewDoctor.name} src={viewDoctor.avatar} size="lg" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Dr. {viewDoctor.name}</h4>
                <p className="text-blue-500 text-sm">{viewDoctor.specialization}</p>
                <p className="text-xs text-slate-500">PMDC: {viewDoctor.pmdcNumber}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Phone', value: viewDoctor.phone },
                { label: 'City', value: viewDoctor.city },
                { label: 'Experience', value: `${viewDoctor.experience} years` },
                { label: 'Fee', value: formatPKR(viewDoctor.consultationFee) },
                { label: 'Qualifications', value: viewDoctor.qualifications?.join(', ') },
                { label: 'Rating', value: `${viewDoctor.rating?.toFixed(1)} (${viewDoctor.totalReviews} reviews)` },
                { label: 'Total Consultations', value: viewDoctor.totalConsultations },
                { label: 'Registered', value: formatDate(viewDoctor.createdAt) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-900 dark:text-white font-medium">{item.value || 'N/A'}</span>
                </div>
              ))}
            </div>
            {viewDoctor.about && (
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">About</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{viewDoctor.about}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Reject Doctor Application</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600">Cancel</button>
              <button
                onClick={() => handleReject(rejectModal.id)}
                disabled={!rejectReason.trim() || !!actionId}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {actionId ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDoctorsPage() { return <Suspense><AdminDoctorsPageInner /></Suspense>; }
