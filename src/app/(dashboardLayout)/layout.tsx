import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import { authService } from '@/lib/api/auth.service';
import DashboardShell from '@/components/shared/DashboardShell';
import type { CurrentUser } from '@/types/auth';
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error) redirect('/auth/signin');
  let user: CurrentUser;
  try {
    user = (await authService.me(session.accessToken)).data!;
  } catch {
    redirect('/auth/signin');
  }
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
