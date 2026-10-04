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
      'border-transparent bg-orange text-white hover:bg-orange-dark shadow-sm',
    secondary: 'border-slate-200 bg-white text-navy hover:bg-slate-50',
    danger: 'border-red-200 bg-red-50 text-red-800 hover:bg-red-100',
    ghost:
      'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
