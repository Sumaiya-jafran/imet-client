'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Button from '@/components/buttons/Button';
import {
  catalogueAdminApi as api,
  type AdminCategory,
  type AdminCatalogueResult,
  type AdminMachine,
} from '@/lib/api/catalogue-admin.service';
import MachineForm from './MachineForm';
import CategoryManagement from './CategoryManagement';
export default function CatalogueManagement() {
  const { data: session } = useSession();
  const token = session?.accessToken;
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
  }, [token, session?.error, filters, revision]);
  const reload = () => {
    setLoading(true);
    setRevision((value) => value + 1);
  };
  const saved = () => {
    setEditor(undefined);
    setNotice(
      'Catalogue saved. Published changes are visible in the public catalogue.',
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy">Manage catalogue</h1>
        <Link href="/machinery" className="mt-3 inline-block underline">
          View public catalogue
        </Link>
      </div>
      {error && (
        <div role="alert" className="text-red-700">
          <p>{error}</p>
          <Button onClick={reload}>Reload catalogue</Button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {editor ? (
        <MachineForm
          key={`${editor.machine?.id ?? 'new'}-${editor.machine?.updatedAt ?? ''}`}
          token={token}
          machine={editor.machine}
          categories={categories}
          onSave={saved}
          onCancel={() => setEditor(undefined)}
        />
      ) : (
        <section className="rounded-xl border bg-white p-5">
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
            className="my-5 grid gap-3 sm:grid-cols-2"
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
            <p role="status">Loading catalogue…</p>
          ) : (
            result && (
              <>
                <p>{result.pagination.total} machines</p>
                <ul className="mt-4 divide-y">
                  {result.machines.map((machine) => (
                    <li
                      key={machine.id}
                      className="flex flex-wrap justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold">
                          {machine.name}
                        </h3>
                        <p className="break-words text-sm text-slate-600">
                          {machine.category.name} · {machine.status}
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
                      <div className="flex gap-2">
                        <Button
                          disabled={busy}
                          onClick={() => void edit(machine.id)}
                        >
                          Edit machine
                        </Button>
                        <Button
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
                  <p className="mt-4">No machines match these filters.</p>
                )}
                <nav
                  aria-label="Admin catalogue pagination"
                  className="mt-5 flex flex-wrap items-center gap-4"
                >
                  <Button
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
      {!editor && !loading && (
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
