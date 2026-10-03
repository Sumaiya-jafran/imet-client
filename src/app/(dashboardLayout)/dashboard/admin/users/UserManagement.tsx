'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { CurrentUser, UserRole } from '@/types/auth';
import { userService } from '@/lib/api/user.service';
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
    const data = new FormData(event.currentTarget);
    try {
      await userService.update(session.accessToken, user.id, {
        status: data.get('status') as CurrentUser['status'],
        roles: data.getAll('roles') as UserRole[],
      });
      setMessage('Account updated; existing sessions revoked.');
      await load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to update user',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section>
      <h1 className="text-2xl font-bold">User management</h1>
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
        <p role="status">Loading users…</p>
      ) : users.length === 0 ? (
        <p>No accounts found.</p>
      ) : (
        <div className="mt-6 space-y-5">
          {users.map((user) => (
            <form
              key={user.id}
              onSubmit={(event) => void save(event, user)}
              className="rounded-xl border bg-white p-5"
            >
              <h2 className="font-semibold">{user.displayName}</h2>
              <p className="break-all text-sm">{user.email}</p>
              <p className="my-2 text-sm">
                Email {user.isEmailVerified ? 'verified' : 'not verified'}
              </p>
              <fieldset
                disabled={busy || user.id === session?.account?.id}
                className="space-y-3"
              >
                <label className="block">
                  Status
                  <select
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
                      ] as const
                    ).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="font-medium">Roles</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {roles.map((role) => (
                      <label key={role} className="flex gap-2 text-sm">
                        <input
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
      <div className="mt-6 flex items-center gap-4">
        <Button
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
          disabled={page * 20 >= total || loading}
          onClick={() => {
            setLoading(true);
            setPage((value) => value + 1);
          }}
        >
          Next
        </Button>
        <Button
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
