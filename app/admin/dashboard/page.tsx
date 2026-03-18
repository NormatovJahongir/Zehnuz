'use client';

import React, { useEffect, useState } from 'react';
import { School, Users, GraduationCap, TrendingUp, RefreshCcw, Loader2, Eye } from 'lucide-react';
import Sidebar   from '@/components/Sidebar';
import StatCard  from '@/components/StatCard';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Stats {
  centersCount: number;
  studentsCount: number;
  teachersCount: number;
  totalRevenue: number;
}

interface RecentCenter {
  id: string;
  name: string;
  createdAt: string;
  _count: { users: number };
}

const navItems = [
  { href: '/admin/dashboard', icon: School,         label: 'Dashboard'     },
  { href: '/admin/centers',   icon: School,         label: 'Markazlar'     },
  { href: '/admin/users',     icon: Users,          label: 'Foydalanuvchilar' },
];

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [centers, setCenters] = useState<RecentCenter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setCenters(data.recentCenters ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar title="Super Admin" subtitle="Bosh boshqaruv" navItems={navItems} />

      <main className="flex-1 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Umumiy ko'rinish</h1>
            <p className="text-slate-400 text-sm mt-1">Barcha markazlar va foydalanuvchilar statistikasi</p>
          </div>
          <button onClick={fetchData} disabled={loading} className="btn-secondary text-sm">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            Yangilash
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={School}       label="O'quv markazlari" value={stats?.centersCount  ?? 0} color="blue"   />
              <StatCard icon={Users}        label="O'quvchilar"      value={stats?.studentsCount ?? 0} color="green"  />
              <StatCard icon={GraduationCap}label="O'qituvchilar"   value={stats?.teachersCount ?? 0} color="purple" />
              <StatCard icon={TrendingUp}   label="Jami daromad"     value={formatCurrency(stats?.totalRevenue ?? 0)} color="orange" />
            </div>

            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800">So'nggi qo'shilgan markazlar</h2>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="table-th">Markaz nomi</th>
                    <th className="table-th">Foydalanuvchilar</th>
                    <th className="table-th">Ro'yxatdan o'tgan</th>
                    <th className="table-th text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {centers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="table-td font-semibold text-slate-900">{c.name}</td>
                      <td className="table-td">{c._count.users} kishi</td>
                      <td className="table-td text-slate-400">{formatDate(c.createdAt)}</td>
                      <td className="table-td text-right">
                        <a href={`/center/${c.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                          <Eye size={14} /> Ko'rish
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
