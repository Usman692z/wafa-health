'use client';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { useRequireAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Calendar, Users, FileText, MessageSquare, User, DollarSign, Settings, Loader2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { label: 'Patients', href: '/doctor/patients', icon: Users },
  { label: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
  { label: 'Messages', href: '/doctor/chat', icon: MessageSquare },
  { label: 'Earnings', href: '/doctor/earnings', icon: DollarSign },
  { label: 'My Profile', href: '/doctor/profile', icon: User },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth(['doctor']);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Doctor Portal">
      {children}
    </DashboardLayout>
  );
}
