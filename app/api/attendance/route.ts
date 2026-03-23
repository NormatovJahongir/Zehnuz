import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { canAccessCenter, getSessionHeaders, hasAnyRole } from '@/lib/apiAuth';
import { normalizeToUtcStartOfDay } from '@/lib/security';

const markSchema = z.object({
  courseId:  z.number(),
  records:   z.array(z.object({
    userId: z.number(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    note:   z.string().optional(),
  })),
  date: z.string().optional(), // ISO date string, defaults to today
});

export async function GET(req: NextRequest) {
  const session = getSessionHeaders(req);
  if (!session) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });
  if (!hasAnyRole(session.role, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const courseId = req.nextUrl.searchParams.get('courseId');
  const date     = req.nextUrl.searchParams.get('date');

  if (!courseId) return NextResponse.json({ error: 'courseId kerak' }, { status: 400 });
  const courseIdNum = Number(courseId);
  const course = await prisma.course.findUnique({
    where: { id: courseIdNum },
    select: { centerId: true, teacher: { select: { userId: true } } },
  });
  if (!course || !canAccessCenter(session, course.centerId)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  if (session.role === 'TEACHER' && course.teacher?.userId !== session.userId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const where: Record<string, unknown> = { courseId: courseIdNum };
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Also return enrolled students for this course
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: Number(courseId), status: 'ACTIVE' },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ success: true, records, enrollments });
}

export async function POST(req: NextRequest) {
  const session = getSessionHeaders(req);
  if (!session) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });
  if (!hasAnyRole(session.role, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { courseId, records, date } = parsed.data;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { centerId: true, teacher: { select: { userId: true } } },
  });
  if (!course || !canAccessCenter(session, course.centerId)) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  if (session.role === 'TEACHER' && course.teacher?.userId !== session.userId) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  const allowedStudents = await prisma.enrollment.findMany({
    where: { courseId, status: 'ACTIVE' },
    select: { userId: true },
  });
  const allowedUserIds = new Set(allowedStudents.map((x) => x.userId));
  const hasInvalidRecord = records.some((r) => !allowedUserIds.has(r.userId));
  if (hasInvalidRecord) {
    return NextResponse.json({ error: "Foydalanuvchi kursga yozilmagan" }, { status: 400 });
  }

  const markedBy = session.userId;
  const attendanceDate = normalizeToUtcStartOfDay(date ? new Date(date) : new Date());

  // Upsert each record
  const results = await Promise.all(
    records.map(r =>
      prisma.attendance.upsert({
        where: {
          userId_courseId_date: {
            userId:   r.userId,
            courseId,
            date:     attendanceDate,
          },
        },
        update: { status: r.status, note: r.note, markedBy },
        create: {
          userId:   r.userId,
          courseId,
          date:     attendanceDate,
          status:   r.status,
          note:     r.note,
          markedBy,
        },
      })
    )
  );

  return NextResponse.json({ success: true, count: results.length });
}
