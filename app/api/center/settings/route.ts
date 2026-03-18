import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  id:          z.string().min(1),
  name:        z.string().min(2).optional(),
  description: z.string().optional(),
  address:     z.string().optional(),
  phone:       z.string().optional(),
  email:       z.string().email().optional().or(z.literal('')),
  website:     z.string().url().optional().or(z.literal('')),
  latitude:    z.number().optional(),
  longitude:   z.number().optional(),
});

export async function GET(req: NextRequest) {
  const centerId = req.nextUrl.searchParams.get('centerId');
  if (!centerId) return NextResponse.json({ error: 'Center ID kerak' }, { status: 400 });

  const center = await prisma.center.findUnique({ where: { id: centerId } });
  if (!center) return NextResponse.json({ error: 'Markaz topilmadi' }, { status: 404 });

  return NextResponse.json(center);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { id, latitude, longitude, ...rest } = parsed.data;

  const updated = await prisma.center.update({
    where: { id },
    data: {
      ...rest,
      latitude:  latitude  !== undefined ? Number(latitude)  : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
