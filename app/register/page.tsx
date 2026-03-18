'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Building2, User, Lock, Phone, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

// 1. Ro'yxatdan o'tish formasi mantiqi
function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const [form, setForm] = useState({
    centerName: '',
    adminName:  '',
    username:   '',
    password:   '',
    phone:      '',
    telegramId: '',
  });

  useEffect(() => {
    const tgId   = params.get('tgId');
    const tgName = params.get('tgName');
    if (tgId)   setForm(f => ({ ...f, telegramId: tgId }));
    if (tgName) setForm(f => ({ ...f, adminName: decodeURIComponent(tgName) }));
  }, [params]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.centerName.trim() || !form.adminName.trim()) return;
      setStep(2);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Xatolik'); return; }
      setDone(true);
      setTimeout(() => router.push(`/center/${data.centerId}`), 2000);
    } catch {
      setError('Server bilan ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Muvaffaqiyatli!</h2>
        <p className="text-slate-400">Boshqaruv paneliga o'tilmoqda...</p>
      </div>
    );
  }

  return (
    <>
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2].map(s => (
          <React.Fragment key={s}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all
              ${s === step ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' :
                s < step  ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400'}`}>
              {s < step ? <CheckCircle2 size={16} /> : s}
            </div>
            {s < 2 && <div className={`h-0.5 w-16 transition-all ${step > 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        {step === 1 && (
          <>
            <h2 className="text-white font-bold text-2xl mb-1">Markaz ma'lumotlari</h2>
            <p className="text-slate-400 text-sm mb-8">Markazingiz haqida asosiy ma'lumotlar</p>

            {error && (
              <div className="mb-5 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle size={16} className="shrink-0" />{error}
              </div>
            )}

            <form onSubmit={next} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  <Building2 size={14} className="inline mr-1" />Markaz nomi
                </label>
                <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masalan: Starlight Academy" value={form.centerName} onChange={set('centerName')} required autoFocus />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  <User size={14} className="inline mr-1" />Admin ismi
                </label>
                <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="To'liq ismingiz" value={form.adminName} onChange={set('adminName')} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 mt-2">
                Davom etish →
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-white font-bold text-2xl leading-none">Kirish ma'lumotlari</h2>
                <p className="text-slate-400 text-sm mt-1">Login va parolingizni belgilang</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle size={16} className="shrink-0" />{error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  <Lock size={14} className="inline mr-1" />Login (username)
                </label>
                <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="faqat lotin harf va raqam" value={form.username} onChange={set('username')} required autoFocus pattern="[a-z0-9_]+" />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  <Lock size={14} className="inline mr-1" />Parol
                </label>
                <input type="password" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Kamida 6 ta belgi" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  <Phone size={14} className="inline mr-1" />Telefon
                </label>
                <input type="tel" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Ro'yxatdan o'tish ✓"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-slate-400 text-sm">
            Hisobingiz bormi?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Kirish</Link>
          </p>
        </div>
      </div>
    </>
  );
}

// 2. Asosiy sahifa
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Zehn.uz</span>
        </div>

        <Suspense fallback={<div className="text-white text-center">Yuklanmoqda...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
