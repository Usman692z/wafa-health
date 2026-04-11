'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDate, formatPKR } from '@/lib/utils';
import { DollarSign, TrendingUp, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import type { Payment } from '@/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function DoctorEarningsPage() {
  const { profile } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(collection(db, COLLECTIONS.PAYMENTS), where('doctorId', '==', profile.uid));
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => {
        const p = d.data();
        return {
          ...p,
          id: d.id,
          createdAt: p.createdAt?.toDate() || new Date(),
          updatedAt: p.updatedAt?.toDate() || new Date(),
        } as Payment;
      });
      setPayments(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      setLoading(false);
    });
  }, [profile?.uid]);

  const verified = payments.filter((p) => p.status === 'verified');
  const pending = payments.filter((p) => p.status === 'pending');
  const totalEarned = verified.reduce((sum, p) => sum + p.doctorEarning, 0);
  const pendingAmount = pending.reduce((sum, p) => sum + p.doctorEarning, 0);

  // Monthly chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const m = (currentMonth - 5 + i + 12) % 12;
    const year = m > currentMonth ? new Date().getFullYear() - 1 : new Date().getFullYear();
    return { label: months[m], month: m, year };
  });

  const monthlyData = last6Months.map(({ month, year }) =>
    verified
      .filter((p) => p.createdAt.getMonth() === month && p.createdAt.getFullYear() === year)
      .reduce((sum, p) => sum + p.doctorEarning, 0)
  );

  const chartData = {
    labels: last6Months.map((m) => m.label),
    datasets: [{
      label: 'Earnings (PKR)',
      data: monthlyData,
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#0ea5e9',
      pointRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `PKR ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.5)' },
        ticks: {
          callback: (v: number | string) => `₨${Number(v).toLocaleString()}`,
        },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="max-w-5xl space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Earnings Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earned" value={formatPKR(totalEarned)} icon={DollarSign} color="green" />
        <StatCard label="This Month" value={formatPKR(monthlyData[5] || 0)} icon={TrendingUp} color="blue" />
        <StatCard label="Pending" value={formatPKR(pendingAmount)} icon={Clock} color="orange" />
        <StatCard label="Transactions" value={verified.length} icon={CheckCircle} color="purple" />
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Earnings Trend (Last 6 Months)</h3>
        <Line data={chartData} options={chartOptions as never} />
      </div>

      {/* Transactions */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Transaction History</h3>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl skeleton" />)}</div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${p.status === 'verified' ? 'bg-green-50 dark:bg-green-950/40' : 'bg-amber-50 dark:bg-amber-950/40'}`}>
                  {p.status === 'verified'
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <Clock className="w-5 h-5 text-amber-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Consultation Payment</p>
                  <p className="text-xs text-slate-500">{formatDate(p.createdAt)} • {p.method}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${p.status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>
                    + {formatPKR(p.doctorEarning)}
                  </p>
                  <p className="text-xs text-slate-400">of {formatPKR(p.amount)}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commission Note */}
      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-400">
        <p className="font-semibold mb-1">Commission Policy</p>
        <p>WafaHealth charges 10% platform fee on each consultation. Your earnings are 90% of the consultation fee. Payments are released after admin verification.</p>
      </div>
    </div>
  );
}
