import ServiceTicketDetailPanel from '@/components/shared/ServiceTicketDetailPanel';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ServiceTicketDetailPanel id={(await params).id} assigned />;
}
