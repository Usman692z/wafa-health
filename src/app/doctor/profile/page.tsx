'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateUserProfile } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Avatar } from '@/components/ui/Avatar';
import { Plus, Trash2, Save, Loader2, Camera, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DoctorProfile, AvailabilitySlot } from '@/types';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

const DAYS: AvailabilitySlot['day'][] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function DoctorProfilePage() {
  const { profile, setProfile } = useAuthStore();
  const doctor = profile as DoctorProfile;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    about: '',
    consultationFee: 0,
    experience: 0,
    city: '',
    hospital: '',
    languages: [] as string[],
    availability: [] as AvailabilitySlot[],
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name || '',
        about: doctor.about || '',
        consultationFee: doctor.consultationFee || 0,
        experience: doctor.experience || 0,
        city: doctor.city || '',
        hospital: doctor.hospital || '',
        languages: doctor.languages || ['Urdu', 'English'],
        availability: doctor.availability || [],
      });
    }
  }, [profile]);

  function updateAvailability(day: AvailabilitySlot['day'], field: keyof AvailabilitySlot, value: unknown) {
    const existing = form.availability.find((a) => a.day === day);
    if (existing) {
      setForm((f) => ({
        ...f,
        availability: f.availability.map((a) => a.day === day ? { ...a, [field]: value } : a),
      }));
    } else {
      setForm((f) => ({
        ...f,
        availability: [...f.availability, {
          day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          isActive: true,
          [field]: value,
        }],
      }));
    }
  }

  function toggleDay(day: AvailabilitySlot['day']) {
    const existing = form.availability.find((a) => a.day === day);
    if (existing) {
      setForm((f) => ({
        ...f,
        availability: f.availability.map((a) => a.day === day ? { ...a, isActive: !a.isActive } : a),
      }));
    } else {
      setForm((f) => ({
        ...f,
        availability: [...f.availability, { day, startTime: '09:00', endTime: '17:00', slotDuration: 30, isActive: true }],
      }));
    }
  }

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
      toast.success('Profile photo updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!profile?.uid) return;
    setSaving(true);
    try {
      await updateUserProfile(profile.uid, form);
      setProfile({ ...profile, ...form });
      toast.success('Profile updated!');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Profile</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Photo */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={doctor?.name || ''} src={doctor?.avatar} size="xl" />
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
              {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Dr. {doctor?.name}</p>
            <p className="text-sm text-blue-500">{doctor?.specialization}</p>
            <p className="text-xs text-slate-500 mt-0.5">PMDC: {doctor?.pmdcNumber}</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Consultation Fee (PKR)</label>
            <input type="number" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Experience (Years)</label>
            <input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Hospital / Clinic</label>
            <input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="Optional" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">About</label>
            <textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} placeholder="Tell patients about yourself..." className={`${inputClass} resize-none`} />
          </div>
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" /> Availability Schedule
        </h3>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const slot = form.availability.find((a) => a.day === day);
            const isActive = slot?.isActive || false;
            return (
              <div key={day} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isActive ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-600'}`}>
                <button
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${isActive ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-24 capitalize">{day}</span>
                {isActive && (
                  <>
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={slot?.startTime || '09:00'}
                        onChange={(e) => updateAvailability(day, 'startTime', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="time"
                        value={slot?.endTime || '17:00'}
                        onChange={(e) => updateAvailability(day, 'endTime', e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={slot?.slotDuration || 30}
                      onChange={(e) => updateAvailability(day, 'slotDuration', Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
