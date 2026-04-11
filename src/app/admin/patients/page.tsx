'use client';

import { useEffect, useState } from 'react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { updateUserProfile } from '@/lib/firestore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Search, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PatientProfile } from '@/types';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, COLLECTIONS.USERS), where('role', '==', 'patient'));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => {
        const p = d.data();
        return { ...p, uid: d.id, createdAt: p.createdAt?.toDate() || new Date(), updatedAt: p.updatedAt?.toDate() || new Date() } as PatientProfile;
      });
      setPatients(data);
      setLoading(false);
    });
  }, []);

  const filtered = patients.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search)
  );

  async function handleBlock(uid: string, isBlocked: boolean) {
    setActionId(uid);
    try {
      await updateUserProfile(uid, { isBlocked: !isBlocked });
      setPatients((prev) => prev.map((p) => p.uid === uid ? { ...p, isBlocked: !isBlocked } : p));
      toast.success(isBlocked ? 'Patient unblocked' : 'Patient blocked');
    } catch {
      toast.error('Failed');
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Patient Management</h2>
        <span className="text-sm text-slate-500">{patients.length} total patients</span>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patients by name or phone..." className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 rounded-2xl skeleton" />)}</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No patients found</div>
          ) : filtered.map((patient) => (
            <div key={patient.uid} className="flex items-center gap-4 px-5 py-4">
              <Avatar name={patient.name} src={patient.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{patient.name}</p>
                  {patient.isBlocked && <Badge variant="danger">Blocked</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{patient.phone}</span>
                  {patient.city && <span>{patient.city}</span>}
                  <span>Joined {formatDate(patient.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={() => handleBlock(patient.uid, patient.isBlocked)}
                disabled={actionId === patient.uid}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${patient.isBlocked ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-slate-200' : 'bg-orange-50 dark:bg-orange-950/40 text-orange-500 hover:bg-orange-100'}`}
              >
                {actionId === patient.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : patient.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
