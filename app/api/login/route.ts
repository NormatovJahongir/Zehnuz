import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, setTokenCookie } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, "Login kiritilmadi"),
  password: z.string().min(1, "Parol kiritilmadi"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { center: { select: { id: true, name: true } } },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Login yoki parol xato" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Login yoki parol xato" },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      centerId: user.centerId,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        role: user.role,
        centerId: user.centerId,
        centerName: user.center?.name,
      },
    });

    // Set HttpOnly cookie
    response.cookies.set('zehn_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: "Serverda xatolik" }, { status: 500 });
  }
}
