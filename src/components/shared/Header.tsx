'use client';
import { QUOTE_HREF } from '@/config/routes';
import {
  Bell,
  Factory,
  Menu,
  MessageSquare,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import LanguageSelector from './LanguageSelector';
import PrimaryNavigation from './PrimaryNavigation';
import SignOutButton from './SignOutButton';

export default function Header() {
  const { data: session, status } = useSession();
  const signedIn = status === 'authenticated' && !session?.error;
  const roles = session?.account?.roles ?? [];
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const messagesHref = roles.includes('ADMIN')
    ? '/dashboard/admin/rfqs'
    : roles.includes('BUYER')
      ? '/dashboard/rfqs'
      : roles.some((r) =>
            [
              'LOCAL_SUPPLIER',
              'INTERNATIONAL_MANUFACTURER',
              'INDEPENDENT_SELLER',
              'SALES_PERSON',
            ].includes(r),
          )
        ? '/dashboard/leads'
        : signedIn
          ? '/dashboard/account'
          : '/auth/signin';

  const servicesHref = roles.includes('ADMIN')
    ? '/dashboard/admin/service-tickets'
    : roles.includes('BUYER')
      ? '/dashboard/service-tickets'
      : roles.some((r) =>
            [
              'LOCAL_SUPPLIER',
              'INTERNATIONAL_MANUFACTURER',
              'INDEPENDENT_SELLER',
              'SALES_PERSON',
            ].includes(r),
          )
        ? '/dashboard/service-management'
        : signedIn
          ? '/dashboard/account'
          : '/auth/signin';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:p-3 focus:font-semibold"
      >
        Skip to content
      </a>
      <header className="relative z-40 bg-[#257680] text-white shadow-sm lg:border-b lg:border-slate-200/80 lg:bg-white lg:text-slate-900 lg:shadow-none">
        {/* Desktop utility strip (Find suppliers, Search, LanguageSelector, Workspace/Sign in) */}
        <div className="hidden border-b border-slate-100 lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-1.5 text-xs text-slate-600 lg:px-8">
            <div className="flex items-center gap-4">
              <p className="text-slate-500">
                Multi-supplier machinery marketplace · Free for buyers
              </p>
              <span className="text-slate-300" aria-hidden="true">
                |
              </span>
              <Link
                href="/suppliers"
                className="font-medium text-slate-700 hover:text-navy"
              >
                Find suppliers
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <form
                action="/machinery"
                role="search"
                className="flex items-center gap-1.5"
              >
                <label htmlFor="marketplace-search-desktop" className="sr-only">
                  Search machines
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="marketplace-search-desktop"
                    name="q"
                    type="search"
                    maxLength={100}
                    placeholder="Search machines, brands or models"
                    className="!min-h-8 w-56 rounded-full border-slate-200 !py-1 !pl-8 !pr-3 !text-xs focus:w-64 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Search machines"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy text-white hover:bg-orange-dark"
                >
                  <Search size={14} aria-hidden="true" />
                </button>
              </form>

              <LanguageSelector />

              <Link
                href={signedIn ? '/dashboard/account' : '/auth/signin'}
                className="flex items-center gap-1.5 font-semibold text-navy hover:text-orange-dark"
              >
                <UserRound size={15} aria-hidden="true" />
                <span>{signedIn ? 'Workspace' : 'Sign in'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile App-Style Top Bar (Image 3 reference) */}
        <div className="mx-auto max-w-7xl px-3.5 pt-3 pb-3.5 lg:hidden">
          <div className="flex items-center justify-between gap-2 pb-2.5">
            {/* Left White Pill: Avatar + Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen((prev) => !prev)}
              aria-expanded={mobileDrawerOpen}
              aria-controls="mobile-header-drawer"
              aria-label="Toggle marketplace menu"
              className="inline-flex h-[34px] items-center gap-2 rounded-full bg-white px-2.5 text-[#257680] shadow-sm"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserRound size={14} aria-hidden="true" />
              </span>
              {mobileDrawerOpen ? (
                <X size={16} aria-hidden="true" className="text-slate-700" />
              ) : (
                <Menu size={16} aria-hidden="true" className="text-slate-700" />
              )}
            </button>

            {/* Center Brand Link */}
            <Link
              href="/"
              aria-label="Machinmate home"
              className="flex items-center gap-1.5 font-display text-base font-bold tracking-tight text-white"
            >
              <Factory
                size={17}
                aria-hidden="true"
                className="text-[#fbbd23]"
              />
              <span>Machinmate</span>
            </Link>

            {/* Right Two White Circular Icon Buttons (Notifications/Services & Messages/RFQs) */}
            <div className="flex items-center gap-2">
              <Link
                href={servicesHref}
                aria-label="Service tickets and notifications"
                className="relative flex size-[34px] items-center justify-center rounded-full bg-white text-[#257680] shadow-sm"
              >
                <Bell size={16} aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#fbbd23] ring-1 ring-white"
                />
              </Link>
              <Link
                href={messagesHref}
                aria-label="RFQ messages and workspace"
                className="flex size-[34px] items-center justify-center rounded-full bg-white text-[#257680] shadow-sm"
              >
                <MessageSquare size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Full-width White Search Input Bar */}
          <form
            action="/machinery"
            role="search"
            className="relative flex w-full items-center"
          >
            <label htmlFor="marketplace-search" className="sr-only">
              Search machines
            </label>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="marketplace-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="Find products and many more..."
              className="!min-h-[38px] w-full !rounded-md !border-0 !bg-white !py-1.5 !pl-10 !pr-9 !text-[13px] !text-slate-800 placeholder:!text-slate-400 shadow-sm focus-visible:!outline-2 focus-visible:!outline-[#fbbd23]"
            />
            <button
              type="submit"
              aria-label="Search machines"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded text-slate-500 hover:text-[#257680]"
            >
              <Search size={15} aria-hidden="true" />
            </button>
          </form>

          {/* Collapsible Mobile Drawer for LanguageSelector, Suppliers, and Auth */}
          {mobileDrawerOpen && (
            <div
              id="mobile-header-drawer"
              ref={drawerRef}
              className="mt-3 rounded-xl border border-white/15 bg-[#1d5f68] p-3.5 text-white shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                <Link
                  href="/suppliers"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-xs font-semibold text-white underline-offset-4 hover:underline"
                >
                  Find verified suppliers →
                </Link>
                <Link
                  href={QUOTE_HREF}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-full bg-[#fbbd23] px-3 py-1 text-xs font-bold text-slate-950"
                >
                  + Request a quote
                </Link>
              </div>
              <div className="mt-3 rounded-lg bg-white p-2.5 text-slate-800">
                <LanguageSelector />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                <Link
                  href={signedIn ? '/dashboard/account' : '/auth/signin'}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-[#257680]"
                >
                  <UserRound size={15} aria-hidden="true" />
                  <span>
                    {signedIn ? 'Open Workspace' : 'Sign in / Register'}
                  </span>
                </Link>
                {signedIn && <SignOutButton />}
              </div>
            </div>
          )}
        </div>

        <PrimaryNavigation />
      </header>
    </>
  );
}
