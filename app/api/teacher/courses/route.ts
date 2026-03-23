import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionHeaders, hasAnyRole } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const session = getSessionHeaders(req);
  if (!session) return NextResponse.json({ error: 'Auth kerak' }, { status: 401 });
  if (!hasAnyRole(session.role, ['TEACHER', 'ADMIN', 'SUPER_ADMIN'])) {
    return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  const userId = session.userId;

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
