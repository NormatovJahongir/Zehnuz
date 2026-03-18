'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, BookOpen, UserCheck, Users, CreditCard,
  CalendarCheck, Map, Plus, Pencil, Trash2, Loader2,
  Save, X, Eye, EyeOff, TrendingUp, CheckCircle2, AlertCircle,
} from 'lucide-react';
import StatCard  from '@/components/StatCard';
import Sidebar   from '@/components/Sidebar';
import Modal     from '@/components/Modal';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

const MapPicker = dynamic(() => import('@/components/MapPickerClient'), {
  ssr:     false,
  loading: () => <div className="h-[400px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">Xarita yuklanmoqda...</div>,
});

type Tab = 'dashboard' | 'subjects' | 'teachers' | 'students' | 'payments' | 'attendance' | 'map' | 'settings';

interface Subject { id: number; name: string; price: number; description?: string; durationMonths: number; }
interface Member   { id: number; firstName?: string; lastName?: string; phone?: string; username: string; }
interface Payment  { id: number; userId: number; amount: number; status: string; description?: string; createdAt: string; paidAt?: string; }
interface Center   { id: string; name: string; description?: string; address?: string; phone?: string; email?: string; latitude?: number; longitude?: number; }

export default function CenterPage({ params }: { params: { id: string } }) {
  const centerId = params.id;
  const [tab, setTab]         = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ type: 'ok'|'err'; text: string } | null>(null);

  const [center,   setCenter]   = useState<Center | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Member[]>([]);
  const [students, setStudents] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [modal, setModal]   = useState<{ open: boolean; type: Tab | ''; data?: Record<string, unknown> }>({ open: false, type: '' });
  const [form,  setForm]    = useState<Record<string, string>>({});
  const [tempPw, setTempPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<{ lat: number; lng: number }>({ lat: 41.2995, lng: 69.2401 });

  const navItems = [
    { href: `/center/${centerId}`,              icon: LayoutDashboard, label: 'Dashboard'      },
    { href: `/center/${centerId}#subjects`,     icon: BookOpen,        label: 'Fanlar'          },
    { href: `/center/${centerId}#teachers`,     icon: UserCheck,       label: "O'qituvchilar"   },
    { href: `/center/${centerId}#students`,     icon: Users,           label: "O'quvchilar"     },
    { href: `/center/${centerId}#payments`,     icon: CreditCard,      label: "To'lovlar"       },
    { href: `/center/${centerId}#attendance`,   icon: CalendarCheck,   label: 'Davomat'         },
    { href: `/center/${centerId}#map`,          icon: Map,             label: 'Xarita'          },
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/center/data?centerId=${centerId}`);
      const data = await res.json();
      if (data.success) {
        setCenter(data.center);
        setSubjects(data.subjects ?? []);
        setTeachers(data.teachers ?? []);
        setStudents(data.students ?? []);
        if (data.center) {
          setSettingsForm({
            name:        data.center.name        ?? '',
            description: data.center.description ?? '',
            address:     data.center.address     ?? '',
            phone:       data.center.phone       ?? '',
            email:       data.center.email       ?? '',
          });
          setLocation({ lat: data.center.latitude ?? 41.2995, lng: data.center.longitude ?? 69.2401 });
        }
      }
      const pr = await fetch(`/api/payment?centerId=${centerId}`);
      const pd = await pr.json();
      if (pd.success) setPayments(pd.payments ?? []);
    } finally {
      setLoading(false);
    }
  }, [centerId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showMsg = (type: 'ok'|'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const openModal = (type: Tab, data?: Record<string, unknown>) => {
    setForm(data ? {
      id:            String(data.id ?? ''),
      name:          String(data.firstName ?? data.name ?? ''),
      lastName:      String(data.lastName ?? ''),
      phone:         String(data.phone ?? ''),
      price:         String((data as Subject).price ?? ''),
      description:   String((data as Subject).description ?? ''),
      durationMonths:String((data as Subject).durationMonths ?? '3'),
    } : {});
    setTempPw('');
    setModal({ open: true, type, data });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const body: Record<string, unknown> = { ...form, centerId, type: modal.type };
      if (modal.type === 'subjects') {
        body.name  = form.name;
        body.price = parseFloat(form.price) || 0;
        body.durationMonths = parseInt(form.durationMonths) || 3;
      } else {
        body.firstName = form.name;
        body.lastName  = form.lastName;
      }

      const res  = await fetch('/api/center/data', {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showMsg('err', data.error ?? 'Xatolik'); return; }

      if (!isEdit && data.tempPassword) setTempPw(data.tempPassword);
      else { setModal({ open: false, type: '' }); await fetchAll(); showMsg('ok', 'Saqlandi!'); }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch('/api/center/data', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, id }),
    });
    await fetchAll();
    showMsg('ok', "O'chirildi");
  };

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/center/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: centerId, ...settingsForm, lat: location.lat, lng: location.lng }),
      });
      const data = await res.json();
      if (!res.ok) showMsg('err', data.error);
      else { showMsg('ok', 'Saqlandi!'); setCenter(data.data); }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pending      = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        title={center?.name ?? 'Markaz'}
        subtitle="Admin panel"
        navItems={navItems}
      />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-600 font-semibold">{center?.name}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 capitalize">{tab}</span>
          </div>
          {['subjects','teachers','students'].includes(tab) && (
            <button onClick={() => openModal(tab as Tab)} className="btn-primary text-sm">
              <Plus size={16} /> Qo'shish
            </button>
          )}
        </header>

        {/* Toast */}
        {msg && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg animate-fade-in
            ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        <div className="flex-1 p-8 space-y-6">

          {/* DASHBOARD */}
          {tab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => setTab('subjects')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                  <StatCard icon={BookOpen}   label="Fanlar"        value={subjects.length} color="blue" />
                </div>
                <div onClick={() => setTab('teachers')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                  <StatCard icon={UserCheck}  label="O'qituvchilar" value={teachers.length} color="purple" />
                </div>
                <div onClick={() => setTab('students')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                  <StatCard icon={Users}      label="O'quvchilar"   value={students.length} color="green" />
                </div>
                <div onClick={() => setTab('payments')} className="cursor-pointer hover:scale-[1.02] transition-transform">
                  <StatCard icon={TrendingUp} label="Daromad"       value={formatCurrency(totalRevenue)} sub={`${pending} kutilmoqda`} color="orange" />
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent students */}
                <div className="card p-6">
                  <h3 className="font-bold text-slate-800 mb-4">So'nggi o'quvchilar</h3>
                  {students.length === 0
                    ? <p className="text-slate-400 text-sm text-center py-8">Hali o'quvchi yo'q</p>
                    : <div className="space-y-3">
                        {students.slice(0, 5).map(s => (
                          <div key={s.id} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {getInitials(`${s.firstName} ${s.lastName}`)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-slate-400">{s.phone ?? s.username}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Recent payments */}
                <div className="card p-6">
                  <h3 className="font-bold text-slate-800 mb-4">So'nggi to'lovlar</h3>
                  {payments.length === 0
                    ? <p className="text-slate-400 text-sm text-center py-8">Hali to'lov yo'q</p>
                    : <div className="space-y-3">
                        {payments.slice(0, 5).map(p => (
                          <div key={p.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{p.description ?? "To'lov"}</p>
                              <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-slate-900">{formatCurrency(p.amount)}</p>
                              <span className={`badge text-xs ${p.status === 'PAID' ? 'badge-green' : p.status === 'OVERDUE' ? 'badge-red' : 'badge-amber'}`}>
                                {p.status === 'PAID' ? 'To\'landi' : p.status === 'OVERDUE' ? 'Muddati o\'tgan' : 'Kutilmoqda'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            </>
          )}

          {/* SUBJECTS */}
          {tab === 'subjects' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.length === 0
                ? <EmptyState icon={BookOpen} text="Hali fan qo'shilmagan" action={() => openModal('subjects')} />
                : subjects.map(s => (
                    <div key={s.id} className="card p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                          <BookOpen size={20} />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openModal('subjects', s as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete('subject', s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">{s.name}</h3>
                      {s.description && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{s.description}</p>}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-blue-600 font-bold">{formatCurrency(s.price)}</span>
                        <span className="text-slate-400 text-xs">{s.durationMonths} oy</span>
                      </div>
                    </div>
                  ))
              }
            </div>
          )}

          {/* TEACHERS */}
          {tab === 'teachers' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {teachers.length === 0
                ? <EmptyState icon={UserCheck} text="Hali o'qituvchi yo'q" action={() => openModal('teachers')} />
                : teachers.map(t => (
                    <MemberCard key={t.id} member={t} color="purple"
                      onEdit={() => openModal('teachers', t as unknown as Record<string, unknown>)}
                      onDelete={() => handleDelete('teacher', t.id)} />
                  ))
              }
            </div>
          )}

          {/* STUDENTS */}
          {tab === 'students' && (
            <div className="card overflow-hidden">
              {students.length === 0
                ? <EmptyState icon={Users} text="Hali o'quvchi yo'q" action={() => openModal('students')} />
                : <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="table-th">Ism</th>
                        <th className="table-th">Telefon</th>
                        <th className="table-th">Login</th>
                        <th className="table-th text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="table-td">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                {getInitials(`${s.firstName} ${s.lastName}`)}
                              </div>
                              <span className="font-medium">{s.firstName} {s.lastName}</span>
                            </div>
                          </td>
                          <td className="table-td text-slate-500">{s.phone ?? '—'}</td>
                          <td className="table-td"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{s.username}</span></td>
                          <td className="table-td text-right">
                            <button onClick={() => openModal('students', s as unknown as Record<string, unknown>)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mr-1"><Pencil size={15} /></button>
                            <button onClick={() => handleDelete('student', s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          )}

          {/* PAYMENTS */}
          {tab === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <StatCard icon={CreditCard}  label="Jami to'landi" value={formatCurrency(payments.filter(p => p.status==='PAID').reduce((s,p)=>s+p.amount,0))} color="green" />
                <StatCard icon={AlertCircle} label="Kutilmoqda"    value={formatCurrency(payments.filter(p => p.status==='PENDING').reduce((s,p)=>s+p.amount,0))} color="orange" />
                <StatCard icon={TrendingUp}  label="Jami yozuvlar" value={payments.length} color="blue" />
              </div>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="table-th">Tavsif</th>
                      <th className="table-th">Miqdor</th>
                      <th className="table-th">Holat</th>
                      <th className="table-th">Sana</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {payments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="table-td font-medium">{p.description ?? "To'lov"}</td>
                        <td className="table-td font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                        <td className="table-td">
                          <span className={`badge ${p.status==='PAID'?'badge-green':p.status==='OVERDUE'?'badge-red':'badge-amber'}`}>
                            {p.status==='PAID'?"To'landi":p.status==='OVERDUE'?"Muddati o'tgan":"Kutilmoqda"}
                          </span>
                        </td>
                        <td className="table-td text-slate-500">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MAP */}
          {tab === 'map' && (
            <div className="card p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-lg">Markaz joylashuvi</h2>
                <span className="font-mono text-sm text-slate-400">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
              <MapPicker initialPos={[location.lat, location.lng]} onLocationSelect={setLocation} />
              <button
                onClick={async () => {
                  setSaving(true);
                  const res = await fetch('/api/center/settings', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: centerId, lat: location.lat, lng: location.lng }),
                  });
                  setSaving(false);
                  if (res.ok) showMsg('ok', 'Joylashuv saqlandi!');
                  else showMsg('err', 'Xatolik');
                }}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Joylashuvni saqlash
              </button>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="card p-8 max-w-xl">
              <h2 className="font-bold text-slate-800 text-lg mb-6">Markaz sozlamalari</h2>
              <form onSubmit={handleSettingsSave} className="space-y-4">
                {[
                  ['name',        'Markaz nomi',   'text',  'Masalan: Starlight Academy'],
                  ['description', 'Tavsif',        'text',  'Markaz haqida qisqacha'],
                  ['address',     'Manzil',        'text',  'Ko\'cha, uy raqami'],
                  ['phone',       'Telefon',       'tel',   '+998 90 000 00 00'],
                  ['email',       'Email',         'email', 'info@markaz.uz'],
                ].map(([key, label, type, placeholder]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input type={type} className="input" placeholder={placeholder}
                      value={settingsForm[key] ?? ''}
                      onChange={e => setSettingsForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <button type="submit" disabled={saving} className="btn-primary mt-2">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Saqlash
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom nav tabs */}
        <nav className="bg-white border-t border-slate-100 flex lg:hidden sticky bottom-0">
          {([
            ['dashboard','Dashboard',LayoutDashboard],
            ['subjects','Fanlar',BookOpen],
            ['teachers','Ustoz',UserCheck],
            ['students',"O'quvchi",Users],
            ['payments',"To'lov",CreditCard],
          ] as [Tab, string, React.ElementType][]).map(([t, label, Icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors
                ${tab===t ? 'text-blue-600' : 'text-slate-400'}`}>
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>
      </main>

      {/* Desktop tab switcher in sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 w-[260px] h-screen pointer-events-none">
        <div className="pointer-events-auto mt-[280px] px-4 space-y-1">
          {([
            ['dashboard', 'Dashboard',      LayoutDashboard],
            ['subjects',  'Fanlar',         BookOpen],
            ['teachers',  "O'qituvchilar",  UserCheck],
            ['students',  "O'quvchilar",    Users],
            ['payments',  "To'lovlar",      CreditCard],
            ['attendance','Davomat',        CalendarCheck],
            ['map',       'Xarita',         Map],
          ] as [Tab, string, React.ElementType][]).map(([t, label, Icon]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${tab===t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modal.open && !tempPw}
        onClose={() => { setModal({ open: false, type: '' }); setForm({}); }}
        title={form.id ? 'Tahrirlash' : `Yangi ${modal.type === 'subjects' ? 'fan' : modal.type === 'teachers' ? "o'qituvchi" : "o'quvchi"}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {modal.type === 'subjects' ? 'Fan nomi' : 'Ism'}
            </label>
            <input className="input" placeholder="Kiriting..." value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          {modal.type !== 'subjects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Familiya</label>
                <input className="input" placeholder="Ixtiyoriy" value={form.lastName ?? ''} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefon</label>
                <input type="tel" className="input" placeholder="+998 90 000 00 00" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </>
          )}

          {modal.type === 'subjects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tavsif</label>
                <input className="input" placeholder="Ixtiyoriy" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Narxi (so'm)</label>
                  <input type="number" className="input" placeholder="500000" value={form.price ?? ''} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Davomiyligi (oy)</label>
                  <input type="number" className="input" placeholder="3" value={form.durationMonths ?? '3'} onChange={e => setForm(f => ({ ...f, durationMonths: e.target.value }))} min={1} max={36} />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, type: '' })} className="btn-secondary flex-1">Bekor</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Saqlash
            </button>
          </div>
        </form>
      </Modal>

      {/* Temp password modal */}
      <Modal open={!!tempPw} onClose={() => { setTempPw(''); setModal({ open: false, type: '' }); fetchAll(); }} title="Vaqtinchalik parol">
        <div className="space-y-4">
          <p className="text-slate-500 text-sm">Qo'shildi! Quyidagi login va parolni foydalanuvchiga bering:</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Parol</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{showPw ? tempPw : '••••••••'}</span>
                <button type="button" onClick={() => setShowPw(v => !v)} className="text-slate-400 hover:text-slate-700">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">⚠️ Bu parol faqat bir marta ko'rsatiladi. Yozib oling!</p>
          <button onClick={() => { setTempPw(''); setModal({ open: false, type: '' }); fetchAll(); }} className="btn-primary w-full justify-center">
            <CheckCircle2 size={16} /> Tushunarli
          </button>
        </div>
      </Modal>
    </div>
  );
}

function MemberCard({ member, color, onEdit, onDelete }: { member: Member; color: string; onEdit: () => void; onDelete: () => void }) {
  const bg = color === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600';
  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${bg}`}>
        {getInitials(`${member.firstName} ${member.lastName}`)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800">{member.firstName} {member.lastName}</p>
        <p className="text-sm text-slate-400 truncate">{member.phone ?? member.username}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={onEdit}   className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><Pencil size={15} /></button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, action }: { icon: React.ElementType; text: string; action: () => void }) {
  return (
    <div className="col-span-full card p-12 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
        <Icon size={32} />
      </div>
      <p className="text-slate-400 font-medium">{text}</p>
      <button onClick={action} className="btn-primary text-sm">
        <Plus size={16} /> Qo'shish
      </button>
    </div>
  );
}
