'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ticketNoteSchema,
  ticketActionSchema,
} from '@/lib/schema-validations/serviceTicket.schema';
import { serviceTicketApi } from '@/lib/api/serviceTicket.service';
import type {
  TicketDetail,
  TicketHistory,
  TicketCandidate,
} from '@/types/serviceTicket';
import Button from '@/components/buttons/Button';
import PageHeader from './PageHeader';
import Badge from './Badge';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
export default function ServiceTicketDetailPanel({
  id,
  admin = false,
  assigned = false,
}: {
  id: string;
  admin?: boolean;
  assigned?: boolean;
}) {
  const { data: session } = useSession(),
    token = session?.accessToken;
  const [ticket, setTicket] = useState<TicketDetail>(),
    [history, setHistory] = useState<TicketHistory>(),
    [candidates, setCandidates] = useState<TicketCandidate[]>(),
    [revision, setRevision] = useState(0),
    [historyPage, setHistoryPage] = useState(1),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [choice, setChoice] = useState(''),
    [action, setAction] = useState<
      'start' | 'resolve' | 'approve' | 'decline'
    >();
  const notes = useForm<{ note: string; visibility: 'PUBLIC' | 'INTERNAL' }>({
    resolver: zodResolver(ticketNoteSchema),
    defaultValues: { note: '', visibility: 'PUBLIC' },
  });
  const detail = useForm<{ note: string }>({
    resolver: zodResolver(ticketActionSchema),
    defaultValues: { note: '' },
  });
  useEffect(() => {
    if (!token) return;
    const c = new AbortController();
    Promise.all([
      serviceTicketApi.detail(token, id, c.signal),
      serviceTicketApi.history(token, id, historyPage, c.signal),
    ])
      .then(([t, h]) => {
        if (!c.signal.aborted) {
          setTicket(t.data);
          setHistory(h.data);
          setError('');
        }
      })
      .catch((e) => {
        if (!c.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'Unable to load service ticket',
          );
      });
    return () => c.abort();
  }, [token, id, revision, historyPage]);
  const reload = () => setRevision((v) => v + 1);
  const run = async (task: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await task();
      const [t, h] = await Promise.all([
        serviceTicketApi.detail(token!, id),
        serviceTicketApi.history(token!, id, 1),
      ]);
      setTicket(t.data);
      setHistory(h.data);
      setHistoryPage(1);
      setNotice(message);
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to update ticket. Reload and try again.',
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  const loadCandidates = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await serviceTicketApi.candidates(token!, id);
      setCandidates(r.data?.candidates ?? []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load service parties',
      );
    } finally {
      setBusy(false);
    }
  };
  const act = async (value: string) => {
    if (!ticket || !token || !action) return;
    const kind = action;
    const ok = await run(
      () =>
        kind === 'start'
          ? serviceTicketApi.status(token, ticket, 'IN_PROGRESS', value)
          : kind === 'resolve'
            ? serviceTicketApi.status(token, ticket, 'RESOLVED', value)
            : serviceTicketApi.warranty(
                token,
                ticket,
                kind === 'approve' ? 'APPROVED' : 'DECLINED',
                value,
              ),
      kind === 'start'
        ? 'Service work started.'
        : kind === 'resolve'
          ? 'Resolution recorded.'
          : 'Manual warranty assessment saved.',
    );
    if (ok) {
      setAction(undefined);
      detail.reset();
    }
  };
  const base = admin
    ? '/dashboard/admin/service-tickets'
    : assigned
      ? '/dashboard/service-management'
      : '/dashboard/service-tickets';
  if (!ticket)
    return error ? (
      <div role="alert" className="surface p-5">
        {error}
        <Button onClick={reload}>Retry ticket</Button>
      </div>
    ) : (
      <LoadingState label="Loading service ticket…" />
    );
  const p = ticket.permissions;
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={ticket.reference}
        title={ticket.subject}
        description={`${ticket.machine.name} · ${ticket.machine.model}`}
        actions={
          <Badge
            tone={
              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                ? 'success'
                : 'neutral'
            }
          >
            {ticket.status.replaceAll('_', ' ')}
          </Badge>
        }
      />
      <Link href={base} className="secondary-link">
        Back to service tickets
      </Link>
      {error && (
        <div role="alert" className="surface p-4 text-red-800">
          {error}
          <Button variant="secondary" onClick={reload}>
            Reload ticket
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {p.readOnlyReason && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Read-only: {p.readOnlyReason}
        </p>
      )}
      <section className="surface space-y-4 p-5">
        <h2 className="font-semibold">Service request</h2>
        <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
          {ticket.description}
        </p>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Customer</dt>
            <dd className="break-words font-medium">
              {ticket.customer.displayName}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Service party</dt>
            <dd className="break-words font-medium">
              {ticket.assignedTo?.displayName ?? 'Awaiting assignment'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Submitted</dt>
            <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Updated</dt>
            <dd>{new Date(ticket.updatedAt).toLocaleString()}</dd>
          </div>
          {ticket.resolvedAt && (
            <div>
              <dt className="text-slate-500">Resolved</dt>
              <dd>{new Date(ticket.resolvedAt).toLocaleString()}</dd>
            </div>
          )}
          {ticket.closedAt && (
            <div>
              <dt className="text-slate-500">Closed</dt>
              <dd>{new Date(ticket.closedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>
        <Link
          href={`/machinery/${ticket.machine.slug}`}
          className="text-sm underline"
        >
          View machinery catalogue page
        </Link>
        <p className="text-xs text-slate-500">
          Machinery may no longer be publicly listed; your service history
          remains available.
        </p>
      </section>
      <section className="surface space-y-3 p-5">
        <h2 className="font-semibold">Warranty review</h2>
        <Badge
          tone={
            ticket.warrantyAssessment === 'APPROVED' ? 'success' : 'neutral'
          }
        >
          {ticket.warrantyAssessment.replaceAll('_', ' ')}
        </Badge>
        {ticket.warrantyNote && (
          <p className="whitespace-pre-wrap break-words text-sm">
            {ticket.warrantyNote}
          </p>
        )}
        <p className="text-xs text-slate-500">
          Manual administrative assessment. No automatic warranty duration,
          coverage or service pricing is calculated.
        </p>
        {p.canAssessWarranty && (
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => {
                setAction('approve');
                detail.reset();
              }}
            >
              Approve warranty request
            </Button>
            <Button
              disabled={busy}
              variant="secondary"
              onClick={() => {
                setAction('decline');
                detail.reset();
              }}
            >
              Decline warranty request
            </Button>
          </div>
        )}
      </section>
      {ticket.resolution && (
        <section className="surface space-y-3 p-5">
          <h2 className="font-semibold">Resolution</h2>
          <p className="whitespace-pre-wrap break-words text-sm">
            {ticket.resolution}
          </p>
        </section>
      )}
      {(p.canReview ||
        p.canStart ||
        p.canResolve ||
        p.canClose ||
        p.canAssign) && (
        <section className="surface space-y-4 p-5">
          <h2 className="font-semibold">Service actions</h2>
          <div className="flex flex-wrap gap-2">
            {p.canReview && (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(
                    () =>
                      serviceTicketApi.status(token!, ticket, 'UNDER_REVIEW'),
                    'Ticket is under review.',
                  )
                }
              >
                Review ticket
              </Button>
            )}
            {p.canStart && (
              <Button
                disabled={busy}
                onClick={() => {
                  setAction('start');
                  detail.reset();
                }}
              >
                Start service work
              </Button>
            )}
            {p.canResolve && (
              <Button
                disabled={busy}
                onClick={() => {
                  setAction('resolve');
                  detail.reset();
                }}
              >
                Record resolution
              </Button>
            )}
            {p.canClose && (
              <Button
                disabled={busy}
                onClick={() =>
                  void run(
                    () => serviceTicketApi.status(token!, ticket, 'CLOSED'),
                    'Ticket closed.',
                  )
                }
              >
                Close ticket
              </Button>
            )}
            {p.canAssign && (
              <Button
                disabled={busy}
                variant="secondary"
                onClick={() => void loadCandidates()}
              >
                Choose service party
              </Button>
            )}
          </div>
          {p.canAssign && candidates && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (choice)
                  void run(
                    () => serviceTicketApi.assign(token!, ticket, choice),
                    'Service party assigned.',
                  ).then((ok) => {
                    if (ok) {
                      setCandidates(undefined);
                      setChoice('');
                    }
                  });
              }}
            >
              <label
                htmlFor="ticket-assignee"
                className="block text-sm font-medium"
              >
                Assign service party
              </label>
              <select
                id="ticket-assignee"
                required
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
                className="w-full"
              >
                <option value="">Choose an eligible service party</option>
                {candidates.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={!c.eligible || c.id === ticket.assignedTo?.id}
                  >
                    {c.displayName}
                    {c.supplier ? ` · ${c.supplier.companyName}` : ''}
                    {!c.eligible ? ' · Not currently eligible' : ''}
                  </option>
                ))}
              </select>
              {candidates
                .filter((c) => !c.eligible)
                .map((c) => (
                  <p key={c.id} className="text-xs text-amber-900">
                    {c.displayName}: {c.reason}
                  </p>
                ))}
              {!candidates.length && (
                <EmptyState
                  title="No eligible service parties"
                  description="An active original recipient or iMet salesperson is required."
                />
              )}
              <Button type="submit" disabled={busy || !choice}>
                Assign ticket
              </Button>
            </form>
          )}
        </section>
      )}
      {action && (
        <form
          className="surface space-y-3 p-5"
          onSubmit={detail.handleSubmit(({ note }) => act(note))}
        >
          <label htmlFor="ticket-action-note" className="block font-medium">
            {action === 'start'
              ? 'Diagnosis or service work'
              : action === 'resolve'
                ? 'Customer-visible resolution'
                : 'Warranty assessment explanation'}
          </label>
          <textarea
            id="ticket-action-note"
            rows={4}
            maxLength={
              action === 'approve' || action === 'decline' ? 2000 : 5000
            }
            {...detail.register('note')}
            aria-invalid={!!detail.formState.errors.note}
            aria-describedby="ticket-action-error"
            className="w-full"
          />
          <p id="ticket-action-error" className="text-sm text-red-700">
            {detail.formState.errors.note?.message}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={busy || detail.formState.isSubmitting}
            >
              Save{' '}
              {action === 'start'
                ? 'service work'
                : action === 'resolve'
                  ? 'resolution'
                  : 'warranty assessment'}
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setAction(undefined)}
            >
              Cancel action
            </Button>
          </div>
        </form>
      )}
      {p.canComment && (
        <form
          className="surface space-y-3 p-5"
          onSubmit={notes.handleSubmit(async (input) => {
            const ok = await run(
              () => serviceTicketApi.note(token!, ticket, input),
              'Update added.',
            );
            if (ok) notes.reset();
          })}
        >
          <label htmlFor="ticket-note" className="block font-medium">
            Progress update or comment
          </label>
          <textarea
            id="ticket-note"
            rows={4}
            maxLength={5000}
            {...notes.register('note')}
            aria-invalid={!!notes.formState.errors.note}
            aria-describedby="ticket-note-error"
            className="w-full"
          />
          <p id="ticket-note-error" className="text-sm text-red-700">
            {notes.formState.errors.note?.message}
          </p>
          {p.canInternalNote ? (
            <div>
              <label
                htmlFor="ticket-note-visibility"
                className="block text-sm font-medium"
              >
                Update visibility
              </label>
              <select
                id="ticket-note-visibility"
                {...notes.register('visibility')}
                className="mt-1 w-full"
              >
                <option value="PUBLIC">Customer-visible</option>
                <option value="INTERNAL">
                  Internal — current assignee and admin only
                </option>
              </select>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Your comment is visible to the customer and authorized service
              staff.
            </p>
          )}
          <Button type="submit" disabled={busy || notes.formState.isSubmitting}>
            Add update
          </Button>
        </form>
      )}
      <section className="surface space-y-4 p-5" aria-label="Ticket activity">
        <h2 className="font-semibold">Service progress & history</h2>
        {history?.events.map((e) => (
          <article key={e.id} className="border-l-2 border-slate-200 pl-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">
                {e.type.replaceAll('_', ' ')}
              </h3>
              {e.visibility === 'INTERNAL' && <Badge>Internal</Badge>}
            </div>
            <p className="text-xs text-slate-500">
              {e.actor.displayName} · {new Date(e.createdAt).toLocaleString()}
            </p>
            {e.assignedTo && (
              <p className="text-sm">Assigned to {e.assignedTo.displayName}</p>
            )}
            {e.toStatus && (
              <p className="text-xs text-slate-600">
                {e.fromStatus?.replaceAll('_', ' ')} →{' '}
                {e.toStatus.replaceAll('_', ' ')}
              </p>
            )}
            {e.note && (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                {e.note}
              </p>
            )}
          </article>
        ))}
        {history?.pagination && history.pagination.totalPages > 1 && (
          <nav
            aria-label="Ticket history pagination"
            className="flex flex-wrap items-center gap-3"
          >
            <Button
              variant="secondary"
              disabled={busy || historyPage <= 1}
              onClick={() => setHistoryPage((v) => v - 1)}
            >
              Previous activity
            </Button>
            <span>
              Page {historyPage} of {history.pagination.totalPages}
            </span>
            <Button
              variant="secondary"
              disabled={busy || historyPage >= history.pagination.totalPages}
              onClick={() => setHistoryPage((v) => v + 1)}
            >
              Next activity
            </Button>
          </nav>
        )}
      </section>
    </div>
  );
}
