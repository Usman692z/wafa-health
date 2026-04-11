'use client';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { useRequireAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, Stethoscope, Calendar, DollarSign,
  BarChart2, Settings, FileText, Loader2,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
  { label: 'Patients', href: '/admin/patients', icon: Users },
  { label: 'Appointments', href: '/admin/appointments', icon: Calendar },
  { label: 'Payments', href: '/admin/payments', icon: DollarSign },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRequireAuth(['admin']);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      {children}
    </DashboardLayout>
  );
}
