import VerifyEmail from '@/components/forms/VerifyEmail';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmail token={token} />;
}
