import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { authService } from '@/lib/api/auth.service';
import Header from '@/components/shared/Header';
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error) redirect('/auth/signin');
  try {
    await authService.me(session.accessToken);
  } catch {
    redirect('/auth/signin');
  }
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-12">{children}</main>
    </>
  );
}
