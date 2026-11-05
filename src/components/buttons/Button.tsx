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
    secondary: 'border-slate-300 bg-white text-navy hover:border-navy',
    danger: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
    ghost:
      'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
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
