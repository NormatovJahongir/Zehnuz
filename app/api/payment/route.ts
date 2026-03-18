import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  userId:        z.number(),
  centerId:      z.string(),
  amount:        z.number().positive(),
  description:   z.string().optional(),
  paymentMethod: z.enum(['CASH','CARD','TRANSFER','CLICK','PAYME']).default('CASH'),
  dueDate:       z.string().optional(),
});

export async function GET(req: NextRequest) {
  const centerId = req.headers.get('x-center-id')
    ?? req.nextUrl.searchParams.get('centerId');
  const userId = req.nextUrl.searchParams.get('userId');

  const where: Record<string, unknown> = {};
  if (centerId) where.centerId = centerId;
  if (userId)   where.userId   = Number(userId);

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
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
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
  const { id, status, paidAt } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  const payment = await prisma.payment.update({
    where: { id: Number(id) },
    data: {
      status,
      paidAt: status === 'PAID' ? (paidAt ? new Date(paidAt) : new Date()) : undefined,
    },
  });

  return NextResponse.json({ success: true, data: payment });
}
