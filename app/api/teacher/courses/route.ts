import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userId = Number(req.headers.get('x-user-id'));
  if (!userId) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });

  const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId } });

  if (!teacherProfile) {
    return NextResponse.json({ success: true, courses: [], stats: null });
  }

  const courses = await prisma.course.findMany({
    where: { teacherId: teacherProfile.id, isActive: true },
    include: {
      subject: true,
      _count: { select: { enrollments: true, attendance: true } },
    },
  });

  return NextResponse.json({ success: true, courses, teacherProfile });
}
