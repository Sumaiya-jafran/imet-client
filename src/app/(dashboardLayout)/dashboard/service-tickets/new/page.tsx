import ServiceTicketForm from '@/components/forms/ServiceTicketForm';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saleId?: string; machine?: string }>;
}) {
  const q = await searchParams;
  return <ServiceTicketForm saleId={q.saleId} machine={q.machine} />;
}
