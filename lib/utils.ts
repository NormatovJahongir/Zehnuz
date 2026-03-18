import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function generateUsername(base: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  return `${clean}_${rand}`;
}

export function generateTempPassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Markaz admini',
    TEACHER: "O'qituvchi",
    STUDENT: "O'quvchi",
  };
  return map[role] ?? role;
}

export function attendanceColor(status: string): string {
  const map: Record<string, string> = {
    PRESENT: 'text-emerald-600 bg-emerald-50',
    ABSENT: 'text-red-600 bg-red-50',
    LATE: 'text-amber-600 bg-amber-50',
    EXCUSED: 'text-blue-600 bg-blue-50',
  };
  return map[status] ?? 'text-gray-600 bg-gray-50';
}

export function attendanceLabel(status: string): string {
  const map: Record<string, string> = {
    PRESENT: 'Keldi',
    ABSENT: 'Kelmadi',
    LATE: 'Kechikdi',
    EXCUSED: 'Sababli',
  };
  return map[status] ?? status;
}
