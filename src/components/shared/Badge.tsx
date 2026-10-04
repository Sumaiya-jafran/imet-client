import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
export default function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold leading-4',
        {
          neutral: 'border-slate-200 bg-slate-50 text-slate-600',
          success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
          warning: 'border-orange/20 bg-orange/5 text-orange-dark',
        }[tone],
      )}
    >
      {children}
    </span>
  );
}
