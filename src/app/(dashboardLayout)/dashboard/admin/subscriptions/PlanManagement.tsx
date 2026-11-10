'use client';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import SortablePlan from '@/components/shared/SortablePlan';
import { apiClient } from '@/lib/api/client';
import BillingAdministration from '@/components/shared/BillingAdministration';
import LoadingState from '@/components/shared/LoadingState';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Button from '@/components/buttons/Button';
import SubscriptionPlanForm from '@/components/forms/SubscriptionPlanForm';
import { supplierApi } from '@/lib/api/supplier.service';
import type { SubscriptionPlan } from '@/types/supplier';
import Link from 'next/link';
export default function PlanManagement() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState<{
    plan: SubscriptionPlan;
    archive: boolean;
  }>();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (removing) dialog.current?.showModal();
  }, [removing]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editor, setEditor] = useState<{ plan?: SubscriptionPlan }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!token || session?.error) return;
    let active = true;
    supplierApi
      .adminPlans(token)
      .then((response) => {
        if (active) {
          setPlans(response.data ?? []);
          setDirty(false);
          setLoading(false);
          setError('');
        }
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load plans');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, session?.error, revision]);
  const reload = () => {
    setLoading(true);
    setRevision((n) => n + 1);
  };
  const move = (index: number, direction: number) => {
    setPlans((p) => arrayMove(p, index, index + direction));
    setDirty(true);
  };
  const mutate = async (path: string, method: string, body: unknown) => {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      await apiClient.request(path, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      setNotice(
        'Plan changes saved. Existing subscription history is preserved.',
      );
      reload();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save changes');
      return false;
    } finally {
      setBusy(false);
    }
  };
  if (!token || session?.error) return <p role="alert">Sign in again.</p>;
  return (
    <div className="space-y-6">
      <dialog
        ref={dialog}
        onClose={() => setRemoving(undefined)}
        aria-labelledby="plan-confirm-title"
        aria-describedby="plan-confirm-description"
        className="m-auto max-w-lg rounded-xl border border-border bg-surface p-6 text-foreground backdrop:bg-primary/40"
      >
        {removing && (
          <>
            <h2 id="plan-confirm-title" className="text-card font-semibold">
              {removing.archive ? 'Archive' : 'Delete'} {removing.plan.name}?
            </h2>
            <p id="plan-confirm-description" className="my-4">
              {removing.plan.deletionReason ??
                'Permanent deletion is allowed only if the plan has no subscription or payment history. This cannot be undone.'}{' '}
              {removing.archive
                ? 'Existing terms and payments will remain intact. New purchases will be disabled.'
                : ''}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </Button>
              {!removing.plan.isFree && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={async () => {
                    const archive =
                      removing.archive || removing.plan.canDelete === false;
                    await mutate(
                      `/admin/subscriptions/plans/${removing.plan.id}${archive ? '/archive' : ''}`,
                      archive ? 'POST' : 'DELETE',
                      { updatedAt: removing.plan.updatedAt },
                    );
                    dialog.current?.close();
                  }}
                >
                  {removing.archive || removing.plan.canDelete === false
                    ? 'Archive plan'
                    : 'Permanently delete unused plan'}
                </Button>
              )}
            </div>
          </>
        )}
      </dialog>
      {notice && (
        <p role="status" className="text-secondary">
          {notice}
        </p>
      )}
      <PageHeader
        title="Subscription plans"
        eyebrow="Administration"
        description="Define supplier eligibility, terms and marketplace entitlements."
      />
      <Link href="/dashboard/admin/suppliers" className="underline">
        Manage suppliers and subscriptions
      </Link>
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button variant="secondary" onClick={reload}>
            Reload plans
          </Button>
        </div>
      )}
      {editor ? (
        <section className="surface p-5">
          <SubscriptionPlanForm
            key={editor.plan?.updatedAt ?? 'new'}
            token={token}
            plan={editor.plan}
            onSave={() => {
              setEditor(undefined);
              reload();
            }}
            onCancel={() => setEditor(undefined)}
          />
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={dirty || busy} onClick={() => setEditor({})}>
              Create plan
            </Button>
            <Button
              variant="secondary"
              disabled={!dirty || busy}
              onClick={() =>
                void mutate('/admin/subscriptions/plans/order', 'PUT', {
                  items: plans.map((p) => ({
                    id: p.id,
                    updatedAt: p.updatedAt,
                  })),
                })
              }
            >
              Save plan order
            </Button>
            {dirty && (
              <Button variant="ghost" onClick={reload}>
                Discard order changes
              </Button>
            )}
          </div>
          <p className="text-meta text-muted">
            Drag a plan handle, use keyboard Space/arrow keys, or use Move
            up/down. Save the order to apply it to public pricing.
          </p>
          {loading ? (
            <LoadingState label="Loading plans…" />
          ) : (
            <DndContext
              id="subscription-plan-order"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id) {
                  const old = plans.findIndex((p) => p.id === active.id),
                    next = plans.findIndex((p) => p.id === over.id);
                  setPlans((p) => arrayMove(p, old, next));
                  setDirty(true);
                }
              }}
            >
              <SortableContext
                items={plans.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {plans.map((plan, index) => (
                    <SortablePlan
                      key={plan.id}
                      id={plan.id}
                      name={plan.name}
                      first={index === 0}
                      last={index === plans.length - 1}
                      disabled={busy || loading}
                      onMove={(direction) => move(index, direction)}
                    >
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <span className="eyebrow">Supplier plan</span>
                        <Badge tone={plan.isActive ? 'success' : 'neutral'}>
                          {plan.archivedAt
                            ? 'Archived'
                            : plan.isActive
                              ? 'Active'
                              : 'Inactive'}
                        </Badge>
                      </div>
                      <h2 className="break-words text-card font-semibold">
                        {plan.name}
                      </h2>
                      <p className="mt-4 break-words text-section font-bold tracking-tight text-primary">
                        {plan.price}{' '}
                        <span className="text-meta font-medium tracking-normal text-muted-foreground">
                          {plan.currency} / {plan.durationDays} days
                        </span>
                      </p>
                      <dl className="my-5 grid grid-cols-2 gap-3 border-y border-surface-muted py-4">
                        <div>
                          <dt>Listing capacity</dt>
                          <dd className="mt-1 font-semibold">
                            {plan.listingLimit} machines
                          </dd>
                        </div>
                        <div>
                          <dt>Visibility</dt>
                          <dd className="mt-1 text-meta font-semibold">
                            {plan.visibility}
                          </dd>
                        </div>
                      </dl>
                      <p className="text-meta text-muted-foreground">
                        Eligibility:{' '}
                        {plan.eligibleTypes
                          .map((type) =>
                            type === 'LOCAL'
                              ? 'Local suppliers'
                              : 'International manufacturers',
                          )
                          .join(', ')}
                      </p>
                      <Button
                        variant="secondary"
                        className="mt-4 w-full"
                        disabled={dirty || busy}
                        onClick={() => setEditor({ plan })}
                      >
                        Edit plan
                      </Button>
                      <label className="mt-3 flex items-center gap-2 text-nav">
                        <input
                          type="checkbox"
                          checked={plan.showOnHomepage ?? true}
                          disabled={dirty || busy}
                          onChange={async (e) => {
                            const checked = e.target.checked;
                            setPlans((items) =>
                              items.map((p) =>
                                p.id === plan.id
                                  ? { ...p, showOnHomepage: checked }
                                  : p,
                              ),
                            );
                            const saved = await mutate(
                              `/admin/subscriptions/plans/${plan.id}/homepage`,
                              'PATCH',
                              {
                                showOnHomepage: checked,
                                updatedAt: plan.updatedAt,
                              },
                            );
                            if (!saved)
                              setPlans((items) =>
                                items.map((p) =>
                                  p.id === plan.id
                                    ? {
                                        ...p,
                                        showOnHomepage: plan.showOnHomepage,
                                      }
                                    : p,
                                ),
                              );
                          }}
                        />{' '}
                        Show on homepage
                      </label>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="danger"
                          disabled={dirty || busy}
                          onClick={() => setRemoving({ plan, archive: false })}
                        >
                          Delete plan
                        </Button>
                        {!plan.archivedAt && (
                          <Button
                            variant="secondary"
                            disabled={dirty || busy || plan.isFree}
                            onClick={() => setRemoving({ plan, archive: true })}
                          >
                            Archive plan
                          </Button>
                        )}
                      </div>
                      {plan.deletionReason && (
                        <p className="mt-2 text-meta text-muted">
                          {plan.deletionReason}
                        </p>
                      )}
                    </SortablePlan>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          {!loading && !plans.length && (
            <EmptyState
              title="No plans defined yet"
              description="Create a plan to define supplier subscription terms and listing limits."
            />
          )}
        </>
      )}
      <BillingAdministration token={token} onChanged={reload} />
    </div>
  );
}
