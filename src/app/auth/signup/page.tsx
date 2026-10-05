import AuthForm from '@/components/forms/AuthForm';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthForm
      mode="signup"
      callbackUrl={params.callbackUrl}
      oauthError={params.error}
      googleEnabled={Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      )}
    />
  );
}
