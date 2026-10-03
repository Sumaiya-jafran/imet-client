import AuthForm from '@/components/forms/AuthForm';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AuthForm mode="reset-password" token={token} />;
}
