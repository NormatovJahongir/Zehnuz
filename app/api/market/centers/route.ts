import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const centers = await prisma.center.findMany({
      orderBy: { createdAt: 'desc' }, // 'rating' bazada yo'q, shuning uchun sanasi bo'yicha
      select: {
        id: true,
        name: true,
        description: true, // Sxemada 'description'
        address: true,
        latitude: true,    // Sxemada 'latitude'
        longitude: true,   // Sxemada 'longitude'
        _count: {
          select: { 
            users: true,   // Sxemada talabalar 'users' ichida
            courses: true 
          }
        },
        reviews: {
          select: { rating: true }
        }
      }
    });

    const formattedCenters = centers.map(center => {
      // Reyting hisoblash
      const avgRating = center.reviews.length > 0 
        ? center.reviews.reduce((acc, rev) => acc + rev.rating, 0) / center.reviews.length 
        : 5.0;

      return {
        id: center.id,
        name: center.name,
        desc: center.description, // Frontend 'desc' kutmoqda
        address: center.address,
        lat: center.latitude,     // Frontend 'lat' kutmoqda
        lng: center.longitude,    // Frontend 'lng' kutmoqda
        rating: avgRating.toFixed(1),
        _count: {
          students: center._count.users,
          courses: center._count.courses
        }
      };
    });

    return NextResponse.json(formattedCenters);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Ma'lumot topilmadi" }, { status: 500 });
  }
}
