import SubscriptionPaymentStatus from '@/components/shared/SubscriptionPaymentStatus';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <SubscriptionPaymentStatus id={(await params).id} />;
}
