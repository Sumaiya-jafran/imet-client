'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { planSchema } from '@/lib/schema-validations/supplier.schema';
import { supplierApi } from '@/lib/api/supplier.service';
import type { PlanInput, SubscriptionPlan } from '@/types/supplier';
import Button from '@/components/buttons/Button';
export default function SubscriptionPlanForm({
  token,
  plan,
  onSave,
  onCancel,
}: {
  token: string;
  plan?: SubscriptionPlan;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          eligibleTypes: plan.eligibleTypes,
          durationDays: plan.durationDays,
          price: plan.price,
          currency: plan.currency,
          listingLimit: plan.listingLimit,
          imageLimit: plan.imageLimit,
          specificationLimit: plan.specificationLimit,
          canPublishMachinery: plan.canPublishMachinery,
          visibility: plan.visibility,
          isActive: plan.isActive,
        }
      : {
          name: '',
          eligibleTypes: [],
          price: '',
          currency: '',
          canPublishMachinery: false,
          visibility: 'HIDDEN',
          isActive: false,
        },
  });
  const save = async (body: PlanInput) => {
    setError('');
    try {
      await supplierApi.savePlan(token, body, plan);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save plan');
    }
  };
  const labels = {
    name: 'Plan name',
    durationDays: 'Duration (days)',
    price: 'Subscription price',
    currency: 'Currency code',
    listingLimit: 'Machinery listing limit',
    imageLimit: 'Images per machine',
    specificationLimit: 'Specifications per machine',
  };
  const numeric = [
    'durationDays',
    'listingLimit',
    'imageLimit',
    'specificationLimit',
  ];
  return (
    <form onSubmit={handleSubmit(save)} noValidate className="space-y-4">
      <h2 className="text-2xl font-semibold">
        {plan ? 'Edit subscription plan' : 'Create subscription plan'}
      </h2>
      <p className="text-sm text-slate-600">
        All amounts, durations and limits are administrator-defined. Changes
        apply to future assignments; existing terms keep their assigned
        conditions. Deactivating a plan prevents new assignments.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <fieldset disabled={isSubmitting} className="grid gap-4 sm:grid-cols-2">
        {Object.entries(labels).map(([key, label]) => {
          const field = key as keyof typeof labels;
          return (
            <div key={field}>
              <label htmlFor={`plan-${field}`} className="block font-medium">
                {label}
              </label>
              <input
                id={`plan-${field}`}
                aria-invalid={!!errors[field]}
                aria-describedby={
                  errors[field] ? `plan-${field}-error` : undefined
                }
                type={numeric.includes(field) ? 'number' : 'text'}
                step={numeric.includes(field) ? '1' : undefined}
                {...register(
                  field,
                  numeric.includes(field) ? { valueAsNumber: true } : {},
                )}
                className="mt-1 w-full rounded border bg-white p-2"
              />
              {errors[field] && (
                <p id={`plan-${field}-error`} className="text-red-700">
                  {errors[field]?.message}
                </p>
              )}
            </div>
          );
        })}
        <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
          <legend className="font-medium">Eligible supplier types</legend>
          <label className="mt-2 block">
            <input
              type="checkbox"
              value="LOCAL"
              {...register('eligibleTypes')}
            />{' '}
            Local suppliers / dealers
          </label>
          <label className="mt-2 block">
            <input
              type="checkbox"
              value="INTERNATIONAL"
              {...register('eligibleTypes')}
            />{' '}
            International manufacturers
          </label>
          {errors.eligibleTypes && (
            <p className="text-red-700">{errors.eligibleTypes.message}</p>
          )}
        </fieldset>
        <label className="block">
          <input type="checkbox" {...register('canPublishMachinery')} /> Allow
          machinery publication
        </label>
        <label className="block">
          <input type="checkbox" {...register('isActive')} /> Active plan
          (available for assignments)
        </label>
        <div>
          <label htmlFor="plan-visibility" className="block font-medium">
            Marketplace visibility level
          </label>
          <select
            id="plan-visibility"
            {...register('visibility')}
            className="mt-1 w-full rounded border bg-white p-2"
          >
            <option value="HIDDEN">Hidden</option>
            <option value="STANDARD">Standard</option>
            <option value="FEATURED">Featured badge</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-4 sm:col-span-2">
          <Button type="submit">
            {isSubmitting ? 'Saving…' : 'Save plan'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel plan edit
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
