import RfqDetailPanel from '@/components/shared/RfqDetailPanel';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RfqDetailPanel id={id} admin />;
}
