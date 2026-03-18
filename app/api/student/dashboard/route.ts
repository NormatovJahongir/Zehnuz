import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get('x-user-id'));
  if (!userId) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });

  const [user, enrollments, recentAttendance, results, payments, notifications] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true,
        username: true, phone: true, email: true, centerId: true,
        center: { select: { name: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            subject: true,
            teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 10,
      include: { course: { select: { title: true } } },
    }),
    prisma.result.findMany({
      where: { userId },
      orderBy: { testDate: 'desc' },
      take: 5,
      include: { course: { select: { title: true } } },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const attendanceStats = await prisma.attendance.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  return NextResponse.json({
    success: true,
    user,
    enrollments,
    recentAttendance,
    results,
    payments,
    notifications,
    attendanceStats,
  });
}
