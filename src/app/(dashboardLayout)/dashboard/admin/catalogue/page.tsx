import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { authService } from '@/lib/api/auth.service';
import CatalogueManagement from './CatalogueManagement';
export const metadata = { title: 'Manage catalogue | Machinmate' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ supplierId?: string }>;
}) {
  const query = await searchParams;
  const supplierId =
    query.supplierId && /^[0-9a-f-]{36}$/i.test(query.supplierId)
      ? query.supplierId
      : undefined;
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  const response = await authService.me(session.accessToken);
  if (!response.data?.roles.includes('ADMIN'))
    return <h1>Access restricted to administrators</h1>;
  return <CatalogueManagement supplierId={supplierId} />;
}
