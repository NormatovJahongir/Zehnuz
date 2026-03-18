'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck, BookOpen, Users, CheckCircle2,
  XCircle, Clock, FileCheck, Loader2, Save, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Sidebar  from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import { attendanceLabel, attendanceColor, formatDate } from '@/lib/utils';

type AStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

interface Course {
  id: number; title: string;
  subject?: { name: string };
  _count: { enrollments: number };
}

interface Student {
  userId: number;
  user: { id: number; firstName?: string; lastName?: string };
}

interface AttRecord {
  userId: number; status: AStatus; note?: string;
}

const navItems = [
  { href: '/teacher/attendance', icon: CalendarCheck, label: 'Davomat'   },
  { href: '/teacher/courses',    icon: BookOpen,      label: 'Darslarim' },
  { href: '/teacher/students',   icon: Users,         label: "O'quvchilar" },
];

export default function TeacherAttendancePage() {
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [selCourse,  setSelCourse]  = useState<number | null>(null);
  const [students,   setStudents]   = useState<Student[]>([]);
  const [records,    setRecords]    = useState<Record<number, AttRecord>>({});
  const [date,       setDate]       = useState(() => new Date().toISOString().split('T')[0]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  useEffect(() => {
    fetch('/api/teacher/courses')
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.courses ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const loadAttendance = useCallback(async (courseId: number, d: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/attendance?courseId=${courseId}&date=${d}`);
      const data = await res.json();
      const map: Record<number, AttRecord> = {};

      // Pre-fill enrolled students as PRESENT
      (data.enrollments ?? []).forEach((e: Student) => {
        map[e.user.id] = { userId: e.user.id, status: 'PRESENT' };
      });

      // Override with saved records
      (data.records ?? []).forEach((r: { userId: number; status: AStatus; note?: string }) => {
        map[r.userId] = { userId: r.userId, status: r.status, note: r.note };
      });

      setStudents(data.enrollments ?? []);
      setRecords(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selCourse) loadAttendance(selCourse, date);
  }, [selCourse, date, loadAttendance]);

  const setStatus = (userId: number, status: AStatus) => {
    setRecords(r => ({ ...r, [userId]: { userId, status } }));
  };

  const handleSave = async () => {
    if (!selCourse) return;
    setSaving(true);
    try {
      await fetch('/api/attendance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          courseId: selCourse,
          date,
          records: Object.values(records),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const presentCount = Object.values(records).filter(r => r.status === 'PRESENT').length;
  const absentCount  = Object.values(records).filter(r => r.status === 'ABSENT').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar title="O'qituvchi" subtitle="Davomat paneli" navItems={navItems} />

      <main className="flex-1 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Davomat</h1>
          <p className="text-slate-400 text-sm mt-1">Kunlik davomat belgilash</p>
        </div>

        {loading && !selCourse ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <>
            {/* Course selector */}
            {!selCourse ? (
              <div>
                <h2 className="font-semibold text-slate-700 mb-4">Kursni tanlang</h2>
                {courses.length === 0
                  ? <div className="card p-12 text-center text-slate-400">
                      <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                      <p>Hali kurs biriktirilmagan</p>
                    </div>
                  : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {courses.map(c => (
                        <button key={c.id} onClick={() => setSelCourse(c.id)}
                          className="card p-6 text-left hover:shadow-md hover:border-blue-200 transition-all group">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <BookOpen size={20} />
                          </div>
                          <h3 className="font-bold text-slate-800">{c.title}</h3>
                          {c.subject && <p className="text-slate-400 text-sm mt-1">{c.subject.name}</p>}
                          <p className="text-blue-600 text-sm font-semibold mt-3">{c._count.enrollments} o'quvchi</p>
                        </button>
                      ))}
                    </div>
                }
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-4">
                  <button onClick={() => { setSelCourse(null); setStudents([]); setRecords({}); }} className="btn-secondary text-sm">
                    ← Orqaga
                  </button>

                  {/* Date picker */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                    <button onClick={() => shiftDate(-1)} className="text-slate-400 hover:text-slate-700"><ChevronLeft size={18} /></button>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      className="text-sm font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer" />
                    <button onClick={() => shiftDate(1)} className="text-slate-400 hover:text-slate-700"><ChevronRight size={18} /></button>
                  </div>

                  <div className="flex gap-3 ml-auto">
                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                      <CheckCircle2 size={16} /> {presentCount} keldi
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-red-500 font-semibold">
                      <XCircle size={16} /> {absentCount} kelmadi
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3">
                  <StatCard icon={Users}        label="Jami"     value={students.length}  color="blue"   />
                  <StatCard icon={CheckCircle2} label="Keldi"    value={presentCount}     color="green"  />
                  <StatCard icon={XCircle}      label="Kelmadi"  value={absentCount}      color="red"    />
                  <StatCard icon={Clock}        label="Kechikdi" value={Object.values(records).filter(r=>r.status==='LATE').length} color="orange" />
                </div>

                {/* Student list */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                  </div>
                ) : students.length === 0 ? (
                  <div className="card p-12 text-center text-slate-400">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Bu kursda hali o'quvchi yo'q</p>
                  </div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                      <p className="font-semibold text-slate-700 text-sm">{formatDate(date)} — davomat</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {students.map((s, idx) => {
                        const rec    = records[s.user.id];
                        const status = rec?.status ?? 'PRESENT';
                        return (
                          <div key={s.userId} className="flex items-center gap-4 px-6 py-4">
                            <span className="text-slate-300 text-sm font-mono w-6 shrink-0">{idx + 1}</span>
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0">
                              {(s.user.firstName?.[0] ?? '?').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">
                                {s.user.firstName} {s.user.lastName}
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {(['PRESENT','LATE','ABSENT','EXCUSED'] as AStatus[]).map(st => (
                                <button key={st} onClick={() => setStatus(s.user.id, st)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                                    ${status === st
                                      ? attendanceColor(st) + ' ring-2 ring-offset-1 ring-current'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                  {attendanceLabel(st)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Save button */}
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving || students.length === 0} className="btn-primary">
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : saved ? (
                      <><CheckCircle2 size={16} /> Saqlandi!</>
                    ) : (
                      <><Save size={16} /> Davomatni saqlash</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
