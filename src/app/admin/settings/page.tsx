'use client';

import { useState } from 'react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { Save, Loader2, Shield, DollarSign, Bell, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { createDoctorAccount } from '@/lib/auth';
import { createUserProfile } from '@/lib/firestore';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function AdminSettingsPage() {
  const { profile } = useAuthStore();
  const [commission, setCommission] = useState(10);
  const [minFee, setMinFee] = useState(200);
  const [saving, setSaving] = useState(false);

  // Create Admin
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  async function handleCreateAdmin() {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      toast.error('Fill in all fields.');
      return;
    }
    if (adminForm.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setCreatingAdmin(true);
    try {
      const uid = await createDoctorAccount(adminForm.email, adminForm.password);
      await createUserProfile({
        uid,
        name: adminForm.name,
        email: adminForm.email,
        phone: '',
        role: 'admin',
        isBlocked: false,
        preferredLanguage: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
      toast.success(`Admin account created for ${adminForm.email}`);
      setAdminForm({ name: '', email: '', password: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        toast.error('An account with this email already exists.');
      } else {
        toast.error('Failed to create admin account.');
      }
    } finally {
      setCreatingAdmin(false);
    }
  }

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

      {/* Create Admin */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-purple-500" /> Create Admin Account
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
            <input value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin Name" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
            <input value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="admin@example.com" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))} type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleCreateAdmin}
          disabled={creatingAdmin}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-2xl text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {creatingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Create Admin
        </button>
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
