import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateUsername } from '@/lib/utils';

// GET: fetch all data for a center
export async function GET(req: NextRequest) {
  const centerId = req.headers.get('x-center-id')
    ?? req.nextUrl.searchParams.get('centerId');

  if (!centerId) return NextResponse.json({ error: 'Center ID topilmadi' }, { status: 400 });

  const [center, subjects, teachers, students, courses] = await Promise.all([
    prisma.center.findUnique({ where: { id: centerId } }),
    prisma.subject.findMany({ where: { centerId }, orderBy: { createdAt: 'desc' } }),
    prisma.user.findMany({
      where: { centerId, role: 'TEACHER' },
      select: { id: true, firstName: true, lastName: true, phone: true, username: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { centerId, role: 'STUDENT' },
      select: { id: true, firstName: true, lastName: true, phone: true, username: true, createdAt: true },
    }),
    prisma.course.findMany({
      where: { centerId },
      include: {
        subject: true,
        teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  return NextResponse.json({ success: true, center, subjects, teachers, students, courses });
}

const addSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subject'),
    name: z.string().min(1),
    price: z.number().min(0),
    description: z.string().optional(),
    durationMonths: z.number().min(1).max(36).optional(),
  }),
  z.object({
    type: z.literal('teacher'),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
  z.object({
    type: z.literal('student'),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
]);

// POST: add subject / teacher / student
export async function POST(req: NextRequest) {
  const centerId = req.headers.get('x-center-id')
    ?? (await req.json().then((b: Record<string, string>) => b.centerId).catch(() => null));

  const body = await req.json().catch(() => ({}));
  if (!body.centerId && centerId) body.centerId = centerId;

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const cid: string = body.centerId;
  if (!cid) return NextResponse.json({ error: 'Center ID kerak' }, { status: 400 });

  let result;

  if (parsed.data.type === 'subject') {
    result = await prisma.subject.create({
      data: {
        name: parsed.data.name,
        price: parsed.data.price,
        description: parsed.data.description,
        durationMonths: parsed.data.durationMonths ?? 3,
        centerId: cid,
      },
    });
  } else {
    const { firstName, lastName, phone } = parsed.data;
    const role = parsed.data.type === 'teacher' ? 'TEACHER' : 'STUDENT';
    const username = generateUsername(firstName);
    const tempPw   = Math.random().toString(36).slice(2, 10);
    const hashedPw = await bcrypt.hash(tempPw, 10);

    result = await prisma.user.create({
      data: { firstName, lastName, phone, role, username, password: hashedPw, centerId: cid },
    });

    // Return temp password for admin to share
    return NextResponse.json({ success: true, data: result, tempPassword: tempPw }, { status: 201 });
  }

  return NextResponse.json({ success: true, data: result }, { status: 201 });
}

// PUT: update subject / teacher / student
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { type, id, ...fields } = body;

  if (!id || !type) return NextResponse.json({ error: 'ID va type kerak' }, { status: 400 });

  let result;

  if (type === 'subject') {
    result = await prisma.subject.update({
      where: { id: Number(id) },
      data: {
        name: fields.name,
        price: fields.price !== undefined ? Number(fields.price) : undefined,
        description: fields.description,
        durationMonths: fields.durationMonths ? Number(fields.durationMonths) : undefined,
      },
    });
  } else {
    result = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        firstName: fields.firstName,
        lastName:  fields.lastName,
        phone:     fields.phone,
      },
    });
  }

  return NextResponse.json({ success: true, data: result });
}

// DELETE: remove subject / teacher / student
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { type, id } = body;

  if (!id || !type) return NextResponse.json({ error: 'ID va type kerak' }, { status: 400 });

  if (type === 'subject') {
    await prisma.subject.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });
  } else {
    // Soft delete — deactivate user
    await prisma.user.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ success: true });
}
