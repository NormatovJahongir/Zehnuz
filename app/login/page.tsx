'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm]       = useState({ username: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? 'Xatolik'); return; }

      const { role, centerId } = data.user;
      const redirect = params.get('redirect');

      if (redirect) { router.push(redirect); return; }

      switch (role) {
        case 'SUPER_ADMIN': router.push('/admin/dashboard');       break;
        case 'ADMIN':       router.push(`/center/${centerId}`);    break;
        case 'TEACHER':     router.push('/teacher/attendance');    break;
        default:            router.push('/student/dashboard');     break;
      }
    } catch {
      setError('Server bilan ulanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 border-r border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <GraduationCap size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Zehn.uz</span>
        </div>

        <div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            O'quv markazlari<br />
            <span className="text-blue-400">zamonaviy boshqaruvi</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            O'quvchilar, o'qituvchilar, to'lovlar va davomat — hammasi bir joyda.
          </p>
          <div className="mt-10 space-y-4">
            {[
              ['📊', 'Real vaqtda statistika va tahlil'],
              ['📱', 'Telegram bot integratsiyasi'],
              ['🗺️', "Xaritada markaz joylashuvini ko'rsatish"],
              ['💳', "To'lovlarni kuzatish va hisobot"],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-slate-300">
                <span className="text-xl">{icon}</span>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2024 Zehn.uz</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Zehn.uz</span>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <h2 className="text-white font-bold text-2xl mb-1">Kirish</h2>
            <p className="text-slate-400 text-sm mb-8">Hisobingizga kiring</p>

            {error && (
              <div className="mb-5 bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-red-300 text-sm animate-fade-in">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Login</label>
                <input
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3
                             text-white placeholder-slate-500 focus:outline-none focus:ring-2
                             focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="username"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Parol</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12
                               text-white placeholder-slate-500 focus:outline-none focus:ring-2
                               focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white
                           font-bold py-3.5 rounded-xl flex items-center justify-center gap-2
                           transition-all shadow-lg shadow-blue-600/30 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Kirish
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-400 text-sm">
                Markazingiz yo'qmi?{' '}
                <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1">
                  Ro'yxatdan o'ting <ArrowRight size={14} />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
