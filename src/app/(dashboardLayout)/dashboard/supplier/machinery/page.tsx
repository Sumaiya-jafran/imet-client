import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { authService } from '@/lib/api/auth.service';
import CatalogueManagement from '@/app/(dashboardLayout)/dashboard/admin/catalogue/CatalogueManagement';
import Link from 'next/link';
export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  const user = (await authService.me(session.accessToken)).data;
  if (
    !user?.roles.some((role) =>
      ['LOCAL_SUPPLIER', 'INTERNATIONAL_MANUFACTURER'].includes(role),
    )
  )
    return (
      <section>
        <h1>Supplier approval required</h1>
        <Link href="/dashboard/supplier" className="underline">
          View your supplier application
        </Link>
      </section>
    );
  return (
    <>
      <Link href="/dashboard/supplier" className="mb-5 inline-block underline">
        Back to supplier account
      </Link>
      <CatalogueManagement supplierMode />
    </>
  );
}
