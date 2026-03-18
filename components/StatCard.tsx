import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon:    LucideIcon;
  label:   string;
  value:   string | number;
  sub?:    string;
  color?:  'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const colors = {
  blue:   'bg-blue-50   text-blue-600',
  green:  'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
  red:    'bg-red-50    text-red-600',
};

export default function StatCard({ icon: Icon, label, value, sub, color = 'blue' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', colors[color])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
