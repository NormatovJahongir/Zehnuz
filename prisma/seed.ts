import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hash = (pw: string) => bcrypt.hash(pw, 10);

  // Super admin
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username:  'superadmin',
      password:  await hash('admin123'),
      firstName: 'Super',
      lastName:  'Admin',
      role:      Role.SUPER_ADMIN,
    },
  });

  // Demo center
  const center = await prisma.center.upsert({
    where:  { id: 'demo-center-001' },
    update: {},
    create: {
      id:          'demo-center-001',
      name:        'Starlight Academy',
      description: 'Matematika va ingliz tili kurslari',
      address:     'Toshkent, Yunusobod tumani',
      phone:       '+998901234567',
      latitude:    41.3111,
      longitude:   69.2797,
    },
  });

  // Center admin
  const centerAdmin = await prisma.user.upsert({
    where: { username: 'demo_admin' },
    update: {},
    create: {
      username:  'demo_admin',
      password:  await hash('demo123'),
      firstName: 'Alisher',
      lastName:  'Rahimov',
      role:      Role.ADMIN,
      centerId:  center.id,
      phone:     '+998901111111',
    },
  });

  // Subjects
  const math = await prisma.subject.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Matematika', price: 500000, durationMonths: 6, centerId: center.id, description: 'Chuqur matematika kursi' },
  });
  const eng = await prisma.subject.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Ingliz tili', price: 400000, durationMonths: 3, centerId: center.id, description: 'IELTS va suhbat' },
  });

  // Teacher
  const teacherUser = await prisma.user.upsert({
    where: { username: 'teacher_ali' },
    update: {},
    create: {
      username:  'teacher_ali',
      password:  await hash('teacher123'),
      firstName: 'Aliya',
      lastName:  'Nazarova',
      role:      Role.TEACHER,
      centerId:  center.id,
      phone:     '+998902222222',
    },
  });

  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: { userId: teacherUser.id, experienceYears: 5, bio: 'IELTS 7.5 band' },
  });

  // Course
  const course = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id:        1,
      title:     'Matematika - 1-guruh',
      centerId:  center.id,
      subjectId: math.id,
      teacherId: teacherProfile.id,
    },
  });

  // Students
  const studentNames = [
    ['Bobur', 'Toshmatov'],
    ['Malika', 'Yusupova'],
    ['Jasur', 'Mirzayev'],
    ['Dilnoza', 'Karimova'],
  ];

  for (const [i, [firstName, lastName]] of studentNames.entries()) {
    const username = `student_${firstName.toLowerCase()}_demo`;
    const student = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password:  await hash('student123'),
        firstName,
        lastName,
        role:      Role.STUDENT,
        centerId:  center.id,
        phone:     `+99890300000${i + 1}`,
      },
    });

    // Enrollment
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
      update: {},
      create: { userId: student.id, courseId: course.id },
    });

    // Payment
    await prisma.payment.create({
      data: {
        userId:   student.id,
        centerId: center.id,
        amount:   500000,
        status:   i % 2 === 0 ? 'PAID' : 'PENDING',
        description: `${firstName} - Matematika kursi`,
        paidAt: i % 2 === 0 ? new Date() : null,
      },
    }).catch(() => {});
  }

  console.log('✅ Seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Super admin:   superadmin / admin123');
  console.log('  Center admin:  demo_admin / demo123');
  console.log('  Teacher:       teacher_ali / teacher123');
  console.log('  Students:      student_bobur_demo / student123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
