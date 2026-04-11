'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Heart,
  Video,
  MessageSquare,
  Shield,
  Clock,
  Smartphone,
  ChevronRight,
  Stethoscope,
  Users,
  Award,
  Activity,
} from 'lucide-react';

const specializations = [
  { name: 'General Physician', icon: '👨‍⚕️', color: 'from-blue-500 to-cyan-500' },
  { name: 'Cardiologist', icon: '❤️', color: 'from-red-500 to-pink-500' },
  { name: 'Dermatologist', icon: '🧬', color: 'from-purple-500 to-violet-500' },
  { name: 'Pediatrician', icon: '👶', color: 'from-green-500 to-emerald-500' },
  { name: 'Gynecologist', icon: '🌸', color: 'from-pink-500 to-rose-500' },
  { name: 'Neurologist', icon: '🧠', color: 'from-indigo-500 to-blue-500' },
  { name: 'Orthopedic', icon: '🦴', color: 'from-orange-500 to-amber-500' },
  { name: 'Psychiatrist', icon: '🧘', color: 'from-teal-500 to-cyan-500' },
];

const stats = [
  { label: 'Verified Doctors', value: '500+', icon: Stethoscope },
  { label: 'Happy Patients', value: '50K+', icon: Users },
  { label: 'Consultations', value: '200K+', icon: Activity },
  { label: 'Cities Covered', value: '100+', icon: Award },
];

const features = [
  {
    icon: Video,
    title: 'Video Consultation',
    desc: 'HD video calls optimized for low-bandwidth connections across Pakistan.',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: MessageSquare,
    title: 'Instant Chat',
    desc: 'Message your doctor anytime. Get answers without waiting.',
    color: 'text-green-500 bg-green-50 dark:bg-green-950',
  },
  {
    icon: Shield,
    title: 'PMDC Verified',
    desc: 'All doctors are verified with PMDC/PMC registration numbers.',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  },
  {
    icon: Smartphone,
    title: 'JazzCash & Easypaisa',
    desc: 'Pay securely with your preferred local mobile wallet.',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    desc: 'Book appointments anytime. Instant consultations available.',
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950',
  },
  {
    icon: Heart,
    title: 'E-Prescriptions',
    desc: 'Get digital prescriptions you can download and share with pharmacies.',
    color: 'text-red-500 bg-red-50 dark:bg-red-950',
  },
];

export default function HomePage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile) {
      router.push(`/${profile.role}/dashboard`);
    }
  }, [profile, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                medi<span className="text-blue-500">GO</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500">Features</a>
              <a href="#specializations" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500">Specializations</a>
              <Link href="/register?role=doctor" className="text-sm text-slate-600 dark:text-slate-300 hover:text-blue-500">For Doctors</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl">Login</Link>
              <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl shadow-md">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-200/30 dark:bg-cyan-900/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            All doctors PMDC/PMC verified
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
            Your Health,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">One Tap Away</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10">
            Pakistan&apos;s most trusted telemedicine platform. Consult top doctors via video or chat. Pay with JazzCash or Easypaisa. Get e-prescriptions in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl hover:from-blue-600 hover:to-cyan-600 shadow-lg">
              Book a Doctor Now <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/register?role=doctor" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-2xl hover:border-blue-400 shadow-sm">
              <Stethoscope className="w-5 h-5" /> Join as Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-sm border border-slate-100 dark:border-slate-700">
              <stat.icon className="w-6 h-6 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Specializations */}
      <section id="specializations" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">Find a Doctor by Specialization</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10">Browse 30+ medical specializations</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {specializations.map((s) => (
            <Link key={s.name} href={`/register`} className="group bg-white dark:bg-slate-800 rounded-2xl p-5 text-center border border-slate-100 dark:border-slate-700 hover:border-blue-300 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform`}>{s.icon}</div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">Why Choose mediGO?</h2>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-12">Built for Pakistan. Optimized for every internet condition.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl p-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Health Journey Today</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">Join 50,000+ patients who trust mediGO for their medical needs.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:bg-blue-50 shadow-lg">
            Create Free Account <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <span className="text-white font-bold">mediGO</span>
            </div>
            <p className="text-sm">© 2024 mediGO. All rights reserved. | Pakistan</p>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
