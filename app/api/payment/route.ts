import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { canAccessCenter, getSessionHeaders, hasAnyRole } from '@/lib/apiAuth';

const createSchema = z.object({
  userId:        z.number(),
  centerId:      z.string(),
  amount:        z.number().positive(),
  description:   z.string().optional(),
  paymentMethod: z.enum(['CASH','CARD','TRANSFER','CLICK','PAYME']).default('CASH'),
  dueDate:       z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = getSessionHeaders(req);
  if (!session) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });
  if (!hasAnyRole(session.role, ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'])) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const centerId = req.headers.get('x-center-id')
    ?? req.nextUrl.searchParams.get('centerId');
  const userId = req.nextUrl.searchParams.get('userId');
  const userIdNum = userId ? Number(userId) : null;

  if (session.role === 'STUDENT') {
    if (userIdNum && userIdNum !== session.userId) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }
  }
  if (centerId && !canAccessCenter(session, centerId)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const where: Record<string, unknown> = {};
  if (centerId) where.centerId = centerId;
  if (userId)   where.userId   = userIdNum;
  if (session.role === 'STUDENT' && !userId) where.userId = session.userId;
  if (session.role === 'TEACHER') where.centerId = session.centerId;
  if (session.role === 'ADMIN') where.centerId = session.centerId;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const summary = await prisma.payment.groupBy({
    by: ['status'],
    where,
    _sum: { amount: true },
    _count: true,
  });

  return NextResponse.json({ success: true, payments, summary });
}

export async function POST(req: NextRequest) {
  const session = getSessionHeaders(req);
  if (!session) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });
  if (!hasAnyRole(session.role, ['SUPER_ADMIN', 'ADMIN'])) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  if (!canAccessCenter(session, parsed.data.centerId)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { centerId: true, isActive: true },
  });
  if (!user || !user.isActive || user.centerId !== parsed.data.centerId) {
    return NextResponse.json({ error: "Noto'g'ri foydalanuvchi yoki markaz" }, { status: 400 });
  }

  const payment = await prisma.payment.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    },
  });

  return NextResponse.json({ success: true, data: payment }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = getSessionHeaders(req);
  if (!session) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });
  if (!hasAnyRole(session.role, ['SUPER_ADMIN', 'ADMIN'])) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const { id, status, paidAt } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });
  const existing = await prisma.payment.findUnique({ where: { id: Number(id) }, select: { centerId: true } });
  if (!existing || !canAccessCenter(session, existing.centerId)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const payment = await prisma.payment.update({
    where: { id: Number(id) },
    data: {
      status,
      paidAt: status === 'PAID' ? (paidAt ? new Date(paidAt) : new Date()) : undefined,
    },
  });

  return NextResponse.json({ success: true, data: payment });
}
