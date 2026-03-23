import { NextRequest } from 'next/server';

export type AppRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface SessionHeaders {
  userId: number;
  role: AppRole;
  centerId: string | null;
}

export function getSessionHeaders(req: NextRequest): SessionHeaders | null {
  const rawUserId = req.headers.get('x-user-id');
  const rawRole = req.headers.get('x-user-role') as AppRole | null;
  const centerId = req.headers.get('x-center-id');

  const userId = rawUserId ? Number(rawUserId) : NaN;
  if (!Number.isFinite(userId) || userId <= 0 || !rawRole) return null;

  return {
    userId,
    role: rawRole,
    centerId: centerId ?? null,
  };
}

export function hasAnyRole(role: AppRole, allowed: AppRole[]): boolean {
  return allowed.includes(role);
}

export function canAccessCenter(
  session: SessionHeaders,
  targetCenterId: string | null | undefined
): boolean {
  if (!targetCenterId) return false;
  if (session.role === 'SUPER_ADMIN') return true;
  if (!session.centerId) return false;
  return session.centerId === targetCenterId;
}
