'use client';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { useRequireAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Search, Calendar, FileText, MessageSquare, User, Loader2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', href: '/patient/doctors', icon: Search },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText },
  { label: 'Messages', href: '/patient/chat', icon: MessageSquare },
  { label: 'My Profile', href: '/patient/profile', icon: User },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth(['patient']);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Patient Portal">
      {children}
    </DashboardLayout>
  );
}
