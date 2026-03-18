import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendMessage, sendWebAppButton } from '@/lib/telegram';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://zehn.uz';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const msg = payload.message ?? payload.callback_query?.message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const text   = payload.message?.text ?? '';
    const from   = payload.message?.from ?? payload.callback_query?.from;
    if (!from) return NextResponse.json({ ok: true });

    const telegramId = String(from.id);

    // Upsert user on any message
    let dbUser = await prisma.user.findUnique({ where: { telegramId } });

    if (!dbUser) {
      const defaultPw = await bcrypt.hash(telegramId, 10);
      try {
        dbUser = await prisma.user.create({
          data: {
            telegramId,
            firstName:  from.first_name  ?? 'Foydalanuvchi',
            lastName:   from.last_name   ?? '',
            username:   from.username    ?? `tg_${telegramId}`,
            password:   defaultPw,
            role:       'STUDENT',
          },
        });
      } catch {
        // username conflict — regenerate
        dbUser = await prisma.user.create({
          data: {
            telegramId,
            firstName: from.first_name ?? 'Foydalanuvchi',
            username:  `tg_${telegramId}_${Date.now()}`,
            password:  defaultPw,
            role:      'STUDENT',
          },
        });
      }
    }

    if (text === '/start') {
      if (dbUser.role === 'ADMIN' && dbUser.centerId) {
        await sendWebAppButton(
          chatId,
          `Xush kelibsiz, <b>${dbUser.firstName}</b>! Markazingiz boshqaruv paneliga kirishingiz mumkin.`,
          '📊 Boshqaruv paneli',
          `${APP_URL}/center/${dbUser.centerId}`
        );
      } else if (dbUser.role === 'TEACHER') {
        await sendWebAppButton(
          chatId,
          `Assalomu alaykum, <b>${dbUser.firstName}</b>! O'qituvchi paneliga o'ting.`,
          '📚 Dars jadvali',
          `${APP_URL}/teacher/attendance`
        );
      } else if (dbUser.role === 'STUDENT') {
        await sendWebAppButton(
          chatId,
          `Assalomu alaykum! O'quv markazingizni topish yoki ro'yxatdan o'tish uchun:`,
          '🎓 Shaxsiy kabinet',
          `${APP_URL}/student/dashboard`
        );
      } else {
        await sendWebAppButton(
          chatId,
          `Assalomu alaykum! <b>Zehn.uz</b> — O'quv markazlari platformasiga xush kelibsiz.\n\nMarkaz ochmoqchimisiz?`,
          "📝 Ro'yxatdan o'tish",
          `${APP_URL}/register?tgId=${telegramId}&tgName=${encodeURIComponent(from.first_name ?? '')}`
        );
      }
    }

    if (text === '/help') {
      await sendMessage(chatId,
        `<b>Zehn.uz Bot</b>\n\n/start — Bosh menyu\n/help — Yordam\n/profile — Profilim\n/centers — Markazlar ro'yxati`
      );
    }

    if (text === '/profile' && dbUser) {
      await sendMessage(chatId,
        `<b>Profilingiz:</b>\n\nIsm: ${dbUser.firstName ?? '—'}\nLogin: ${dbUser.username}\nRol: ${dbUser.role}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Bot error:', err);
    return NextResponse.json({ ok: true });
  }
}

// Verify webhook (Telegram sends GET to check)
export async function GET() {
  return NextResponse.json({ ok: true, service: 'Zehn.uz Telegram Bot' });
}
