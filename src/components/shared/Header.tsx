'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LanguageSelector from './LanguageSelector';
import { usePathname } from 'next/navigation';
import { Factory, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  return (
    <header className="border-b border-slate-200 bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="iMet Machinery home"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-navy"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-navy text-white">
            <Factory size={19} aria-hidden="true" />
          </span>
          iMet
          <span className="hidden text-sm font-normal tracking-normal text-slate-500 sm:inline">
            Machinery
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full gap-1 border-t border-slate-100 pt-2 text-[13px] sm:order-none sm:w-auto sm:border-0 sm:pt-0"
        >
          {[
            ['/machinery', 'Machinery'],
            ['/suppliers', 'Suppliers'],
            ['/dashboard/rfqs/new', 'Request quote'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 font-medium',
                pathname.startsWith(href)
                  ? 'bg-slate-100 text-navy'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/dashboard/account"
            className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            Account
          </Link>
        </nav>
        <div className="order-4 flex w-full border-t border-slate-100 pt-2 sm:order-3 sm:justify-end lg:order-none lg:w-auto lg:border-0 lg:pt-0">
          <LanguageSelector />
        </div>
        <div className="ml-auto flex items-center gap-3 text-[13px] font-semibold">
          {status === 'authenticated' && !session.error ? (
            <Link
              href="/dashboard/account"
              className="rounded-lg bg-navy px-3 py-2 text-white"
            >
              Workspace
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="rounded px-1 py-2 text-slate-600 hover:text-navy"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="flex min-h-10 items-center gap-2 rounded-lg bg-navy px-3 py-2 text-white hover:bg-slate-700"
              >
                Create account
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
