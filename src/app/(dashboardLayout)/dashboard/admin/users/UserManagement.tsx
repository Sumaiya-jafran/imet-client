'use client';
import LoadingState from '@/components/shared/LoadingState';
import Badge from '@/components/shared/Badge';
import EmptyState from '@/components/shared/EmptyState';
import PageHeader from '@/components/shared/PageHeader';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { CurrentUser, UserRole } from '@/types/auth';
import { userService } from '@/lib/api/user.service';
import { ApiError } from '@/lib/api/client';
import Button from '@/components/buttons/Button';
const roles: UserRole[] = [
  'BUYER',
  'LOCAL_SUPPLIER',
  'INTERNATIONAL_MANUFACTURER',
  'SALES_PERSON',
  'INDEPENDENT_SELLER',
  'ADMIN',
];
export default function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, { roles?: string; status?: string }>
  >({});
  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const response = await userService.list(session.accessToken, page);
      setError('');
      setUsers(response.data!.users);
      setTotal(response.data!.total);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }, [session, page]);
  useEffect(() => {
    if (!session?.accessToken) return;
    let active = true;
    userService
      .list(session.accessToken, page)
      .then((response) => {
        if (!active) return;
        setError('');
        setUsers(response.data!.users);
        setTotal(response.data!.total);
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error ? error.message : 'Unable to load users',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, page]);
  const save = async (
    event: React.FormEvent<HTMLFormElement>,
    user: CurrentUser,
  ) => {
    event.preventDefault();
    if (!session?.accessToken) return;
    setBusy(true);
    setError('');
    setMessage('');
    setFieldErrors((current) => ({ ...current, [user.id]: {} }));
    const data = new FormData(event.currentTarget);
    try {
      if (!data.getAll('roles').length) {
        setError('Select at least one role.');
        setFieldErrors((current) => ({
          ...current,
          [user.id]: { roles: 'Select at least one role.' },
        }));
        return;
      }
      await userService.update(session.accessToken, user.id, {
        status: data.get('status') as CurrentUser['status'],
        roles: data.getAll('roles') as UserRole[],
      });
      setMessage('Account updated; existing sessions revoked.');
      await load();
    } catch (error) {
      if (error instanceof ApiError) {
        const issues: { roles?: string; status?: string } = {};
        for (const issue of error.response.errors || []) {
          const field = issue.path.find(
            (part) => part === 'roles' || part === 'status',
          );
          if (field === 'roles' || field === 'status')
            issues[field] = issue.message;
        }
        setFieldErrors((current) => ({ ...current, [user.id]: issues }));
      }
      setError(
        error instanceof ApiError && error.response.errors?.length
          ? error.response.errors.map((issue) => issue.message).join(' ')
          : error instanceof Error
            ? error.message
            : 'Unable to update user',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section>
      <PageHeader
        title="User management"
        eyebrow="Administration"
        description="Manage account status and role access."
      />
      {error && (
        <p role="alert" className="my-4 text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="my-4">
          {message}
        </p>
      )}
      {loading ? (
        <LoadingState label="Loading users…" />
      ) : error && users.length === 0 ? (
        <EmptyState
          title="Accounts unavailable"
          description="The account list could not be loaded. Use Reload to try again."
        />
      ) : users.length === 0 ? (
        <EmptyState
          title="No accounts found"
          description="Registered accounts will appear here for access management."
        />
      ) : (
        <div className="mt-6 grid items-start gap-4 xl:grid-cols-2">
          {users.map((user) => (
            <form
              key={user.id}
              onSubmit={(event) => void save(event, user)}
              className="surface p-5"
            >
              <h2 className="font-semibold">{user.displayName}</h2>
              <p className="break-all text-sm">{user.email}</p>
              <p className="my-3 text-xs text-slate-500">
                <Badge tone={user.isEmailVerified ? 'success' : 'neutral'}>
                  Email {user.isEmailVerified ? 'verified' : 'not verified'}
                </Badge>
              </p>
              <fieldset
                disabled={busy || user.id === session?.account?.id}
                className="space-y-3"
              >
                <label className="block">
                  Status
                  <select
                    aria-invalid={!!fieldErrors[user.id]?.status}
                    aria-describedby={
                      fieldErrors[user.id]?.status
                        ? `${user.id}-status-error`
                        : undefined
                    }
                    name="status"
                    defaultValue={user.status}
                    className="ml-3 rounded border p-2"
                  >
                    {(
                      [
                        'ACTIVE',
                        'INACTIVE',
                        'SUSPENDED',
                        'PENDING_VERIFICATION',
                        'PENDING',
                      ] as const
                    ).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {fieldErrors[user.id]?.status && (
                  <p
                    id={`${user.id}-status-error`}
                    className="text-sm text-red-700"
                  >
                    {fieldErrors[user.id].status}
                  </p>
                )}
                <fieldset
                  aria-invalid={!!fieldErrors[user.id]?.roles}
                  aria-describedby={
                    fieldErrors[user.id]?.roles
                      ? `${user.id}-roles-error`
                      : undefined
                  }
                >
                  <legend className="font-medium">Roles</legend>
                  <div className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                    {roles.map((role) => (
                      <label key={role} className="flex gap-2 text-sm">
                        <input
                          aria-invalid={!!fieldErrors[user.id]?.roles}
                          aria-describedby={
                            fieldErrors[user.id]?.roles
                              ? `${user.id}-roles-error`
                              : undefined
                          }
                          name="roles"
                          type="checkbox"
                          value={role}
                          defaultChecked={user.roles.includes(role)}
                        />
                        {role.replaceAll('_', ' ')}
                      </label>
                    ))}
                  </div>
                </fieldset>
                {fieldErrors[user.id]?.roles && (
                  <p
                    id={`${user.id}-roles-error`}
                    className="text-sm text-red-700"
                  >
                    {fieldErrors[user.id].roles}
                  </p>
                )}
                <Button type="submit">Save access</Button>
              </fieldset>
              {user.id === session?.account?.id && (
                <p className="mt-3 text-sm">
                  Another administrator must change your access.
                </p>
              )}
            </form>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          disabled={page === 1 || loading}
          onClick={() => {
            setLoading(true);
            setPage((value) => value - 1);
          }}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="secondary"
          disabled={page * 20 >= total || loading}
          onClick={() => {
            setLoading(true);
            setPage((value) => value + 1);
          }}
        >
          Next
        </Button>
        <Button
          variant="secondary"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          Reload
        </Button>
      </div>
    </section>
  );
}
