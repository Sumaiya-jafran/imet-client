import SalesOpportunityPanel from '@/components/shared/SalesOpportunityPanel';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SalesOpportunityPanel id={id} />;
}
