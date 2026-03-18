import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

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
  const courseId = req.nextUrl.searchParams.get('courseId');
  const date     = req.nextUrl.searchParams.get('date');

  if (!courseId) return NextResponse.json({ error: 'courseId kerak' }, { status: 400 });

  const where: Record<string, unknown> = { courseId: Number(courseId) };
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
  const body = await req.json();
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { courseId, records, date } = parsed.data;
  const markedBy = Number(req.headers.get('x-user-id'));
  const attendanceDate = date ? new Date(date) : new Date();

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
