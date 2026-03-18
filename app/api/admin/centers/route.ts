import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const page     = Number(req.nextUrl.searchParams.get('page')  ?? 1);
  const pageSize = Number(req.nextUrl.searchParams.get('limit') ?? 20);
  const search   = req.nextUrl.searchParams.get('search') ?? '';

  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {};

  const [centers, total] = await Promise.all([
    prisma.center.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, courses: true } },
      },
    }),
    prisma.center.count({ where }),
  ]);

  return NextResponse.json({ success: true, centers, total, page, pageSize });
}

export async function DELETE(req: NextRequest) {
  const role = req.headers.get('x-user-role');
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID kerak' }, { status: 400 });

  await prisma.center.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
