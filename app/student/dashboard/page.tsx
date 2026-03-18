'use client';

import React, { useEffect, useState } from 'react';
import {
  BookOpen, CalendarCheck, CreditCard, Bell,
  TrendingUp, CheckCircle2, XCircle, Clock, Loader2,
  User, GraduationCap, Award,
} from 'lucide-react';
import Sidebar  from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { formatCurrency, formatDate, attendanceLabel, attendanceColor, getInitials } from '@/lib/utils';

interface DashData {
  user: {
    id: number; firstName?: string; lastName?: string;
    username: string; phone?: string;
    center?: { name: string };
  };
  enrollments: Array<{
    id: number;
    course: {
      title: string;
      subject?: { name: string };
      teacher?: { user: { firstName?: string; lastName?: string } };
    };
  }>;
  recentAttendance: Array<{
    id: number; date: string; status: string;
    course: { title: string };
  }>;
  results: Array<{
    id: number; testName: string; percentage: number; testDate: string;
    course: { title: string };
  }>;
  payments: Array<{
    id: number; amount: number; status: string; description?: string; createdAt: string;
  }>;
  notifications: Array<{ id: number; title: string; content: string; type: string; createdAt: string }>;
  attendanceStats: Array<{ status: string; _count: number }>;
}

const navItems = [
  { href: '/student/dashboard', icon: GraduationCap, label: 'Bosh sahifa'  },
  { href: '/student/courses',   icon: BookOpen,      label: 'Kurslarim'    },
  { href: '/student/payments',  icon: CreditCard,    label: "To'lovlarim"  },
  { href: '/student/results',   icon: Award,         label: 'Natijalarim'  },
];

export default function StudentDashboard() {
  const [data,    setData]    = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!data) return null;

  const { user, enrollments, recentAttendance, results, payments, notifications, attendanceStats } = data;

  const presentCount = attendanceStats.find(s => s.status === 'PRESENT')?._count ?? 0;
  const absentCount  = attendanceStats.find(s => s.status === 'ABSENT')?._count  ?? 0;
  const totalAtt     = attendanceStats.reduce((s, r) => s + r._count, 0);
  const attRate      = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        title={`${user.firstName ?? ''} ${user.lastName ?? ''}`}
        subtitle={user.center?.name ?? "O'quvchi"}
        navItems={navItems}
      />

      <main className="flex-1 p-8 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
            {getInitials(`${user.firstName} ${user.lastName}`)}
          </div>
          <div>
            <p className="text-blue-200 text-sm">Xush kelibsiz,</p>
            <h1 className="text-2xl font-black">{user.firstName} {user.lastName}</h1>
            <p className="text-blue-200 text-sm mt-1">{user.center?.name ?? ''}</p>
          </div>
          {notifications.length > 0 && (
            <div className="ml-auto bg-white/20 rounded-xl px-4 py-2 flex items-center gap-2">
              <Bell size={18} />
              <span className="font-bold">{notifications.length} yangi</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen}     label="Kurslar"          value={enrollments.length}  color="blue"   />
          <StatCard icon={CalendarCheck}label="Davomat foizi"    value={`${attRate}%`}        sub={`${presentCount}/${totalAtt} dars`} color="green" />
          <StatCard icon={TrendingUp}   label="O'rtacha ball"    value={`${avgScore}%`}       sub={`${results.length} test`} color="purple" />
          <StatCard icon={CreditCard}   label="Kutilayotgan to'lov" value={formatCurrency(payments.filter(p=>p.status==='PENDING').reduce((s,p)=>s+p.amount,0))} color="orange" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Enrolled courses */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" /> Mening kurslarim
            </h2>
            {enrollments.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">Hali hech qaysi kursga yozilmagansiz</p>
              : <div className="space-y-3">
                  {enrollments.map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                      <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{e.course.title}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {e.course.teacher
                            ? `Ustoz: ${e.course.teacher.user.firstName} ${e.course.teacher.user.lastName}`
                            : e.course.subject?.name ?? ''}
                        </p>
                      </div>
                      <span className="badge-blue">Aktiv</span>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Recent attendance */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarCheck size={18} className="text-emerald-600" /> Davomat tarixi
            </h2>
            {recentAttendance.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">Davomat ma'lumoti yo'q</p>
              : <div className="space-y-2">
                  {recentAttendance.map(a => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{a.course.title}</p>
                        <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                      </div>
                      <span className={`badge text-xs ${attendanceColor(a.status)}`}>
                        {attendanceLabel(a.status)}
                      </span>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Test results */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award size={18} className="text-purple-600" /> Test natijalari
            </h2>
            {results.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">Hali test natijalari yo'q</p>
              : <div className="space-y-3">
                  {results.map(r => (
                    <div key={r.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.testName}</p>
                        <p className="text-xs text-slate-400">{r.course.title} · {formatDate(r.testDate)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm ${r.percentage >= 70 ? 'text-emerald-600' : r.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.round(r.percentage)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Payments */}
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-orange-600" /> To'lovlar
            </h2>
            {payments.length === 0
              ? <p className="text-slate-400 text-sm text-center py-8">Hali to'lov yo'q</p>
              : <div className="space-y-3">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{p.description ?? "To'lov"}</p>
                        <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(p.amount)}</p>
                        <span className={`badge text-xs ${p.status==='PAID'?'badge-green':p.status==='OVERDUE'?'badge-red':'badge-amber'}`}>
                          {p.status==='PAID'?"To'landi":p.status==='OVERDUE'?"Muddati o'tgan":"Kutilmoqda"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell size={18} className="text-amber-500" /> Bildirishnomalar
            </h2>
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <Bell size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                    <p className="text-slate-500 text-sm">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
