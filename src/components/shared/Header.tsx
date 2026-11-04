'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Factory, ArrowUpRight, Menu, X } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { cn } from '@/lib/utils';
import { QUOTE_HREF } from '@/config/routes';

const navItems = [
  { href: '/machinery', label: 'Machinery' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#supplier-plans', label: 'For suppliers' },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const signedIn = status === 'authenticated' && !session?.error;

  const accountLinks = signedIn ? (
    <Link href="/dashboard/account" className="font-semibold text-navy hover:text-orange-dark">
      Workspace
    </Link>
  ) : (
    <>
      <Link href="/auth/signin" className="hover:text-navy">
        Sign in
      </Link>
      <Link href="/auth/signup" className="font-semibold text-navy hover:text-orange-dark">
        Create account
      </Link>
    </>
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:p-3 focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Utility bar */}
      <div className="hidden border-b border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-2 text-xs text-slate-600 lg:px-8">
          <p>Industrial machinery marketplace · Free for buyers</p>
          <div className="flex items-center gap-5">
            <LanguageSelector />
            <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
            {accountLinks}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:h-20 lg:px-8">
          <Link
            href="/"
            aria-label="iMet Machinery home"
            className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-navy"
          >
            <span className="flex size-9 items-center justify-center bg-orange text-white">
              <Factory size={19} aria-hidden="true" />
            </span>
            iMet
            <span className="hidden text-sm font-medium tracking-normal text-slate-500 sm:inline">
              Machinery
            </span>
          </Link>

          <nav aria-label="Main navigation" className="ml-auto hidden lg:block">
            <ul className="flex items-center gap-1 text-sm font-medium">
              {navItems.map(({ href, label }) => {
                const active = !href.includes('#') && pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative px-3 py-2 text-slate-600 hover:text-navy',
                        'after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-orange after:transition-transform hover:after:scale-x-100',
                        active && 'text-navy after:scale-x-100',
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            href={QUOTE_HREF}
            className="ml-auto inline-flex min-h-11 items-center gap-2 bg-orange px-4 text-sm font-semibold text-white hover:bg-orange-dark lg:ml-4 lg:px-5"
          >
            Request a quote
            <ArrowUpRight size={16} aria-hidden="true" className="hidden sm:block" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex size-11 items-center justify-center border border-slate-200 text-navy lg:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-slate-200 bg-white lg:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <ul className="divide-y divide-slate-100">
                {navItems.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-3 font-display text-lg font-semibold text-navy"
                    >
                      {label}
                      <ArrowUpRight size={18} aria-hidden="true" className="text-orange" />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
                {accountLinks}
              </div>
              <div className="mt-4">
                <LanguageSelector />
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
