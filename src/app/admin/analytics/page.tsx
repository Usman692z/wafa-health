'use client';

import { useEffect, useState } from 'react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { StatCard } from '@/components/ui/Card';
import { formatPKR } from '@/lib/utils';
import { Users, Stethoscope, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({ users: 0, doctors: 0, appointments: 0, revenue: 0 });

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.APPOINTMENTS)),
      getDocs(collection(db, COLLECTIONS.PAYMENTS)),
    ]).then(([users, apts, pays]) => {
      const ud = users.docs.map(d => d.data());
      const pd = pays.docs.map(d => d.data()).filter(p => p.status === 'verified');
      setStats({
        users: users.size,
        doctors: ud.filter(u => u.role === 'doctor').length,
        appointments: apts.size,
        revenue: pd.reduce((s, p) => s + (p.platformFee || 0), 0),
      });
    });
  }, []);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date().getMonth();
  const last6 = Array.from({ length: 6 }, (_, i) => months[(now - 5 + i + 12) % 12]);

  const growthChart = {
    labels: last6,
    datasets: [
      { label: 'New Patients', data: [120, 190, 230, 310, 420, 510], borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.1)', fill: true, tension: 0.4 },
      { label: 'New Doctors', data: [8, 12, 15, 22, 28, 35], borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4 },
    ],
  };

  const revenueChart = {
    labels: last6,
    datasets: [{ label: 'Revenue (PKR)', data: [45000, 78000, 92000, 115000, 134000, 168000], backgroundColor: 'rgba(14,165,233,0.8)', borderRadius: 8 }],
  };

  const specChart = {
    labels: ['General', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Gynecologist', 'Other'],
    datasets: [{ data: [35, 15, 12, 10, 8, 20], backgroundColor: ['#0ea5e9','#6366f1','#10b981','#f59e0b','#ec4899','#64748b'], borderWidth: 0 }],
  };

  const lineOpts = { responsive: true, plugins: { legend: { position: 'top' as const } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(226,232,240,0.4)' } }, x: { grid: { display: false } } } };
  const barOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v: number | string) => `₨${Number(v)/1000}k` } }, x: { grid: { display: false } } } };
  const doughnutOpts = { responsive: true, plugins: { legend: { position: 'right' as const } } };

  return (
    <div className="max-w-6xl space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Analytics</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users} icon={Users} color="blue" change={18} />
        <StatCard label="Doctors" value={stats.doctors} icon={Stethoscope} color="purple" change={12} />
        <StatCard label="Appointments" value={stats.appointments} icon={Calendar} color="cyan" change={24} />
        <StatCard label="Platform Revenue" value={formatPKR(stats.revenue)} icon={DollarSign} color="green" change={32} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> User Growth</h3>
          <Line data={growthChart} options={lineOpts} />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Monthly Revenue</h3>
          <Bar data={revenueChart} options={barOpts as never} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Specialization Breakdown</h3>
          <Doughnut data={specChart} options={doughnutOpts} />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Avg Consultation Fee', value: 'PKR 850', icon: DollarSign, color: 'text-green-500 bg-green-50 dark:bg-green-950' },
              { label: 'Avg Doctor Rating', value: '4.3 ★', icon: Activity, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
              { label: 'Chat Consultations', value: '62%', icon: Activity, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950' },
              { label: 'Video Consultations', value: '38%', icon: Activity, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950' },
              { label: 'Completion Rate', value: '87%', icon: Activity, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950' },
              { label: 'Patient Return Rate', value: '54%', icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.color}`}>
                  <m.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{m.value}</p>
                  <p className="text-xs text-slate-500">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
