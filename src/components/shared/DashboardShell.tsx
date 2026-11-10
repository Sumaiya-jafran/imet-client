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
import { MACHINERY_HREF } from '@/config/routes';
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
          'mb-6 flex h-12 shrink-0 items-center gap-3 px-2 font-sans text-section font-bold text-inverse',
          compact && 'justify-center px-0',
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center bg-accent text-foreground">
          <Factory size={19} aria-hidden="true" />
        </span>
        {!compact && (
          <span>
            Machinmate
            <span className="block font-sans text-meta font-medium text-subtle">
              Workspace
            </span>
          </span>
        )}
      </Link>

      <nav
        aria-label="Dashboard navigation"
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1"
      >
        {groups.map((group) => (
          <div key={group.title}>
            {compact ? (
              <hr className="mx-3 mb-3 border-surface/10" />
            ) : (
              <p className="mb-2 px-3 text-meta font-bold uppercase tracking-[0.18em] text-subtle">
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
                        'relative flex min-h-10 items-center gap-3 rounded px-3 py-2 text-nav font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-surface',
                        compact && 'justify-center px-0',
                        current
                          ? 'bg-surface/10 text-inverse before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:bg-accent'
                          : 'text-border-strong hover:bg-surface/5 hover:text-inverse',
                      )}
                    >
                      <Icon
                        size={18}
                        aria-hidden="true"
                        className={cn('shrink-0', current && 'text-accent')}
                      />
                      {!compact && (
                        <span className="min-w-0 truncate leading-5">
                          {label}
                        </span>
                      )}
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
          'mt-4 flex min-h-10 shrink-0 items-center gap-3 rounded border border-surface/10 px-3 text-meta font-medium text-border-strong hover:border-surface/25 hover:text-inverse focus-visible:outline-2 focus-visible:outline-surface',
          compact && 'justify-center px-0',
        )}
      >
        <ArrowUpRight size={18} aria-hidden="true" className="shrink-0" />
        {!compact && 'Browse marketplace'}
      </Link>
    </>
  );

  return (
    <div className="dashboard-shell min-h-screen bg-surface-muted/70 lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-surface focus:p-3 focus:font-semibold"
      >
        Skip to content
      </a>

      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col bg-primary p-3 transition-[width] duration-200 lg:flex',
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
            'mt-2 flex min-h-10 shrink-0 items-center gap-3 rounded px-3 text-subtle hover:bg-surface/5 hover:text-inverse focus-visible:outline-2 focus-visible:outline-surface',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" className="shrink-0" />
          ) : (
            <>
              <PanelLeftClose
                size={18}
                aria-hidden="true"
                className="shrink-0"
              />
              <span className="text-meta">Collapse sidebar</span>
            </>
          )}
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-surface/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              ref={trigger}
              type="button"
              onClick={() => drawer.current?.showModal()}
              aria-label="Open dashboard navigation"
              aria-haspopup="dialog"
              className="flex size-10 items-center justify-center rounded border border-border text-primary lg:hidden"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="text-meta font-bold uppercase tracking-[0.18em] text-secondary">
                {active?.group ?? 'Workspace'}
              </p>
              <p className="truncate font-sans text-body font-bold text-primary">
                {active?.label ?? 'Dashboard'}
              </p>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-3">
              {user.roles.includes('BUYER') && (
                <Link
                  prefetch={false}
                  href={MACHINERY_HREF}
                  className="hidden min-h-10 items-center gap-2 rounded bg-accent px-4 text-meta font-semibold text-foreground hover:bg-accent-hover sm:inline-flex"
                >
                  Browse machines
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
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-sans text-nav font-bold text-inverse hover:bg-secondary"
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
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-primary p-4 text-inverse backdrop:bg-primary/60"
      >
        <button
          type="button"
          onClick={() => drawer.current?.close()}
          aria-label="Close dashboard navigation"
          className="absolute right-3 top-5 flex size-10 items-center justify-center rounded text-border-strong hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-surface"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className="flex h-full min-h-0 flex-col">
          {navigation()}
          <div className="mt-4 rounded bg-surface p-3">
            <LanguageSelector />
          </div>
        </div>
      </dialog>
    </div>
  );
}
