'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GraduationCap, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href:  string;
  icon:  LucideIcon;
  label: string;
}

interface SidebarProps {
  title:     string;
  subtitle?: string;
  navItems:  NavItem[];
}

export default function Sidebar({ title, subtitle, navItems }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <aside className="w-[260px] bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0 border-r border-white/5">
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap size={20} />
          </div>
          <span className="font-black text-lg tracking-tight">Zehn.uz</span>
        </div>
        <p className="text-white font-semibold text-sm truncate">{title}</p>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5 truncate">{subtitle}</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'sidebar-link',
                active && 'active'
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button onClick={logout} className="sidebar-link w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut size={18} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
