'use client';

import { useState } from 'react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { Save, Loader2, Shield, DollarSign, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function AdminSettingsPage() {
  const { profile } = useAuthStore();
  const [commission, setCommission] = useState(10);
  const [minFee, setMinFee] = useState(200);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'commission'), {
        percentage: commission,
        minFee,
        updatedAt: serverTimestamp(),
        updatedBy: profile.uid,
      });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Settings</h2>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-500" /> Commission Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Platform Commission (%)</label>
            <input type="number" min={0} max={50} value={commission} onChange={(e) => setCommission(Number(e.target.value))} className={inputClass} />
            <p className="text-xs text-slate-400 mt-1">Doctor receives {100 - commission}% of fee</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Minimum Fee (PKR)</label>
            <input type="number" min={100} value={minFee} onChange={(e) => setMinFee(Number(e.target.value))} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-500" /> PMDC Verification
        </h3>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Manual PMDC Verification</p>
            <p className="text-xs text-slate-500">Admin reviews PMDC numbers before approval</p>
          </div>
          <div className="w-10 h-5 rounded-full bg-blue-500 relative cursor-pointer">
            <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" /> Notification Settings
        </h3>
        <div className="space-y-3">
          {[
            { label: 'New Doctor Registration', desc: 'Notify admin when new doctor registers' },
            { label: 'Payment Pending Alert', desc: 'Alert for manual payments awaiting verification' },
            { label: 'System Health Reports', desc: 'Weekly platform analytics email' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <div className="w-10 h-5 rounded-full bg-blue-500 relative cursor-pointer">
                <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
