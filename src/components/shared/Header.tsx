'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Factory, Search, UserRound } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import PrimaryNavigation from './PrimaryNavigation';

export default function Header() {
  const { data: session, status } = useSession();
  const signedIn = status === 'authenticated' && !session?.error;
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:p-3 focus:font-semibold"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="border-b border-slate-100">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-slate-600 sm:px-6 lg:px-8">
            <p className="hidden md:block">
              Multi-supplier machinery marketplace · Free for buyers
            </p>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 md:w-auto md:gap-5">
              <Link href="/suppliers" className="hover:text-navy">
                Find suppliers
              </Link>
              <LanguageSelector />
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:gap-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Machinmate home"
            className="flex shrink-0 items-center gap-2 font-display text-xl font-extrabold tracking-tight text-navy"
          >
            <span className="flex size-9 items-center justify-center rounded bg-orange text-white">
              <Factory size={19} aria-hidden="true" />
            </span>
            Machinmate
          </Link>
          <form
            action="/machinery"
            role="search"
            className="order-last flex w-full min-w-0 items-center gap-2 sm:order-none sm:ml-auto sm:w-auto sm:flex-1 sm:max-w-lg"
          >
            <label htmlFor="marketplace-search" className="sr-only">
              Search machines
            </label>
            <input
              id="marketplace-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="Search machines, brands or models"
              className="w-full"
            />
            <button
              type="submit"
              aria-label="Search machines"
              className="flex size-11 shrink-0 items-center justify-center rounded bg-navy text-white hover:bg-orange-dark"
            >
              <Search size={19} aria-hidden="true" />
            </button>
          </form>
          <Link
            href={signedIn ? '/dashboard/account' : '/auth/signin'}
            className="ml-auto flex min-h-11 items-center gap-2 text-sm font-semibold text-navy hover:text-orange-dark"
          >
            <UserRound size={20} aria-hidden="true" />
            <span>{signedIn ? 'Workspace' : 'Sign in'}</span>
          </Link>
        </div>
        <PrimaryNavigation />
      </header>
    </>
  );
}
