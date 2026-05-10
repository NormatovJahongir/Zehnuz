'use client';

import React from 'react';
import { GraduationCap, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// NavItem interfeysini kengaytiramiz
interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;    // Qo'shildi
  onClick?: (e: React.MouseEvent) => void; // Qo'shildi
}

interface SidebarProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
}

export default function Sidebar({ title, subtitle, navItems }: SidebarProps) {
  // Logout funksiyasi o'zgarishsiz qoladi
  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-[260px] bg-slate-900 text-white hidden lg:flex flex-col h-screen shrink-0 border-r border-white/5 z-30">
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
        {navItems.map((item) => {
          const Icon = item.icon;
          
          // Agar onClick bo'lsa button chiqaramiz, bo'lmasa standart harakat
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium mb-1',
                item.active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <button 
          onClick={logout} 
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
