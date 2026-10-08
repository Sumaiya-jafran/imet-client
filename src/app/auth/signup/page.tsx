import SupplierSignup from '@/components/forms/SupplierSignup';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    type?: string;
    planId?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <SupplierSignup
      initialSupplier={params.type === 'supplier'}
      initialPlan={params.planId}
      callbackUrl={params.callbackUrl}
      oauthError={params.error}
      googleEnabled={Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      )}
    />
  );
}
