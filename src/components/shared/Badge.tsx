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
        'inline-flex max-w-full items-center [overflow-wrap:anywhere] gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold leading-4',
        {
          neutral: 'border-slate-200 bg-slate-50 text-slate-600',
          success: 'border-success/25 bg-success/5 text-success-foreground',
          warning: 'border-warning/25 bg-warning/5 text-warning-foreground',
        }[tone],
      )}
    >
      {children}
    </span>
  );
}
