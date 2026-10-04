'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import LoadingState from './LoadingState';
import RfqForm from '@/components/forms/RfqForm';
import RfqQuoteForm from '@/components/forms/RfqQuoteForm';
import { rfqApi } from '@/lib/api/rfq.service';
import type {
  RfqAttachment,
  RfqDetail,
  RfqMessage,
  RfqQuote,
} from '@/types/rfq';
export default function RfqDetailPanel({
  id,
  lead = false,
  admin = false,
}: {
  id: string;
  lead?: boolean;
  admin?: boolean;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [quote, setQuote] = useState<RfqQuote | true | null>(null);
  const [thread, setThread] = useState('');
  const [messages, setMessages] = useState<RfqMessage[]>([]);
  const [candidates, setCandidates] = useState<
    {
      id: string;
      displayName: string;
      supplier: { companyName: string } | null;
    }[]
  >([]);
  const reload = useCallback(async () => {
    if (!token) return;
    const r = await rfqApi.detail(token, id, lead);
    setRfq(r.data ?? null);
  }, [token, id, lead]);
  useEffect(() => {
    if (!token) return;
    let active = true;
    rfqApi
      .detail(token, id, lead)
      .then((r) => {
        if (active) setRfq(r.data ?? null);
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Unable to load RFQ');
      });
    return () => {
      active = false;
    };
  }, [token, id, lead]);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    if (!token || !rfq || !thread) return;
    let active = true;
    rfqApi
      .messages(token, rfq.id, thread)
      .then((r) => {
        if (active) setMessages((r.data ?? []).reverse());
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Unable to load messages');
      });
    return () => {
      active = false;
    };
  }, [token, rfq, thread]);
  if (!rfq)
    return (
      <>
        {error ? (
          <div role="alert" className="surface p-5">
            {error}
            <Button onClick={() => void run(reload)}>Retry</Button>
          </div>
        ) : (
          <LoadingState label="Loading private RFQ…" />
        )}
      </>
    );
  if (!token) return null;
  const owner = !lead && !admin;
  const salesperson =
    lead && rfq.recipients[0]?.recipientRole === 'SALESPERSON';
  const open =
    ['ROUTED', 'QUOTED'].includes(rfq.status) &&
    !rfq.isFlagged &&
    !!rfq.expiresAt &&
    new Date(rfq.expiresAt) > new Date();
  const upload = (file: File | undefined, target: string, isQuote = false) => {
    if (file) void run(() => rfqApi.upload(token, target, file, isQuote));
  };
  const files = (attachments: RfqAttachment[], isQuote = false) => (
    <ul className="mt-2 space-y-2">
      {attachments.map((f) => (
        <li key={f.id}>
          <button
            type="button"
            className="text-sm font-medium text-orange-dark underline"
            onClick={() => void run(() => rfqApi.download(token, f, isQuote))}
          >
            {f.fileName} · {Math.ceil(f.fileSize / 1024)} KB
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={rfq.rfqNumber}
        title={rfq.title}
        description={`${rfq.status} · ${rfq.buyer.displayName}`}
      />
      <Link
        href={
          admin
            ? '/dashboard/admin/rfqs'
            : lead
              ? '/dashboard/leads'
              : '/dashboard/rfqs'
        }
        className="text-sm underline"
      >
        Back to {lead ? 'leads' : 'RFQs'}
      </Link>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {rfq.isFlagged && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          This RFQ is flagged for review. Responses are paused.
          {admin && ` ${rfq.flagReason ?? ''}`}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {owner && rfq.status === 'DRAFT' && (
          <>
            <Button
              disabled={busy}
              onClick={() =>
                void run(() => rfqApi.action(token, rfq, 'submit'))
              }
            >
              Submit RFQ
            </Button>
            <Button variant="secondary" onClick={() => setEdit(!edit)}>
              Edit draft
            </Button>
          </>
        )}
        {owner &&
          !['CLOSED', 'CANCELLED', 'EXPIRED', 'ACCEPTED'].includes(
            rfq.status,
          ) && (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                void run(() => rfqApi.action(token, rfq, 'cancel'))
              }
            >
              Cancel RFQ
            </Button>
          )}
        {owner && rfq.status === 'ACCEPTED' && (
          <Button
            disabled={busy}
            onClick={() => void run(() => rfqApi.action(token, rfq, 'close'))}
          >
            Close completed RFQ
          </Button>
        )}
        {lead && open && rfq.recipients[0]?.leadStatus === 'NEW' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void run(() => rfqApi.viewed(token, id))}
          >
            Mark viewed
          </Button>
        )}
        {lead &&
          open &&
          rfq.recipients[0] &&
          !['DECLINED', 'CLOSED'].includes(rfq.recipients[0].leadStatus) && (
            <>
              <Button
                disabled={
                  busy ||
                  rfq.recipients[0].quotes.some((q) => q.status === 'PENDING')
                }
                onClick={() => setQuote(true)}
              >
                Create quote
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void run(() => rfqApi.decline(token, id))}
              >
                Decline lead
              </Button>
            </>
          )}
      </div>
      {admin &&
        !['CLOSED', 'CANCELLED', 'EXPIRED', 'DECLINED'].includes(
          rfq.status,
        ) && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => void run(() => rfqApi.action(token, rfq, 'close'))}
            >
              Force close RFQ
            </Button>
            {rfq.status !== 'ACCEPTED' && (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() =>
                  void run(() => rfqApi.action(token, rfq, 'cancel'))
                }
              >
                Cancel RFQ
              </Button>
            )}
          </div>
        )}
      {owner && rfq.recipients.some((r) => r.quotes.length) && (
        <section className="surface p-5">
          <h2 className="mb-3 font-semibold">Compare quotes</h2>
          <p className="mb-4 text-xs text-slate-500">
            Prices use each quote’s currency. Compare commercial terms before
            accepting.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rfq.recipients.flatMap((r) =>
              r.quotes.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <h3 className="font-semibold">{r.name}</h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-slate-500">Unit price</dt>
                      <dd>
                        {q.unitPrice} {q.currency}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">MOQ / lead time</dt>
                      <dd>
                        {q.moq} / {q.leadTimeDays} days
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Validity / status</dt>
                      <dd>
                        {new Date(q.validUntil).toLocaleDateString()} /{' '}
                        {q.status}
                      </dd>
                    </div>
                  </dl>
                </div>
              )),
            )}
          </div>
        </section>
      )}
      {edit && (
        <RfqForm
          rfq={rfq}
          onSave={() => {
            setEdit(false);
            void run(reload);
          }}
          onCancel={() => setEdit(false)}
        />
      )}
      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">Request details</h2>
        <p className="whitespace-pre-wrap text-sm">{rfq.description}</p>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Quantity</dt>
            <dd>
              {rfq.quantity} {rfq.unit}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Machinery / category</dt>
            <dd>
              {rfq.machine?.name ?? rfq.category?.name ?? 'General request'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Delivery</dt>
            <dd>
              {rfq.deliveryLocation}
              <br />
              {rfq.deliveryTimeline}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Expires</dt>
            <dd>
              {rfq.expiresAt
                ? new Date(rfq.expiresAt).toLocaleString()
                : 'Not submitted'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Supplier preference / language</dt>
            <dd>
              {rfq.supplierCountry ?? 'Any country'} / {rfq.preferredLanguage}
            </dd>
          </div>
          {'targetBudget' in rfq && (
            <div>
              <dt className="text-slate-500">Private target budget</dt>
              <dd>
                {rfq.targetBudget
                  ? `${rfq.targetBudget} ${rfq.budgetCurrency}`
                  : 'Not specified'}
              </dd>
            </div>
          )}
        </dl>
        <h3 className="font-medium">Private attachments</h3>
        {files(rfq.attachments)}
        {!rfq.attachments.length && (
          <p className="text-sm text-slate-500">No attachments.</p>
        )}
        {owner && rfq.status === 'DRAFT' && (
          <label className="block text-sm">
            Add PDF, PNG or JPEG (up to 10 MB)
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              disabled={busy}
              className="mt-2 block w-full"
              onChange={(e) => {
                upload(e.target.files?.[0], rfq.id);
                e.target.value = '';
              }}
            />
          </label>
        )}
      </section>
      {quote && (
        <section className="surface p-5">
          <h2 className="mb-4 font-semibold">
            {quote === true ? 'Create' : 'Edit'} private quote
          </h2>
          <RfqQuoteForm
            token={token}
            rfqId={rfq.id}
            quote={quote === true ? undefined : quote}
            onSave={() => {
              setQuote(null);
              void run(reload);
            }}
            onCancel={() => setQuote(null)}
          />
        </section>
      )}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {lead
            ? 'Your quotes and conversation'
            : 'Recipients and quote comparison'}
        </h2>
        {!rfq.recipients.length && (
          <p className="surface p-5 text-sm text-slate-500">
            {rfq.status === 'DRAFT'
              ? 'Recipients are assigned on submission.'
              : 'No recipients assigned. An administrator can review routing.'}
          </p>
        )}
        {rfq.recipients.map((r) => (
          <article key={r.id} className="surface space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                {r.name} {r.isVerified ? '· Verified' : ''}
              </h3>
              <span className="text-xs text-slate-500">
                {r.recipientRole} · {r.leadStatus}
                {r.removedAt ? ' · Removed' : ''}
              </span>
            </div>
            {r.contact && (
              <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                <h4 className="font-semibold">Approved supplier contact</h4>
                <p>
                  {r.contact.contactName} · {r.contact.email} ·{' '}
                  {r.contact.phone}
                </p>
                <p>{r.contact.address}</p>
              </div>
            )}
            {r.buyerContact && (
              <p className="text-sm">Buyer contact: {r.buyerContact.email}</p>
            )}
            {!r.contact && !lead && (
              <p className="text-xs text-slate-500">
                Private contact is revealed only for the accepted quote when
                supplier permissions allow it.
              </p>
            )}
            {!r.quotes.length && (
              <p className="text-sm text-slate-500">No quote received.</p>
            )}
            {r.quotes.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-lg font-semibold">
                    {q.unitPrice}{' '}
                    <span className="text-xs">
                      {q.currency} / {rfq.unit}
                    </span>
                  </p>
                  <span className="text-xs">{q.status}</span>
                </div>
                <p className="mt-2 text-sm">
                  MOQ {q.moq} · Lead time {q.leadTimeDays} days · Valid until{' '}
                  {new Date(q.validUntil).toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                  {q.notes}
                </p>
                {files(q.attachments, true)}
                <div className="mt-3 flex flex-wrap gap-2">
                  {owner && open && q.status === 'PENDING' && (
                    <>
                      <Button
                        disabled={busy || new Date(q.validUntil) <= new Date()}
                        onClick={() =>
                          void run(() => rfqApi.quoteAction(token, q, 'accept'))
                        }
                      >
                        Accept quote
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void run(() => rfqApi.quoteAction(token, q, 'reject'))
                        }
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {lead && open && q.status === 'PENDING' && (
                    <>
                      <Button variant="secondary" onClick={() => setQuote(q)}>
                        Edit quote
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() =>
                          void run(() =>
                            rfqApi.quoteAction(token, q, 'withdraw'),
                          )
                        }
                      >
                        Withdraw
                      </Button>
                      <label className="text-sm">
                        Attach quote document
                        <input
                          type="file"
                          accept="application/pdf,image/png,image/jpeg"
                          disabled={busy}
                          onChange={(e) => {
                            upload(e.target.files?.[0], q.id, true);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            ))}
            {(!r.removedAt || owner || admin) && (
              <Button
                variant="secondary"
                onClick={() => setThread(thread === r.id ? '' : r.id)}
              >
                {thread === r.id ? 'Hide' : 'Open'} private conversation
              </Button>
            )}
            {admin && !r.removedAt && open && (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() =>
                  void run(() =>
                    rfqApi.route(token, rfq, [r.recipientId], true),
                  )
                }
              >
                Remove recipient
              </Button>
            )}
            {thread === r.id && (
              <div className="space-y-3 border-t border-slate-200 pt-4">
                <p className="text-xs text-slate-500">
                  Only this recipient, the buyer, and administrators can see
                  this thread. Showing the latest 100 messages.
                </p>
                <ol className="max-h-80 space-y-3 overflow-y-auto">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-lg bg-slate-50 p-3 text-sm"
                    >
                      <p className="text-xs font-medium text-slate-500">
                        {m.sender.displayName} ·{' '}
                        {new Date(m.createdAt).toLocaleString()}{' '}
                        {m.readAt ? '· Read' : ''}
                      </p>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                    </li>
                  ))}
                </ol>
                {['ROUTED', 'QUOTED', 'ACCEPTED'].includes(rfq.status) &&
                  !rfq.isFlagged &&
                  !r.removedAt && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const body = String(
                          new FormData(form).get('body') ?? '',
                        );
                        void run(async () => {
                          await rfqApi.message(token, rfq.id, r.id, body);
                          form.reset();
                        });
                      }}
                    >
                      <label
                        htmlFor={`message-${r.id}`}
                        className="text-sm font-medium"
                      >
                        Message
                      </label>
                      <textarea
                        id={`message-${r.id}`}
                        name="body"
                        required
                        maxLength={5000}
                        rows={3}
                        className="mt-1 w-full"
                      />
                      <Button type="submit" disabled={busy}>
                        Send message
                      </Button>
                    </form>
                  )}
              </div>
            )}
          </article>
        ))}
      </section>
      {(admin || salesperson) && (
        <section className="surface space-y-4 p-5">
          <h2 className="font-semibold">
            {admin ? 'Admin controls' : 'Manual routing'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {admin && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void run(() => rfqApi.reroute(token, rfq))}
              >
                Run automatic routing
              </Button>
            )}
            {admin && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void run(() => rfqApi.resend(token, rfq))}
              >
                Resend notifications
              </Button>
            )}
          </div>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void run(async () => {
                const result = await rfqApi.candidates(
                  token,
                  String(data.get('q') ?? ''),
                );
                setCandidates(result.data ?? []);
              });
            }}
          >
            <label className="flex-1 text-sm">
              Find recipient
              <input name="q" maxLength={100} className="mt-1 w-full" />
            </label>
            <Button type="submit" variant="secondary" disabled={busy}>
              Search recipients
            </Button>
          </form>
          {candidates.length > 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const userIds = new FormData(e.currentTarget)
                  .getAll('recipient')
                  .map(String);
                if (userIds.length)
                  void run(() => rfqApi.route(token, rfq, userIds));
              }}
            >
              <fieldset className="max-h-64 space-y-2 overflow-y-auto">
                <legend className="text-sm font-medium">
                  Select eligible recipients
                </legend>
                {candidates.map((c) => (
                  <label key={c.id} className="block text-sm">
                    <input type="checkbox" name="recipient" value={c.id} />{' '}
                    {c.supplier?.companyName ?? c.displayName}
                  </label>
                ))}
              </fieldset>
              <Button type="submit" disabled={busy}>
                Assign selected
              </Button>
            </form>
          )}
          {admin && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const d = new FormData(e.currentTarget);
                void run(() =>
                  rfqApi.flag(
                    token,
                    rfq,
                    !rfq.isFlagged,
                    String(d.get('reason') ?? ''),
                    d.get('block') === 'on',
                  ),
                );
              }}
              className="space-y-2"
            >
              <label className="block text-sm">
                Review reason
                <textarea
                  name="reason"
                  required
                  maxLength={2000}
                  className="mt-1 w-full"
                />
              </label>
              <label className="block text-sm">
                <input type="checkbox" name="block" /> Also{' '}
                {rfq.isFlagged ? 'unblock' : 'block'} routed supplier contact
                disclosure
              </label>
              <Button type="submit" variant="danger" disabled={busy}>
                {rfq.isFlagged ? 'Clear flag' : 'Flag RFQ'}
              </Button>
            </form>
          )}
        </section>
      )}
      <section className="surface p-5">
        <h2 className="mb-3 font-semibold">Activity timeline</h2>
        <ol className="space-y-3 text-sm">
          {rfq.events.map((e) => (
            <li key={e.id}>
              <span className="font-medium">
                {e.eventType.replaceAll('_', ' ')}
              </span>
              <time className="ml-2 text-xs text-slate-500">
                {new Date(e.createdAt).toLocaleString()}
              </time>
              {admin && e.metadata != null && (
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-xs text-slate-500">
                  {JSON.stringify(e.metadata, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
