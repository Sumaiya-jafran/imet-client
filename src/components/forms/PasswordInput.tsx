'use client';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function PasswordInput({ className, disabled, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full rounded-lg border border-slate-300 px-3 py-2 pr-12 focus-visible:outline-2 focus-visible:outline-orange',
          className,
        )}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={`${visible ? 'Hide' : 'Show'} password`}
        aria-controls={props.id}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-1 top-1 flex size-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orange"
      >
        {visible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
});
export default PasswordInput;
