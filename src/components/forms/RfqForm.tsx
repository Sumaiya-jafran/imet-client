'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { rfqSchema } from '@/lib/schema-validations/rfq.schema';
import { rfqApi } from '@/lib/api/rfq.service';
import { catalogueApi } from '@/lib/api/catalogue.service';
import type { RfqInput, RfqDetail } from '@/types/rfq';
import type { MachineSummary } from '@/types/catalogue';
import Button from '@/components/buttons/Button';
import LoadingState from '@/components/shared/LoadingState';
export default function RfqForm({
  rfq,
  machineSlug,
  onSave,
  onCancel,
}: {
  rfq?: RfqDetail;
  machineSlug?: string;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const router = useRouter();
  const [categories, setCategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [machines, setMachines] = useState<MachineSummary[]>([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RfqInput>({
    resolver: zodResolver(rfqSchema),
    defaultValues: rfq
      ? {
          machineId: rfq.machineId,
          categoryId: rfq.categoryId,
          title: rfq.title,
          description: rfq.description,
          quantity: rfq.quantity,
          unit: rfq.unit,
          targetBudget: rfq.targetBudget ?? null,
          budgetCurrency: rfq.budgetCurrency ?? null,
          deliveryLocation: rfq.deliveryLocation,
          deliveryTimeline: rfq.deliveryTimeline,
          supplierCountry: rfq.supplierCountry,
          preferredLanguage: rfq.preferredLanguage,
        }
      : {
          machineId: null,
          categoryId: null,
          title: '',
          description: '',
          quantity: '1',
          unit: 'units',
          targetBudget: null,
          budgetCurrency: null,
          deliveryLocation: '',
          deliveryTimeline: '',
          supplierCountry: null,
          preferredLanguage: 'en',
        },
  });
  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      rfqApi.categories(token),
      catalogueApi.list(new URLSearchParams({ limit: '12' })),
      machineSlug ? catalogueApi.detail(machineSlug) : Promise.resolve(null),
    ])
      .then(([c, m, preset]) => {
        if (!active) return;
        setCategories(c.data ?? []);
        setMachines(
          preset
            ? [preset, ...m.machines.filter((x) => x.id !== preset.id)]
            : m.machines,
        );
        if (preset) {
          setValue('machineId', preset.id);
          setValue(
            'categoryId',
            c.data?.find((x) => x.slug === preset.category.slug)?.id ?? null,
          );
          setValue('title', `Request for ${preset.name}`);
        }
        setLoading(false);
        setError('');
      })
      .catch((e) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Unable to load catalogue');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token, machineSlug, setValue, revision]);
  const searchMachines = async () => {
    setSearching(true);
    setError('');
    try {
      const r = await catalogueApi.list(
        new URLSearchParams({ q: search, limit: '12' }),
      );
      setMachines((current) => {
        const selected = current.find((m) => m.id === getValues('machineId'));
        return selected
          ? [selected, ...r.machines.filter((m) => m.id !== selected.id)]
          : r.machines;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to search machinery');
    } finally {
      setSearching(false);
    }
  };
  const save = async (data: RfqInput) => {
    if (!token) return;
    setError('');
    try {
      if (rfq) {
        await rfqApi.update(token, rfq, data);
        onSave?.();
      } else {
        const r = await rfqApi.create(token, data);
        router.push(`/dashboard/rfqs/${r.data!.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save draft');
    }
  };
  const labels: { key: keyof RfqInput; label: string; optional?: boolean }[] = [
    { key: 'title', label: 'RFQ title' },
    { key: 'description', label: 'Requirements and specifications' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit', label: 'Unit' },
    { key: 'deliveryLocation', label: 'Delivery location' },
    { key: 'deliveryTimeline', label: 'Expected delivery timeline' },
    {
      key: 'supplierCountry',
      label: 'Preferred supplier country',
      optional: true,
    },
    { key: 'targetBudget', label: 'Target budget (private)', optional: true },
    { key: 'budgetCurrency', label: 'Budget currency', optional: true },
  ];
  if (loading) return <LoadingState label="Preparing your RFQ…" />;
  return (
    <form
      onSubmit={handleSubmit(save)}
      noValidate
      className="surface space-y-5 p-5 sm:p-6"
    >
      {error && (
        <div role="alert">
          <p className="text-red-700">{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRevision((n) => n + 1);
            }}
          >
            Reload catalogue
          </Button>
        </div>
      )}
      <p className="text-sm text-slate-500">
        Save a draft first. You can review details and add private attachments
        before submitting. Your budget is visible only to you and
        administrators.
      </p>
      <fieldset disabled={isSubmitting} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor="rfq-machine-search" className="block font-medium">
            Find machinery (optional)
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id="rfq-machine-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
              placeholder="Name, manufacturer or model"
              className="min-w-0 flex-1"
            />
            <Button
              variant="secondary"
              disabled={searching}
              onClick={() => void searchMachines()}
            >
              {searching ? 'Searching…' : 'Search machinery'}
            </Button>
          </div>
        </div>
        <label>
          Selected machinery
          <select
            className="mt-1 w-full"
            {...register('machineId', { setValueAs: (v) => v || null })}
            onChange={(e) => {
              setValue('machineId', e.target.value || null);
              const m = machines.find((x) => x.id === e.target.value);
              if (m)
                setValue(
                  'categoryId',
                  categories.find((c) => c.slug === m.category.slug)?.id ??
                    null,
                );
            }}
          >
            <option value="">General request (no specific machine)</option>
            {rfq?.machine && !machines.some((m) => m.id === rfq.machineId) && (
              <option value={rfq.machineId ?? ''}>{rfq.machine.name}</option>
            )}
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category (optional)
          <select
            className="mt-1 w-full"
            {...register('categoryId', { setValueAs: (v) => v || null })}
            onChange={(e) => {
              setValue('categoryId', e.target.value || null);
              setValue('machineId', null);
            }}
          >
            <option value="">No specific category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {labels.map(({ key, label, optional }) => (
          <div
            key={key}
            className={key === 'description' ? 'md:col-span-2' : 'min-w-0'}
          >
            <label htmlFor={`rfq-${key}`} className="block font-medium">
              {label}
              {optional ? ' (optional)' : ''}
            </label>
            {key === 'description' ? (
              <textarea
                id={`rfq-${key}`}
                rows={5}
                {...register(key)}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `rfq-${key}-error` : undefined}
                className="mt-1 w-full"
              />
            ) : (
              <input
                id={`rfq-${key}`}
                {...register(
                  key,
                  optional ? { setValueAs: (v) => v?.trim() || null } : {},
                )}
                inputMode={
                  ['quantity', 'targetBudget'].includes(key)
                    ? 'decimal'
                    : undefined
                }
                className="mt-1 w-full"
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `rfq-${key}-error` : undefined}
              />
            )}{' '}
            {errors[key] && (
              <p id={`rfq-${key}-error`} className="mt-1 text-xs text-red-700">
                {errors[key]?.message}
              </p>
            )}
          </div>
        ))}
        <label>
          Preferred language
          <select className="mt-1 w-full" {...register('preferredLanguage')}>
            <option value="en">English</option>
            <option value="bn">Bangla</option>
            <option value="zh">Chinese</option>
          </select>
        </label>
        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4 md:col-span-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save RFQ draft'}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel draft edit
            </Button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
