'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Factory,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import SignOutButton from './SignOutButton';
import PrimaryNavigation from './PrimaryNavigation';
import LanguageSelector from './LanguageSelector';
import type { CurrentUser } from '@/types/auth';
import { findActive, navGroups } from '@/config/dashboard-nav';
import { QUOTE_HREF } from '@/config/routes';
import { cn } from '@/lib/utils';

export default function DashboardShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const groups = navGroups(user.roles);
  const active = findActive(groups, pathname);
  const initial = user.displayName.slice(0, 1).toUpperCase();

  useEffect(() => {
    drawer.current?.close();
  }, [pathname]);

  const navigation = (compact = false) => (
    <>
      <Link
        prefetch={false}
        href="/"
        aria-label="Machinmate home"
        className={cn(
          'mb-6 flex h-12 shrink-0 items-center gap-3 px-2 font-display text-xl font-extrabold text-white',
          compact && 'justify-center px-0',
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center bg-orange">
          <Factory size={19} aria-hidden="true" />
        </span>
        {!compact && (
          <span>
            Machinmate
            <span className="block font-sans text-xs font-medium text-slate-400">Workspace</span>
          </span>
        )}
      </Link>

      <nav aria-label="Dashboard navigation" className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1">
        {groups.map((group) => (
          <div key={group.title}>
            {compact ? (
              <hr className="mx-3 mb-3 border-white/10" />
            ) : (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.links.map(({ href, label, icon: Icon }) => {
                const current = active?.href === href;
                return (
                  <li key={href}>
                    <Link
                      prefetch={false}
                      href={href}
                      title={compact ? label : undefined}
                      aria-label={compact ? label : undefined}
                      aria-current={current ? 'page' : undefined}
                      className={cn(
                        'relative flex min-h-10 items-center gap-3 rounded px-3 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white',
                        compact && 'justify-center px-0',
                        current
                          ? 'bg-white/10 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:bg-orange-light'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <Icon size={18} aria-hidden="true" className={cn('shrink-0', current && 'text-orange-light')} />
                      {!compact && <span className="min-w-0 truncate leading-5">{label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        prefetch={false}
        href="/machinery"
        aria-label={compact ? 'Browse marketplace' : undefined}
        className={cn(
          'mt-4 flex min-h-10 shrink-0 items-center gap-3 rounded border border-white/10 px-3 text-xs font-medium text-slate-300 hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-white',
          compact && 'justify-center px-0',
        )}
      >
        <ArrowUpRight size={18} aria-hidden="true" className="shrink-0" />
        {!compact && 'Browse marketplace'}
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100/70 lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-white focus:p-3 focus:font-semibold"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col bg-navy p-3 transition-[width] duration-200 lg:flex',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        {navigation(collapsed)}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={cn(
            'mt-2 flex min-h-10 shrink-0 items-center gap-3 rounded px-3 text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-white',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" className="shrink-0" />
          ) : (
            <>
              <PanelLeftClose size={18} aria-hidden="true" className="shrink-0" />
              <span className="text-xs">Collapse sidebar</span>
            </>
          )}
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              ref={trigger}
              type="button"
              onClick={() => drawer.current?.showModal()}
              aria-label="Open dashboard navigation"
              aria-haspopup="dialog"
              className="flex size-10 items-center justify-center rounded border border-slate-200 text-navy lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-dark">
                {active?.group ?? 'Workspace'}
              </p>
              <p className="truncate font-display text-base font-bold text-navy">
                {active?.label ?? 'Dashboard'}
              </p>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-3">
              {/* Hidden on RFQ pages, which carry their own "Create RFQ" action. */}
              {user.roles.includes('BUYER') && !pathname.startsWith('/dashboard/rfqs') && (
                <Link
                  prefetch={false}
                  href={QUOTE_HREF}
                  className="hidden min-h-10 items-center gap-2 rounded bg-orange px-4 text-xs font-semibold text-white hover:bg-orange-dark sm:inline-flex"
                >
                  Request a quote
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              )}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>
              <SignOutButton />
              <Link
                prefetch={false}
                href="/dashboard/account"
                aria-label={`Your account: ${user.displayName}`}
                title={user.displayName}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white hover:bg-orange"
              >
                {initial}
              </Link>
            </div>
          </div>
          <PrimaryNavigation roles={user.roles} />
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="dashboard-content mx-auto max-w-6xl px-4 py-7 outline-none sm:px-6 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>

      <dialog
        ref={drawer}
        aria-label="Dashboard navigation"
        onClose={() => trigger.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close();
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-navy p-4 text-white backdrop:bg-navy-deep/60"
      >
        <button
          type="button"
          onClick={() => drawer.current?.close()}
          aria-label="Close dashboard navigation"
          className="absolute right-3 top-5 flex size-10 items-center justify-center rounded text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className="flex h-full min-h-0 flex-col">
          {navigation()}
          <div className="mt-4 rounded bg-white p-3">
            <LanguageSelector />
          </div>
        </div>
      </dialog>
    </div>
  );
}
