# Zehn.uz v2.0 — O'quv markazlari LMS

## Yaxshilanishlar (v1 → v2)

| Muammo | Yechim |
|--------|--------|
| JWT token yo'q | `HttpOnly cookie` + `jose` bilan to'liq JWT auth |
| DELETE endpoint yo'q | Barcha modellarda `DELETE` API qo'shildi (soft delete) |
| localStorage/session yo'q | Server-side cookie session — sahifa yangilaganda ham ishlaydi |
| Middleware yo'q | `middleware.ts` — rol asosida yo'nalish himoyasi |
| Duplicate kod | `center/data` va `admin/stats` birlashtirildi |
| Hardcoded parollar | Tasodifiy parol generatsiyasi + bir marta ko'rsatish UI |
| username takrorlanishi | `generateUsername()` + `Date.now()` kombinatsiyasi |
| `app/map/page.txt` | To'g'ri `.tsx` fayl sifatida yaratildi |
| Mock data | Real Prisma so'rovlari bilan almashtirildi |
| Auth yo'q API'larda | Header-dan `x-user-id`, `x-user-role` o'qiladi |

## Loyiha tuzilishi

```
zehn-uz/
├── app/
│   ├── api/
│   │   ├── login/         # POST — JWT cookie beradi
│   │   ├── logout/        # POST — cookie o'chiradi
│   │   ├── register/      # POST — markaz + admin yaratadi
│   │   ├── bot/           # POST — Telegram webhook
│   │   ├── center/
│   │   │   ├── data/      # GET/POST/PUT/DELETE — fan/ustoz/o'quvchi
│   │   │   └── settings/  # GET/POST — markaz ma'lumotlari
│   │   ├── admin/
│   │   │   ├── stats/     # GET — super admin umumiy statistika
│   │   │   └── centers/   # GET/DELETE — markazlar ro'yxati
│   │   ├── attendance/    # GET/POST — davomat
│   │   ├── payment/       # GET/POST/PUT — to'lovlar
│   │   ├── student/
│   │   │   └── dashboard/ # GET — talaba uchun to'liq ma'lumot
│   │   └── teacher/
│   │       └── courses/   # GET — o'qituvchi kurslari
│   ├── login/             # Login sahifasi
│   ├── register/          # Ro'yxatdan o'tish (2 bosqich)
│   ├── center/[id]/       # Markaz admin paneli
│   ├── admin/dashboard/   # Super admin paneli
│   ├── teacher/attendance/# O'qituvchi davomat sahifasi
│   └── student/dashboard/ # Talaba shaxsiy kabineti
├── components/
│   ├── Sidebar.tsx        # Umumiy sidebar
│   ├── Modal.tsx          # Qayta ishlatiladigan modal
│   ├── StatCard.tsx       # Statistika kartasi
│   └── MapPickerClient.tsx# Leaflet xarita (SSR-free)
├── lib/
│   ├── auth.ts            # JWT sign/verify/cookie
│   ├── prisma.ts          # Prisma singleton
│   ├── telegram.ts        # Telegram Bot helper
│   └── utils.ts           # Yordamchi funksiyalar
├── middleware.ts           # Rol asosida himoya
├── prisma/
│   ├── schema.prisma       # To'liq DB sxemasi
│   └── seed.ts             # Demo ma'lumotlar
└── types/index.ts          # TypeScript turlari
```

## O'rnatish

### 1. Talablar
- Node.js 18+
- PostgreSQL 14+

### 2. Loyihani clone qiling
```bash
git clone https://github.com/your-repo/zehn-uz.git
cd zehn-uz
npm install
```

### 3. .env faylini yarating
```bash
cp .env.example .env
```

`.env` faylini to'ldiring:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/zehn_db
JWT_SECRET=your-super-secret-key-minimum-32-chars
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ma'lumotlar bazasini sozlang
```bash
# Migratsiya
npm run db:push

# Demo ma'lumotlar
npm run db:seed
```

### 5. Ishga tushiring
```bash
npm run dev
```

## Demo hisoblar

| Rol | Login | Parol |
|-----|-------|-------|
| Super Admin | `superadmin` | `admin123` |
| Markaz Admin | `demo_admin` | `demo123` |
| O'qituvchi | `teacher_ali` | `teacher123` |
| O'quvchi | `student_bobur_demo` | `student123` |

## Telegram Bot

1. @BotFather orqali bot yarating
2. Token ni `.env` ga qo'ying
3. Webhook set qiling:
```bash
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://yourdomain.uz/api/bot"
```

## Production'ga deploy qilish

### Vercel
```bash
vercel --prod
```
Vercel dashboard'da environment variables qo'shing.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## API yo'nalishlari

### Auth
- `POST /api/login` — `{ username, password }` → JWT cookie
- `POST /api/logout` — Cookie o'chiradi
- `POST /api/register` — `{ centerName, adminName, username, password, phone }` → JWT cookie

### Markaz
- `GET /api/center/data?centerId=` — Barcha ma'lumotlar
- `POST /api/center/data` — `{ type: 'subject'|'teacher'|'student', centerId, ...fields }`
- `PUT /api/center/data` — `{ type, id, ...fields }`
- `DELETE /api/center/data` — `{ type, id }`

### Davomat
- `GET /api/attendance?courseId=&date=` — Davomat ma'lumotlari
- `POST /api/attendance` — `{ courseId, date, records: [{userId, status}] }`

### To'lov
- `GET /api/payment?centerId=` — To'lovlar ro'yxati
- `POST /api/payment` — Yangi to'lov
- `PUT /api/payment` — `{ id, status }` — Holat yangilash
