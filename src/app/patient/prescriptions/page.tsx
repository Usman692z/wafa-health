'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getPatientPrescriptions } from '@/lib/firestore';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import type { Prescription } from '@/types';

export default function PatientPrescriptionsPage() {
  const { profile } = useAuthStore();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    getPatientPrescriptions(profile.uid).then((data) => {
      setPrescriptions(data);
      setLoading(false);
    });
  }, [profile?.uid]);

  return (
    <div className="max-w-4xl space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Prescriptions</h2>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}</div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No prescriptions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Dr. {p.doctorName}</h3>
                    <p className="text-xs text-blue-500">{p.doctorSpecialization}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(p.createdAt)}</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">Diagnosis: {p.diagnosis}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.medicines.length} medicine{p.medicines.length !== 1 ? 's' : ''} prescribed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/patient/prescriptions/${p.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-medium hover:bg-purple-100 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                  {p.pdfUrl && (
                    <a
                      href={p.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
