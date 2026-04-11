'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Avatar } from '@/components/ui/Avatar';
import { Save, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PatientProfile } from '@/types';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function PatientProfilePage() {
  const { profile, setProfile } = useAuthStore();
  const patient = profile as PatientProfile;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: '', bloodGroup: '', city: '', address: '' });

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || '',
        dateOfBirth: patient.dateOfBirth || '',
        gender: patient.gender || '',
        bloodGroup: patient.bloodGroup || '',
        city: patient.city || '',
        address: patient.address || '',
      });
    }
  }, [profile]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.uid) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${profile.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile(profile.uid, { avatar: url });
      setProfile({ ...profile, avatar: url });
      toast.success('Photo updated!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  }

  async function handleSave() {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, form);
      setProfile({ ...profile, ...form } as typeof profile);
      toast.success('Profile updated!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Profile</h2>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            <Avatar name={patient?.name || ''} src={patient?.avatar} size="xl" />
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600">
              {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{patient?.name}</p>
            <p className="text-sm text-slate-500">{patient?.phone}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Gender</label>
            <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className={inputClass}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Blood Group</label>
            <select value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})} className={inputClass}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">City</label>
            <select value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={inputClass}>
              <option value="">Select</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Address</label>
            <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Street, Area" className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
