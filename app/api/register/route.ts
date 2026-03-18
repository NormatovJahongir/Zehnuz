import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const schema = z.object({
  telegramId: z.string().optional().nullable(),
  centerName: z.string().min(2, "Markaz nomi kamida 2 ta harf"),
  adminName:  z.string().min(2, "Ism kamida 2 ta harf"),
  username:   z.string().min(4, "Login kamida 4 ta belgi").regex(/^[a-z0-9_]+$/, "Faqat lotin harf, raqam va _"),
  password:   z.string().min(6, "Parol kamida 6 ta belgi"),
  phone:      z.string().min(7, "Telefon noto'g'ri"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { telegramId, centerName, adminName, username, password, phone } = parsed.data;

    // Check username uniqueness
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.telegramId !== telegramId) {
      return NextResponse.json({ error: "Bu login band. Boshqa tanlang." }, { status: 400 });
    }

    const hashedPw = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const center = await tx.center.create({
        data: { name: centerName, latitude: 41.2995, longitude: 69.2401 },
      });

      let user;
      const userData = {
        username,
        password: hashedPw,
        firstName: adminName,
        phone,
        role: 'ADMIN' as const,
        centerId: center.id,
      };

      if (telegramId) {
        user = await tx.user.upsert({
          where: { telegramId },
          update: userData,
          create: { ...userData, telegramId },
        });
      } else {
        user = await tx.user.create({ data: userData });
      }

      return { center, user };
    });

    const token = await signToken({
      userId: result.user.id,
      username: result.user.username,
      role: result.user.role,
      centerId: result.center.id,
    });

    const response = NextResponse.json({
      success: true,
      centerId: result.center.id,
      userId: result.user.id,
      message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!",
    }, { status: 201 });

    response.cookies.set('zehn_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: "Serverda xatolik" }, { status: 500 });
  }
}
