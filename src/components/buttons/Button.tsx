import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};
export default function Button({
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: Props) {
  const variants = {
    primary:
      'border-transparent bg-accent text-foreground hover:bg-accent-hover',
    secondary: 'border-border-strong bg-surface text-primary hover:border-primary',
    danger: 'border-danger/25 bg-danger/5 text-danger-foreground hover:bg-danger/10',
    ghost:
      'border-transparent bg-transparent text-secondary hover:bg-surface-muted',
  };
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded border px-4 py-2 text-button font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
