'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Heart, Phone, ArrowRight, Loader2, Shield } from 'lucide-react';
import { sendOTP, verifyOTP } from '@/lib/auth';
import { getUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { formatPhonePK, isValidPKPhone } from '@/lib/utils';

const phoneSchema = z.object({
  phone: z.string().min(10, 'Enter a valid Pakistani phone number').refine(isValidPKPhone, 'Invalid Pakistan number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numbers only'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type OtpForm = z.infer<typeof otpSchema>;

function LoginPageInner() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { setFirebaseUser, setProfile } = useAuthStore();

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  // Countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  async function handleSendOTP(data: PhoneForm) {
    setLoading(true);
    try {
      const formatted = formatPhonePK(data.phone);
      await sendOTP(formatted);
      setPhone(formatted);
      setStep('otp');
      setResendTimer(60);
      toast.success('OTP sent successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP';
      toast.error(msg.includes('too-many-requests') ? 'Too many attempts. Try again later.' : 'Failed to send OTP. Check the number.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(data: OtpForm) {
    setLoading(true);
    try {
      const user = await verifyOTP(data.otp);
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        toast.error('Account not found. Please register first.');
        router.push('/register');
        return;
      }
      if (profile.isBlocked) {
        toast.error('Your account has been blocked. Contact support.');
        return;
      }
      setFirebaseUser(user);
      setProfile(profile);
      toast.success(`Welcome back, ${profile.name}!`);
      router.push(`/${profile.role}/dashboard`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP';
      toast.error(msg.includes('invalid') ? 'Invalid OTP. Please try again.' : 'OTP expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await sendOTP(phone);
      setResendTimer(60);
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div id="recaptcha-container" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">medi<span className="text-blue-500">GO</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {step === 'phone' ? 'Login to your account' : 'Verify your number'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {step === 'phone'
              ? 'Enter your Pakistani mobile number to receive OTP'
              : `We sent a 6-digit code to ${phone}`}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-8">
          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-500">
                    <span className="text-lg">🇵🇰</span>
                    <span className="text-sm font-medium">+92</span>
                    <span className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <input
                    {...phoneForm.register('phone')}
                    type="tel"
                    placeholder="3XX XXXXXXX"
                    className="w-full pl-20 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                </div>
                {phoneForm.formState.errors.phone && (
                  <p className="mt-1.5 text-xs text-red-500">{phoneForm.formState.errors.phone.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200 dark:shadow-none transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Phone className="w-5 h-5" /> Send OTP</>}
              </button>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs">
                <Shield className="w-4 h-4 shrink-0" />
                Your number is safe. We never share it with anyone.
              </div>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter 6-digit OTP</label>
                <input
                  {...otpForm.register('otp')}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="● ● ● ● ● ●"
                  className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold tracking-[0.5em]"
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1.5 text-xs text-red-500 text-center">{otpForm.formState.errors.otp.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-2xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-60 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Login <ArrowRight className="w-5 h-5" /></>}
              </button>

              <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                Didn&apos;t receive OTP?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || loading}
                  className="text-blue-500 font-medium hover:underline disabled:text-slate-400 disabled:no-underline"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-sm text-slate-500 hover:text-blue-500"
              >
                ← Change number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-500 font-medium hover:underline">Register now</Link>
        </p>
        <p className="text-center text-sm text-slate-400 mt-2">
          Are you an admin?{' '}
          <Link href="/admin/login" className="text-slate-500 hover:text-blue-500">Admin login</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense><LoginPageInner /></Suspense>; }
