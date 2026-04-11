'use client';

import { useEffect, useState } from 'react';
import { getAdminStats } from '@/lib/firestore';
import { StatCard } from '@/components/ui/Card';
import { formatPKR } from '@/lib/utils';
import { Users, Stethoscope, Calendar, DollarSign, AlertCircle, Activity, Clock, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Stats {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  pendingApprovals: number;
  totalAppointments: number;
  totalRevenue: number;
  pendingPayments: number;
  todayAppointments: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats().then((s) => {
      setStats(s as Stats);
      setLoading(false);
    });
  }, []);

  const alertItems = [
    { label: 'Pending Doctor Approvals', value: stats?.pendingApprovals || 0, href: '/admin/doctors?filter=pending', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-700', icon: AlertCircle },
    { label: 'Pending Payments', value: stats?.pendingPayments || 0, href: '/admin/payments?filter=pending', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-700', icon: Clock },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (PKR)',
        data: [45000, 78000, 92000, 115000, 134000, 168000],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Appointments',
        data: [90, 156, 184, 230, 268, 336],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(226, 232, 240, 0.5)' } },
      x: { grid: { display: false } },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Dashboard</h2>

      {/* Alert Cards */}
      {alertItems.some(a => a.value > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {alertItems.filter(a => a.value > 0).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${item.bg} ${item.border} hover:shadow-sm transition-all`}
            >
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <p className={`font-semibold text-sm ${item.color}`}>{item.value} {item.label}</p>
                <p className="text-xs text-slate-500">Click to review</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.totalUsers || 0} icon={Users} color="blue" subtext={`${stats?.totalPatients || 0} patients`} />
        <StatCard label="Doctors" value={stats?.totalDoctors || 0} icon={Stethoscope} color="purple" subtext={`${stats?.pendingApprovals || 0} pending`} />
        <StatCard label="Appointments" value={stats?.totalAppointments || 0} icon={Calendar} color="cyan" subtext={`${stats?.todayAppointments || 0} today`} />
        <StatCard label="Total Revenue" value={formatPKR(stats?.totalRevenue || 0)} icon={DollarSign} color="green" change={12} />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Revenue & Appointments Overview</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/doctors" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all group">
          <Stethoscope className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Manage Doctors</h3>
          <p className="text-xs text-slate-500 mt-1">Approve, reject, and manage doctor profiles</p>
          {stats?.pendingApprovals && stats.pendingApprovals > 0 ? (
            <p className="text-xs text-amber-600 font-medium mt-2">{stats.pendingApprovals} awaiting approval</p>
          ) : null}
        </Link>
        <Link href="/admin/payments" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all">
          <DollarSign className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Payment Verification</h3>
          <p className="text-xs text-slate-500 mt-1">Verify manual payments and manage refunds</p>
          {stats?.pendingPayments && stats.pendingPayments > 0 ? (
            <p className="text-xs text-red-500 font-medium mt-2">{stats.pendingPayments} pending</p>
          ) : null}
        </Link>
        <Link href="/admin/analytics" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all">
          <Activity className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Analytics</h3>
          <p className="text-xs text-slate-500 mt-1">Platform stats, revenue reports, and insights</p>
        </Link>
      </div>
    </div>
  );
}
