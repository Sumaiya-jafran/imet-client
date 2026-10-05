import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { authService } from '@/lib/api/auth.service';
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  const user = (await authService.me(session.accessToken)).data;
  if (!user?.roles.some((r) => ['BUYER'].includes(r)))
    return <h1>Access restricted for this workspace</h1>;
  return children;
}
