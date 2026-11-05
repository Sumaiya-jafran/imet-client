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
        'inline-flex max-w-full items-center [overflow-wrap:anywhere] gap-1 rounded-sm border px-2 py-0.5 text-meta font-semibold leading-4',
        {
          neutral: 'border-border bg-background text-secondary',
          success: 'border-success/25 bg-success/5 text-success-foreground',
          warning: 'border-warning/25 bg-warning/5 text-warning-foreground',
        }[tone],
      )}
    >
      {children}
    </span>
  );
}
