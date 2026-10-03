import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { authService } from '@/lib/api/auth.service';
import CatalogueManagement from './CatalogueManagement';
export const metadata = { title: 'Manage catalogue | iMet Machinery' };
export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  const response = await authService.me(session.accessToken);
  if (!response.data?.roles.includes('ADMIN'))
    return <h1>Access restricted to administrators</h1>;
  return <CatalogueManagement />;
}
