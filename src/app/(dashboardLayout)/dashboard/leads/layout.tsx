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
  const response = await authService.me(session.accessToken);
  if (
    !response.data?.roles.some((r) =>
      [
        'LOCAL_SUPPLIER',
        'INTERNATIONAL_MANUFACTURER',
        'INDEPENDENT_SELLER',
        'SALES_PERSON',
      ].includes(r),
    )
  )
    return <h1>Access restricted for this workspace</h1>;
  return children;
}
