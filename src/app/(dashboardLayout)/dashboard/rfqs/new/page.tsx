import RfqForm from '@/components/forms/RfqForm';
import PageHeader from '@/components/shared/PageHeader';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const machineSlug =
    typeof query.machine === 'string' &&
    query.machine.length <= 220 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(query.machine)
      ? query.machine
      : undefined;
  return (
    <div>
      <PageHeader
        eyebrow="Buyer workspace"
        title="Request a quotation"
        description="Tell suppliers what you need. Pricing and conversations stay private."
      />
      <RfqForm machineSlug={machineSlug} />
    </div>
  );
}
