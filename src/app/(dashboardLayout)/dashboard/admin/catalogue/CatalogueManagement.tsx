'use client';
import MachineryMediaManagement from '@/components/shared/MachineryMediaManagement';
import LoadingState from '@/components/shared/LoadingState';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import Badge from '@/components/shared/Badge';
import { supplierCatalogueApi } from '@/lib/api/supplier.service';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import {
  catalogueAdminApi as adminApi,
  type AdminCategory,
  type AdminCatalogueResult,
  type AdminMachine,
} from '@/lib/api/catalogue-admin.service';
import MachineForm from './MachineForm';
import CategoryManagement from './CategoryManagement';
export default function CatalogueManagement({
  supplierMode = false,
}: {
  supplierMode?: boolean;
}) {
  const api = supplierMode ? supplierCatalogueApi : adminApi;
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [mediaMachine, setMediaMachine] = useState<{
    id: string;
    name: string;
  }>();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [result, setResult] = useState<AdminCatalogueResult>();
  const [filters, setFilters] = useState({
    q: '',
    categoryId: '',
    status: '',
    page: 1,
  });
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<{ machine?: AdminMachine }>();
  useEffect(() => {
    if (!token || session?.error) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      page: String(filters.page),
      limit: '20',
    });
    if (filters.q) query.set('q', filters.q);
    if (filters.categoryId) query.set('categoryId', filters.categoryId);
    if (filters.status) query.set('status', filters.status);
    Promise.all([
      api.categories(token, controller.signal),
      api.list(token, query, controller.signal),
    ])
      .then(([c, m]) => {
        if (!controller.signal.aborted) {
          setCategories(c.data ?? []);
          setResult(m.data);
          setError('');
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Unable to load catalogue');
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [token, session?.error, filters, revision, api]);
  const reload = () => {
    setLoading(true);
    setRevision((value) => value + 1);
  };
  const saved = () => {
    setEditor(undefined);
    setNotice(
      'Catalogue saved. Public visibility requires eligible publication and, for supplier-owned listings, an active applicable subscription.',
    );
    reload();
  };
  const edit = async (id: string) => {
    if (!token) return;
    setBusy(true);
    setError('');
    try {
      const response = await api.detail(token, id);
      if (response.data) setEditor({ machine: response.data });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load machine');
    } finally {
      setBusy(false);
    }
  };
  const archive = async (machine: AdminCatalogueResult['machines'][number]) => {
    if (
      !token ||
      !window.confirm(
        `Archive “${machine.name}”? It will become a private draft. Images and specifications are retained.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      const response = await adminApi.detail(token, machine.id);
      if (!response.data) throw new Error('Machine unavailable');
      if (response.data.updatedAt !== machine.updatedAt)
        throw new Error(
          'This machine changed. Reload the catalogue before archiving.',
        );
      const {
        name,
        slug,
        description,
        manufacturer,
        model,
        categoryId,
        images,
        specifications,
      } = response.data;
      await adminApi.save(
        token,
        {
          name,
          slug,
          description,
          manufacturer,
          model,
          categoryId,
          images,
          specifications,
          status: 'DRAFT',
        },
        response.data,
      );
      setNotice('Machine archived as a private draft.');
      reload();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to archive machine',
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async (machine: AdminCatalogueResult['machines'][number]) => {
    if (
      !token ||
      !window.confirm(
        `Permanently delete “${machine.name}” and its images/specifications? This cannot be undone. Use Draft to hide it instead.`,
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      await api.remove(token, machine.id, machine.updatedAt);
      setNotice('Machine deleted.');
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete machine');
    } finally {
      setBusy(false);
    }
  };
  if (!token || session?.error)
    return <p role="alert">Your session expired. Sign in again.</p>;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={supplierMode ? 'Company workspace' : 'Administration'}
        title={supplierMode ? 'Your machinery' : 'Manage catalogue'}
        description="Organize machinery, update technical details and manage publication."
        actions={
          <Link href="/machinery" className="secondary-link">
            View public catalogue
          </Link>
        }
      />
      {error && (
        <div role="alert" className="text-red-700">
          <p>{error}</p>
          <Button variant="secondary" onClick={reload}>
            Reload catalogue
          </Button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {mediaMachine ? (
        <MachineryMediaManagement
          token={token}
          machineId={mediaMachine.id}
          name={mediaMachine.name}
          onClose={() => {
            setMediaMachine(undefined);
            reload();
          }}
        />
      ) : editor ? (
        <MachineForm
          key={`${editor.machine?.id ?? 'new'}-${editor.machine?.updatedAt ?? ''}`}
          token={token}
          machine={editor.machine}
          categories={categories}
          onSave={saved}
          onCancel={() => setEditor(undefined)}
          supplierMode={supplierMode}
        />
      ) : (
        <section className="surface p-5">
          <div className="flex flex-wrap justify-between gap-4">
            <h2 className="text-2xl font-semibold">Machines</h2>
            <Button
              disabled={busy || loading || !categories.length}
              onClick={() => {
                setEditor({});
                setNotice('');
              }}
            >
              Create machine
            </Button>
          </div>
          <form
            className="my-5 grid items-end gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              setLoading(true);
              setFilters({
                q: String(form.get('q') ?? '').trim(),
                categoryId: String(form.get('categoryId') ?? ''),
                status: String(form.get('status') ?? ''),
                page: 1,
              });
            }}
          >
            <label className="block">
              Search admin catalogue
              <input
                name="q"
                maxLength={100}
                defaultValue={filters.q}
                className="mt-1 w-full rounded border p-2"
              />
            </label>
            <label className="block">
              Filter category
              <select
                name="categoryId"
                defaultValue={filters.categoryId}
                className="mt-1 w-full rounded border p-2"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Filter status
              <select
                name="status"
                defaultValue={filters.status}
                className="mt-1 w-full rounded border p-2"
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </label>
            <Button type="submit" disabled={loading}>
              Apply filters
            </Button>
          </form>
          {loading ? (
            <LoadingState label="Loading catalogue…" />
          ) : (
            result && (
              <>
                <p>{result.pagination.total} machines</p>
                <ul className="mt-4 divide-y">
                  {result.machines.map((machine) => (
                    <li
                      key={machine.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold">
                          {machine.name}
                        </h3>
                        <p className="break-words text-sm text-slate-600">
                          {machine.category.name} ·{' '}
                          <Badge
                            tone={
                              machine.status === 'PUBLISHED'
                                ? 'success'
                                : 'neutral'
                            }
                          >
                            {machine.status}
                          </Badge>
                        </p>
                        {machine.status === 'PUBLISHED' && (
                          <Link
                            className="text-sm underline"
                            href={`/machinery/${machine.slug}`}
                          >
                            View machine
                          </Link>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!supplierMode && machine.status === 'PUBLISHED' && (
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void archive(machine)}
                          >
                            Archive machine
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => {
                            setMediaMachine({
                              id: machine.id,
                              name: machine.name,
                            });
                            setNotice('');
                          }}
                        >
                          Manage media
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void edit(machine.id)}
                        >
                          Edit machine
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() => void remove(machine)}
                        >
                          Delete machine
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                {!result.machines.length && (
                  <EmptyState
                    title="No matching machines"
                    description="Adjust your filters or create a machine to get started."
                  />
                )}
                <nav
                  aria-label="Admin catalogue pagination"
                  className="mt-5 flex flex-wrap items-center gap-4"
                >
                  <Button
                    variant="secondary"
                    disabled={loading || filters.page <= 1}
                    onClick={() => {
                      setLoading(true);
                      setFilters({ ...filters, page: filters.page - 1 });
                    }}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {filters.page} of{' '}
                    {Math.max(1, result.pagination.totalPages)}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={
                      loading || filters.page >= result.pagination.totalPages
                    }
                    onClick={() => {
                      setLoading(true);
                      setFilters({ ...filters, page: filters.page + 1 });
                    }}
                  >
                    Next
                  </Button>
                </nav>
              </>
            )
          )}
        </section>
      )}
      {!supplierMode && !editor && !mediaMachine && !loading && (
        <CategoryManagement
          token={token}
          categories={categories}
          onSave={() => {
            setNotice('Categories saved.');
            reload();
          }}
        />
      )}
    </div>
  );
}
