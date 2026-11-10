'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import { apiClient } from '@/lib/api/client';
export default function MachineContact({
  id,
  slug,
  supplierId,
}: {
  id: string;
  slug: string;
  supplierId: string;
}) {
  const { data: session } = useSession();
  const [message, setMessage] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [error, setError] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  return (
    <section
      id="contact-supplier"
      data-listing-id={id}
      data-supplier-id={supplierId}
      className="surface mt-6 space-y-4 p-5 sm:p-7"
    >
      <h2 className="text-card font-semibold">Contact Supplier</h2>
      <Button disabled title="Direct chat will be available in M6">
        Chat with Supplier — coming soon
      </Button>
      <p className="text-nav text-muted">
        Chat is not available yet. Send an email enquiry; the supplier can reply
        directly to your verified email address.
      </p>
      {!session?.accessToken ? (
        <Link
          className="font-semibold text-secondary underline"
          href={`/auth/signin?callbackUrl=${encodeURIComponent(`/machinery/${slug}#contact-supplier`)}`}
        >
          Sign in to Send an Email
        </Link>
      ) : (
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError('');
            try {
              const r = await apiClient.post(
                `/catalogue/machines/${id}/contact-email`,
                { message, consent, idempotencyKey: key },
                { headers: { Authorization: `Bearer ${session.accessToken}` } },
              );
              setStatus(r.message);
              setMessage('');
              setConsent(false);
              setKey(crypto.randomUUID());
            } catch (e) {
              setError(
                e instanceof Error ? e.message : 'Unable to queue email',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="block">
            Your email message
            <textarea
              required
              minLength={10}
              maxLength={4000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setKey(crypto.randomUUID());
              }}
              className="mt-1 w-full"
            />
          </label>
          <label className="flex items-start gap-2">
            <input
              required
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Share my verified email address with this supplier so they can
            reply.
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Queuing email…' : 'Send an Email'}
          </Button>
        </form>
      )}
      {status && (
        <p role="status" className="text-secondary">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-danger-foreground">
          {error}
        </p>
      )}
    </section>
  );
}
