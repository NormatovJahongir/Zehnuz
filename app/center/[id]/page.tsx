'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, BookOpen, UserCheck, Users, CreditCard,
  CalendarCheck, Map, Plus, Pencil, Trash2, Loader2,
  Save, TrendingUp, CheckCircle2, AlertCircle, Settings, Mail, Phone
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { formatCurrency, getInitials } from '@/lib/utils';

const MapPicker = dynamic(() => import('@/components/MapPickerClient'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">Xarita yuklanmoqda...</div>,
});

type Tab = 'dashboard' | 'subjects' | 'teachers' | 'students' | 'payments' | 'attendance' | 'map' | 'settings';

export default function CenterPage({ params }: { params: { id: string } }) {
  const centerId = params.id;
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [center, setCenter] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [modal, setModal] = useState<{ open: boolean; type: Tab | ''; data?: any }>({ open: false, type: '' });
  const [form, setForm] = useState<any>({});
  const [tempPw, setTempPw] = useState('');
  const [location, setLocation] = useState({ lat: 41.2995, lng: 69.2401 });

  const navItems = useMemo(() => [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard', href: '#' },
    { icon: BookOpen,        label: 'Fanlar',    id: 'subjects',  href: '#subjects' },
    { icon: UserCheck,       label: "Ustozlar",  id: 'teachers',  href: '#teachers' },
    { icon: Users,           label: "O'quvchilar", id: 'students',  href: '#students' },
    { icon: CreditCard,      label: "To'lovlar",  id: 'payments',  href: '#payments' },
    { icon: CalendarCheck,   label: 'Davomat',   id: 'attendance', href: '#attendance' },
    { icon: Map,             label: 'Xarita',    id: 'map',        href: '#map' },
    { icon: Settings,        label: 'Sozlamalar', id: 'settings',   href: '#settings' },
  ], []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/center/data?centerId=${centerId}`);
      const data = await res.json();
      if (data.success) {
        setCenter(data.center);
        setSubjects(data.subjects ?? []);
        setTeachers(data.teachers ?? []);
        setStudents(data.students ?? []);
        if (data.center) {
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

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const openModal = (type: Tab, data?: any) => {
    setForm(data ? {
      id: data.id,
      name: data.firstName ?? data.name ?? '',
      lastName: data.lastName ?? '',
      phone: data.phone ?? '',
      price: data.price ?? '',
      description: data.description ?? '',
      durationMonths: data.durationMonths ?? '3',
    } : {});
    setTempPw('');
    setModal({ open: true, type, data });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!form.id;
      const body = { ...form, centerId, type: modal.type };
      if (modal.type === 'subjects') {
        body.price = parseFloat(form.price) || 0;
        body.durationMonths = parseInt(form.durationMonths) || 3;
      } else {
        body.firstName = form.name;
        body.lastName = form.lastName;
      }

      const res = await fetch('/api/center/data', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showMsg('err', data.error ?? 'Xatolik'); return; }

      if (!isEdit && data.tempPassword) setTempPw(data.tempPassword);
      else { setModal({ open: false, type: '' }); await fetchAll(); showMsg('ok', 'Saqlandi!'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch('/api/center/data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    });
    await fetchAll();
    showMsg('ok', "O'chirildi");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar
        title={center?.name ?? 'Markaz'}
        subtitle="Admin panel"
        navItems={navItems.map(item => ({
          ...item,
          active: tab === item.id,
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            setTab(item.id as Tab);
          }
        }))}
      />

      <main className="flex-1 min-w-0 flex flex-col lg:ml-[260px] pb-20 lg:pb-0">
        <header className="bg-white border-b border-slate-100 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-600 font-semibold truncate max-w-[150px]">{center?.name}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 capitalize">{tab}</span>
          </div>
          {['subjects', 'teachers', 'students'].includes(tab) && (
            <button onClick={() => openModal(tab as Tab)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              <Plus size={16} /> <span className="hidden sm:inline">Qo'shish</span>
            </button>
          )}
        </header>

        {msg && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-top-2
            ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        <div className="flex-1 p-4 lg:p-8 space-y-6">
          
          {/* DASHBOARD TAB */}
          {tab === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => setTab('subjects')} className="cursor-pointer">
                  <StatCard icon={BookOpen} label="Fanlar" value={subjects.length} color="blue" />
                </div>
                <div onClick={() => setTab('teachers')} className="cursor-pointer">
                  <StatCard icon={UserCheck} label="Ustozlar" value={teachers.length} color="purple" />
                </div>
                <div onClick={() => setTab('students')} className="cursor-pointer">
                  <StatCard icon={Users} label="O'quvchilar" value={students.length} color="green" />
                </div>
                <div onClick={() => setTab('payments')} className="cursor-pointer">
                  <StatCard icon={TrendingUp} label="Daromad" value={formatCurrency(totalRevenue)} sub={`${pendingCount} kutilmoqda`} color="orange" />
                </div>
              </div>
              
              <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-4">So'nggi o'quvchilar</h3>
                {students.length === 0 ? <p className="text-center py-8 text-slate-400 text-sm">Hali o'quvchi yo'q</p> : 
                  <div className="space-y-3">
                    {students.slice(0, 5).map(s => (
                      <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{getInitials(`${s.firstName} ${s.lastName}`)}</div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</p>
                          <p className="text-[10px] text-slate-400">{s.phone || "Tel kiritilmagan"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </div>
            </>
          )}

          {/* FANLAR TAB */}
          {tab === 'subjects' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.length === 0 ? <EmptyState icon={BookOpen} text="Fan qo'shilmagan" action={() => openModal('subjects')} /> :
                subjects.map(s => (
                  <div key={s.id} className="card p-6 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={20} /></div>
                      <div className="flex gap-1">
                        <button onClick={() => openModal('subjects', s)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete('subject', s.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800">{s.name}</h3>
                    <div className="mt-4 flex justify-between items-center font-bold text-blue-600">
                      <span>{formatCurrency(s.price)}</span>
                      <span className="text-slate-400 text-xs font-normal">{s.durationMonths} oy</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* USTOZLAR TAB */}
          {tab === 'teachers' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.length === 0 ? <EmptyState icon={UserCheck} text="Ustozlar topilmadi" action={() => openModal('teachers')} /> :
                teachers.map(t => (
                  <div key={t.id} className="card p-5 flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                      {getInitials(`${t.firstName} ${t.lastName}`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{t.firstName} {t.lastName}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={12}/> {t.phone}</p>
                    </div>
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal('teachers', t)} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete('teacher', t.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* O'QUVCHILAR TAB */}
          {tab === 'students' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">O'quvchi ismi</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Telefon / Login</th>
                      <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.length === 0 ? (
                      <tr><td colSpan={3} className="p-12 text-center text-slate-400">O'quvchilar ro'yxati bo'sh</td></tr>
                    ) : (
                      students.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                {getInitials(`${s.firstName} ${s.lastName}`)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{s.firstName} {s.lastName}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-500">{s.phone || s.username}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openModal('students', s)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white"><Pencil size={16} /></button>
                              <button onClick={() => handleDelete('student', s.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TO'LOVLAR TAB */}
          {tab === 'payments' && (
            <div className="card p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={20}/> To'lovlar tarixi</h3>
              {payments.length === 0 ? <p className="text-center py-12 text-slate-400">To'lovlar mavjud emas</p> : (
                <div className="space-y-4">
                  {payments.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{p.student?.firstName} {p.student?.lastName}</p>
                        <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+{formatCurrency(p.amount)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {p.status === 'PAID' ? 'To\'langan' : 'Kutilmoqda'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* XARITA TAB */}
          {tab === 'map' && (
            <div className="card p-6 space-y-4">
              <div className="flex justify-between items-center"><h2 className="font-bold text-slate-800">Markaz joylashuvi</h2></div>
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
                }} 
                className="btn-primary w-fit flex items-center gap-2"
                disabled={saving}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Saqlash
              </button>
            </div>
          )}
        </div>

        {/* MOBILE BOTTOM NAV */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex lg:hidden z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
          {navItems.slice(0, 5).map((item) => (
            <button key={item.id} onClick={() => setTab(item.id as Tab)}
              className={`flex-1 flex flex-col items-center py-3 text-[10px] gap-1 transition-colors
                ${tab === item.id ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </main>

      {/* MODAL Tizimi */}
      <Modal open={modal.open && !tempPw} onClose={() => setModal({ open: false, type: '' })} title={form.id ? "Tahrirlash" : "Yangi qo'shish"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Ism / Nomi</label>
            <input className="input" placeholder="Kiriting..." value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          
          {modal.type === 'subjects' ? (
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Narxi</label>
                  <input type="number" className="input" placeholder="Summa" value={form.price ?? ''} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Muddati (oy)</label>
                  <input type="number" className="input" placeholder="Oy" value={form.durationMonths ?? ''} onChange={e => setForm({...form, durationMonths: e.target.value})} />
                </div>
             </div>
          ) : (
             <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telefon raqami</label>
                <input className="input" placeholder="+998" value={form.phone ?? ''} onChange={e => setForm({...form, phone: e.target.value})} />
             </div>
          )}
          
          <button type="submit" className="btn-primary w-full py-3 justify-center mt-4" disabled={saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Saqlash"}
          </button>
        </form>
      </Modal>

      {/* PAROL KO'RSATISH MODALI */}
      {tempPw && (
        <Modal open={!!tempPw} onClose={() => {setTempPw(''); fetchAll();}} title="Kirish ma'lumotlari">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-center">
              <p className="text-xs mb-1 uppercase font-semibold">Vaqtinchalik parol</p>
              <p className="text-2xl font-mono font-bold tracking-widest">{tempPw}</p>
            </div>
            <p className="text-[11px] text-slate-500 bg-slate-100 p-3 rounded-lg">
              <b>Eslatma:</b> Foydalanuvchi ushbu parol orqali tizimga kirishi mumkin. Uni nusxalab olishni unutmang.
            </p>
            <button onClick={() => {setTempPw(''); fetchAll();}} className="btn-primary w-full justify-center py-3">Tushundim</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text, action }: any) {
  return (
    <div className="col-span-full card p-12 flex flex-col items-center gap-4 border-2 border-dashed border-slate-200 bg-slate-50/50">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 shadow-sm"><Icon size={32} /></div>
      <p className="text-slate-400 font-medium">{text}</p>
      <button onClick={action} className="btn-primary text-sm flex items-center gap-2 px-6"><Plus size={16} /> Qo'shish</button>
    </div>
  );
}
