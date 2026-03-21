import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateUsername } from '@/lib/utils';

const addSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subject'),
    name: z.string().min(1, "Nom kiritilishi shart"),
    price: z.number().min(0),
    description: z.string().optional(),
    durationMonths: z.number().min(1).max(36).optional(),
    centerId: z.string().min(1, "Center ID shart"), // Sxemaga qo'shildi
  }),
  z.object({
    type: z.literal('teacher'),
    firstName: z.string().min(1, "Ism shart"),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    centerId: z.string().min(1, "Center ID shart"),
  }),
  z.object({
    type: z.literal('student'),
    firstName: z.string().min(1, "Ism shart"),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    centerId: z.string().min(1, "Center ID shart"),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Headerdan yoki body'dan centerId ni olish
    const centerIdFromHeader = req.headers.get('x-center-id');
    if (!body.centerId && centerIdFromHeader) {
      body.centerId = centerIdFromHeader;
    }

    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      // Zod xatosini aniqroq qaytarish
      return NextResponse.json({ 
        error: parsed.error.errors[0].message 
      }, { status: 400 });
    }

    const data = parsed.data;
    const cid = data.centerId;

    if (data.type === 'subject') {
      const result = await prisma.subject.create({
        data: {
          name: data.name,
          price: data.price,
          description: data.description,
          durationMonths: data.durationMonths ?? 3,
          centerId: cid,
        },
      });
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } else {
      const { firstName, lastName, phone, type } = data;
      const role = type === 'teacher' ? 'TEACHER' : 'STUDENT';
      const username = generateUsername(firstName);
      const tempPw = Math.random().toString(36).slice(2, 10);
      const hashedPw = await bcrypt.hash(tempPw, 10);

      const result = await prisma.user.create({
        data: { 
          firstName, 
          lastName, 
          phone, 
          role, 
          username, 
          password: hashedPw, 
          centerId: cid 
        },
      });

      return NextResponse.json({ 
        success: true, 
        data: result, 
        tempPassword: tempPw 
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ error: "Serverda xatolik yuz berdi" }, { status: 500 });
  }
}

// PUT va DELETE qismlarida ID turi String bo'lsa Number() ni olib tashlang!
