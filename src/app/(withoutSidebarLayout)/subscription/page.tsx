import SupplierOnboarding from '@/components/shared/SupplierOnboarding';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return <SupplierOnboarding initialPlan={plan} />;
}
