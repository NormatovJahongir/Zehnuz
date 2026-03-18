import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function RootPage() {
  const session = await getSession();

  if (!session) redirect('/login');

  switch (session.role) {
    case 'SUPER_ADMIN': redirect('/admin/dashboard');
    case 'ADMIN':       redirect(`/center/${session.centerId}`);
    case 'TEACHER':     redirect('/teacher/attendance');
    case 'STUDENT':     redirect('/student/dashboard');
    default:            redirect('/login');
  }
}
