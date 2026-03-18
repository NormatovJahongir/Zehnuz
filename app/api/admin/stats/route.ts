import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const [centersCount, studentsCount, teachersCount, payments, recentCenters] = await Promise.all([
    prisma.center.count(),
    prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
    prisma.user.count({ where: { role: 'TEACHER', isActive: true } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    prisma.center.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true } },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    stats: {
      centersCount,
      studentsCount,
      teachersCount,
      totalRevenue: payments._sum.amount ?? 0,
    },
    recentCenters,
  });
}
