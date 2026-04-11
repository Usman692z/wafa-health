'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Heart, Phone, User, Stethoscope, Loader2, Shield, Upload, ArrowRight } from 'lucide-react';
import { sendOTP, verifyOTP, getOrCreateProfile } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { formatPhonePK, isValidPKPhone } from '@/lib/utils';

const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician',
  'Gynecologist / Obstetrician', 'Neurologist', 'Orthopedic Surgeon', 'Psychiatrist',
  'ENT Specialist', 'Ophthalmologist', 'Urologist', 'Gastroenterologist',
  'Pulmonologist', 'Endocrinologist', 'Nephrologist', 'Oncologist',
  'Rheumatologist', 'Hematologist', 'Infectious Disease', 'Radiologist',
  'Anesthesiologist', 'Plastic Surgeon', 'Vascular Surgeon', 'Dentist',
  'Nutritionist / Dietitian', 'Physiotherapist', 'Sexologist', 'Homeopathic',
];

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Bahawalpur', 'Abbottabad', 'Other'];

const patientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().refine(isValidPKPhone, 'Invalid Pakistani number'),
  city: z.string().min(1, 'Select your city'),
  gender: z.enum(['male', 'female', 'other']),
  otp: z.string().length(6, '6-digit OTP required').optional(),
});

const doctorSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().refine(isValidPKPhone, 'Invalid Pakistani number'),
  pmdcNumber: z.string().min(4, 'PMDC/PMC number required'),
  specialization: z.string().min(1, 'Select specialization'),
  experience: z.string().transform(v => Number(v)),
  consultationFee: z.string().transform(v => Number(v)),
  city: z.string().min(1, 'Select your city'),
  qualifications: z.string().min(2, 'Add qualifications e.g. MBBS, MD'),
  about: z.string().max(500).optional(),
  otp: z.string().length(6, '6-digit OTP required').optional(),
});

type PatientForm = z.infer<typeof patientSchema>;
type DoctorForm = z.infer<typeof doctorSchema>;

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as 'patient' | 'doctor') || 'patient';

  const [role, setRole] = useState<'patient' | 'doctor'>(defaultRole);
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PatientForm & DoctorForm>>({});
  const [resendTimer, setResendTimer] = useState(0);

  const { setFirebaseUser, setProfile } = useAuthStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patientForm = useForm<PatientForm>({ resolver: zodResolver(patientSchema) as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctorForm = useForm<DoctorForm>({ resolver: zodResolver(doctorSchema) as any });

  const form = role === 'patient' ? patientForm : doctorForm;

  async function handleInfoSubmit(data: PatientForm | DoctorForm) {
    setLoading(true);
    try {
      const formatted = formatPhonePK(data.phone);
      await sendOTP(formatted);
      setFormData({ ...data, phone: formatted });
      setStep('otp');
      setResendTimer(60);
      toast.success('OTP sent to your number!');
    } catch (err: unknown) {
      toast.error('Failed to send OTP. Check the phone number.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPSubmit(otp: string) {
    setLoading(true);
    try {
      const user = await verifyOTP(otp);
      const additionalData: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
      };

      if (role === 'patient') {
        additionalData.city = (formData as PatientForm).city;
        additionalData.gender = (formData as PatientForm).gender;
      } else {
        const d = formData as DoctorForm;
        additionalData.pmdcNumber = d.pmdcNumber;
        additionalData.specialization = d.specialization;
        additionalData.experience = d.experience;
        additionalData.consultationFee = d.consultationFee;
        additionalData.city = d.city;
        additionalData.qualifications = d.qualifications.split(',').map((q) => q.trim());
        additionalData.about = d.about || '';
        additionalData.isApproved = false;
        additionalData.isOnline = false;
        additionalData.rating = 0;
        additionalData.totalReviews = 0;
        additionalData.totalConsultations = 0;
        additionalData.earnings = 0;
        additionalData.availability = [];
        additionalData.languages = ['Urdu', 'English'];
      }

      const profile = await getOrCreateProfile(user, role, additionalData as never);
      setFirebaseUser(user);
      setProfile(profile);

      if (role === 'doctor') {
        toast.success('Registration successful! Your profile is under review by admin.', { duration: 5000 });
        router.push('/doctor/dashboard');
      } else {
        toast.success(`Welcome to Wafa Health, ${profile.name}!`);
        router.push('/patient/dashboard');
      }
    } catch (err: unknown) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const [otpValue, setOtpValue] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div id="recaptcha-container" />

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Wafa<span className="text-blue-500">Health</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {step === 'info' ? 'Create your account' : 'Verify your number'}
          </h1>
        </div>

        {/* Role Switcher */}
        {step === 'info' && (
          <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-6">
            <button
              onClick={() => setRole('patient')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${role === 'patient' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User className="w-4 h-4" /> Patient
            </button>
            <button
              onClick={() => setRole('doctor')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${role === 'doctor' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Stethoscope className="w-4 h-4" /> Doctor
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          {step === 'info' ? (
            role === 'patient' ? (
              <form onSubmit={patientForm.handleSubmit(handleInfoSubmit)} className="space-y-4">
                <Field label="Full Name" error={patientForm.formState.errors.name?.message}>
                  <input {...patientForm.register('name')} placeholder="e.g. Ahmed Ali" className={inputClass} />
                </Field>
                <Field label="Mobile Number" error={patientForm.formState.errors.phone?.message}>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 text-sm">
                      🇵🇰 +92 <span className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                    </div>
                    <input {...patientForm.register('phone')} type="tel" placeholder="3XX XXXXXXX" className={`${inputClass} pl-20`} />
                  </div>
                </Field>
                <Field label="City" error={patientForm.formState.errors.city?.message}>
                  <select {...patientForm.register('city')} className={inputClass}>
                    <option value="">Select City</option>
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Gender" error={patientForm.formState.errors.gender?.message}>
                  <select {...patientForm.register('gender')} className={inputClass}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <SubmitBtn loading={loading} label="Send OTP & Continue" />
              </form>
            ) : (
              <form onSubmit={doctorForm.handleSubmit(handleInfoSubmit as never)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Full Name" error={doctorForm.formState.errors.name?.message} className="col-span-2">
                    <input {...doctorForm.register('name')} placeholder="Dr. Ahmed Ali" className={inputClass} />
                  </Field>
                  <Field label="Mobile Number" error={doctorForm.formState.errors.phone?.message} className="col-span-2">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500 text-sm">
                        🇵🇰 +92 <span className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                      </div>
                      <input {...doctorForm.register('phone')} type="tel" placeholder="3XX XXXXXXX" className={`${inputClass} pl-20`} />
                    </div>
                  </Field>
                  <Field label="PMDC/PMC Number" error={doctorForm.formState.errors.pmdcNumber?.message}>
                    <input {...doctorForm.register('pmdcNumber')} placeholder="e.g. 12345-P" className={inputClass} />
                  </Field>
                  <Field label="Experience (Years)" error={doctorForm.formState.errors.experience?.message}>
                    <input {...doctorForm.register('experience')} type="number" placeholder="5" className={inputClass} />
                  </Field>
                  <Field label="Specialization" error={doctorForm.formState.errors.specialization?.message}>
                    <select {...doctorForm.register('specialization')} className={inputClass}>
                      <option value="">Select</option>
                      {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Consultation Fee (PKR)" error={doctorForm.formState.errors.consultationFee?.message}>
                    <input {...doctorForm.register('consultationFee')} type="number" placeholder="500" className={inputClass} />
                  </Field>
                  <Field label="City" error={doctorForm.formState.errors.city?.message}>
                    <select {...doctorForm.register('city')} className={inputClass}>
                      <option value="">Select City</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Qualifications" error={doctorForm.formState.errors.qualifications?.message}>
                    <input {...doctorForm.register('qualifications')} placeholder="MBBS, FCPS" className={inputClass} />
                  </Field>
                  <Field label="About (Optional)" className="col-span-2">
                    <textarea {...doctorForm.register('about')} placeholder="Brief description..." rows={2} className={`${inputClass} resize-none`} />
                  </Field>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  Your PMDC/PMC number will be verified. Profile requires admin approval before going live.
                </div>
                <SubmitBtn loading={loading} label="Send OTP & Continue" />
              </form>
            )
          ) : (
            <div className="space-y-5">
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                OTP sent to <strong className="text-slate-900 dark:text-white">{formData.phone}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter 6-digit OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  placeholder="● ● ● ● ● ●"
                  className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => handleOTPSubmit(otpValue)}
                disabled={loading || otpValue.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 shadow-lg"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Registration <ArrowRight className="w-5 h-5" /></>}
              </button>
              <button onClick={() => setStep('info')} className="w-full text-center text-sm text-slate-500 hover:text-blue-500">
                ← Go back
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

function Field({ label, error, children, className = '' }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 shadow-lg mt-2"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{label} <ArrowRight className="w-5 h-5" /></>}
    </button>
  );
}

export default function RegisterPage() { return <Suspense><RegisterPageInner /></Suspense>; }
