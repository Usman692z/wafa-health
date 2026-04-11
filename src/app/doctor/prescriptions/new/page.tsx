'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createPrescription, updateAppointment } from '@/lib/firestore';
import { generatePrescriptionPDF } from '@/lib/pdf';
import { Plus, Trash2, Loader2, Download, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Medicine, DoctorProfile } from '@/types';

const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function NewPrescriptionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuthStore();
  const doctor = profile as DoctorProfile;

  const appointmentId = searchParams.get('appointmentId') || '';
  const patientId = searchParams.get('patientId') || '';
  const patientName = searchParams.get('patientName') || '';

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [tests, setTests] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function addMedicine() {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  }

  function removeMedicine(i: number) {
    setMedicines(medicines.filter((_, idx) => idx !== i));
  }

  function updateMedicine(i: number, field: keyof Medicine, value: string) {
    setMedicines(medicines.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  async function handleSubmit() {
    if (!diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
    if (medicines.some(m => !m.name || !m.dosage || !m.frequency || !m.duration)) {
      toast.error('Fill all medicine fields');
      return;
    }
    if (!profile?.uid) return;

    setSubmitting(true);
    try {
      const prescriptionId = await createPrescription({
        appointmentId,
        patientId,
        patientName,
        doctorId: profile.uid,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorPmdcNumber: doctor.pmdcNumber,
        diagnosis,
        medicines,
        tests: tests ? tests.split('\n').map(t => t.trim()).filter(Boolean) : [],
        advice,
        followUpDate,
      });

      if (appointmentId) {
        await updateAppointment(appointmentId, { prescriptionId });
      }

      // Generate PDF
      await generatePrescriptionPDF({
        id: prescriptionId,
        patientName,
        patientId,
        doctorId: profile.uid,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        doctorPmdcNumber: doctor.pmdcNumber,
        diagnosis,
        medicines,
        tests: tests ? tests.split('\n').map(t => t.trim()).filter(Boolean) : [],
        advice,
        followUpDate,
        createdAt: new Date(),
        appointmentId,
      });

      toast.success('Prescription created and PDF generated!');
      router.push('/doctor/prescriptions');
    } catch (err) {
      toast.error('Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Prescription</h2>
        <div className="text-sm text-slate-500">Patient: <strong className="text-slate-900 dark:text-white">{patientName}</strong></div>
      </div>

      {/* Doctor Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg font-bold">Rx</div>
        <div>
          <p className="font-semibold text-blue-800 dark:text-blue-400 text-sm">Dr. {doctor?.name}</p>
          <p className="text-xs text-blue-600 dark:text-blue-500">{doctor?.specialization} • PMDC: {doctor?.pmdcNumber}</p>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Diagnosis *</h3>
        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="Enter diagnosis / chief complaint..."
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Medicines */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Medicines *</h3>
          <button onClick={addMedicine} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-medium hover:bg-blue-100">
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </button>
        </div>
        <div className="space-y-4">
          {medicines.map((med, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3 relative">
              {medicines.length > 1 && (
                <button onClick={() => removeMedicine(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Medicine Name *</label>
                  <input value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} placeholder="e.g. Paracetamol 500mg" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Dosage *</label>
                  <input value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} placeholder="e.g. 1 tablet" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Frequency *</label>
                  <select value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} className={inputClass}>
                    <option value="">Select</option>
                    <option>Once daily</option>
                    <option>Twice daily (BD)</option>
                    <option>Three times daily (TDS)</option>
                    <option>Four times daily (QID)</option>
                    <option>At night (HS)</option>
                    <option>As needed (SOS)</option>
                    <option>Every 8 hours</option>
                    <option>Every 12 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Duration *</label>
                  <input value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} placeholder="e.g. 5 days" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Instructions</label>
                  <input value={med.instructions || ''} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} placeholder="e.g. After meals" className={inputClass} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tests & Advice */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Recommended Tests (one per line)</label>
          <textarea value={tests} onChange={(e) => setTests(e.target.value)} placeholder="CBC&#10;Urine R/E&#10;Blood Sugar" rows={3} className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Doctor&apos;s Advice</label>
          <textarea value={advice} onChange={(e) => setAdvice(e.target.value)} placeholder="Rest, drink plenty of water, avoid spicy food..." rows={2} className={`${inputClass} resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Follow-up Date</label>
          <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={inputClass} min={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 py-3 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl text-sm font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 shadow-lg"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save & Generate PDF</>}
        </button>
      </div>
    </div>
  );
}

export default function NewPrescriptionPage() { return <Suspense><NewPrescriptionPageInner /></Suspense>; }
