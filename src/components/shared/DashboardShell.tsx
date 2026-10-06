'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import LanguageSelector from './LanguageSelector';
import { usePathname } from 'next/navigation';
import {
  Factory,
  FileText,
  LayoutDashboard,
  Building2,
  Package,
  Users,
  Layers3,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ArrowUpRight,
} from 'lucide-react';
import type { CurrentUser } from '@/types/auth';
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
  const links = [
    ...(user.roles.includes('ADMIN')
      ? [
          {
            href: '/dashboard/admin/analytics',
            label: 'Operational analytics',
            icon: LayoutDashboard,
          },
          {
            href: '/dashboard/admin/audit-logs',
            label: 'Audit log',
            icon: FileText,
          },
          {
            href: '/dashboard/admin/service-tickets',
            label: 'Service management',
            icon: FileText,
          },
          {
            href: '/dashboard/admin/translations',
            label: 'AI translations',
            icon: FileText,
          },
        ]
      : []),
    {
      href: '/dashboard/account',
      label: 'Account overview',
      icon: LayoutDashboard,
    },
    { href: '/dashboard/supplier', label: 'Supplier account', icon: Building2 },
    ...(user.roles.some((r) =>
      ['LOCAL_SUPPLIER', 'INTERNATIONAL_MANUFACTURER'].includes(r),
    )
      ? [
          {
            href: '/dashboard/supplier/machinery',
            label: 'Your machinery',
            icon: Package,
          },
        ]
      : []),
    ...(user.roles.includes('BUYER')
      ? [
          { href: '/dashboard/rfqs', label: 'My RFQs', icon: FileText },
          {
            href: '/dashboard/service-tickets',
            label: 'My service tickets',
            icon: FileText,
          },
          { href: '/dashboard/reviews', label: 'My reviews', icon: FileText },
          {
            href: '/dashboard/purchases',
            label: 'My purchases',
            icon: Package,
          },
        ]
      : []),
    ...(user.roles.some((r) =>
      [
        'LOCAL_SUPPLIER',
        'INTERNATIONAL_MANUFACTURER',
        'INDEPENDENT_SELLER',
        'SALES_PERSON',
      ].includes(r),
    )
      ? [
          { href: '/dashboard/sales', label: 'Sales pipeline', icon: Layers3 },
          {
            href: '/dashboard/service-management',
            label: 'Assigned service',
            icon: FileText,
          },
          {
            href: '/dashboard/sales/history',
            label: 'Sales history',
            icon: Package,
          },
          { href: '/dashboard/leads', label: 'My leads', icon: FileText },
          { href: '/dashboard/quotes', label: 'My quotes', icon: FileText },
        ]
      : []),
    ...(user.roles.includes('ADMIN')
      ? [
          {
            href: '/dashboard/admin/reviews',
            label: 'Review moderation',
            icon: FileText,
          },
          {
            href: '/dashboard/admin/sales',
            label: 'Sales oversight',
            icon: Layers3,
          },
          {
            href: '/dashboard/admin/rfqs',
            label: 'RFQ management',
            icon: FileText,
          },
          {
            href: '/dashboard/admin/leads',
            label: 'Lead overview',
            icon: FileText,
          },
          {
            href: '/dashboard/admin/users',
            label: 'Users & access',
            icon: Users,
          },
          {
            href: '/dashboard/admin/catalogue',
            label: 'Catalogue',
            icon: Layers3,
          },
          {
            href: '/dashboard/admin/suppliers',
            label: 'Suppliers',
            icon: Building2,
          },
          {
            href: '/dashboard/admin/subscriptions',
            label: 'Subscription plans',
            icon: CreditCard,
          },
        ]
      : []),
  ];
  useEffect(() => {
    drawer.current?.close();
  }, [pathname]);
  const active = links.find((l) => l.href === pathname);
  const navigation = (compact = false) => (
    <>
      <Link
        prefetch={false}
        href="/"
        aria-label="iMet Machinery home"
        className={cn(
          'mb-4 flex h-12 shrink-0 items-center gap-3 rounded-lg px-3 font-bold text-white',
          compact && 'justify-center px-0',
        )}
      >
        <Factory size={21} aria-hidden="true" className="shrink-0" />
        {!compact && (
          <span className="text-xl tracking-tight">
            iMet
            <span className="ml-2 text-xs font-normal text-slate-400">
              Workspace
            </span>
          </span>
        )}
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!compact && (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">
            Management
          </p>
        )}
        <nav aria-label="Dashboard navigation" className="space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              prefetch={false}
              key={href}
              href={href}
              title={label}
              aria-label={compact ? label : undefined}
              aria-current={pathname === href ? 'page' : undefined}
              className={cn(
                'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white',
                compact && 'justify-center px-0',
                pathname === href
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon size={18} aria-hidden="true" className="shrink-0" />
              {!compact && (
                <span className="min-w-0 truncate leading-5">{label}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <Link
        prefetch={false}
        href="/machinery"
        className={cn(
          'mt-4 flex min-h-10 shrink-0 items-center gap-3 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-white',
          compact && 'justify-center px-0',
        )}
        aria-label="Browse marketplace"
      >
        <ArrowUpRight size={18} aria-hidden="true" className="shrink-0" />
        {!compact && 'Browse marketplace'}
      </Link>
    </>
  );
  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden bg-navy p-3 lg:flex',
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
            'mt-2 flex min-h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white',
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
              <span className="text-xs">Collapse sidebar</span>
            </>
          )}
        </button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-18 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <button
            ref={trigger}
            type="button"
            onClick={() => drawer.current?.showModal()}
            aria-label="Open dashboard navigation"
            aria-haspopup="dialog"
            className="rounded-lg border border-slate-200 p-2 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500">
              Your workspace
            </p>
            <p className="font-semibold text-navy">
              {active?.label ?? 'Dashboard'}
            </p>
          </div>
          <div className="ml-auto flex min-w-0 flex-wrap items-center gap-3 py-2">
            <LanguageSelector />
            <SignOutButton />
            <span className="hidden max-w-48 truncate text-xs text-slate-600 sm:block">
              {user.displayName}
            </span>
            <Link
              prefetch={false}
              href="/dashboard/account"
              aria-label="Open your account"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-orange/20 bg-orange/10 text-sm font-bold text-orange-dark"
            >
              {user.displayName.slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="dashboard-content mx-auto max-w-6xl px-4 py-7 outline-none sm:px-6 lg:px-8 lg:py-8"
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
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-72 max-w-[85vw] border-0 bg-navy p-5 text-white backdrop:bg-navy/50"
      >
        <button
          type="button"
          onClick={() => drawer.current?.close()}
          aria-label="Close dashboard navigation"
          className="mb-3 ml-auto block rounded p-2 text-slate-300 focus-visible:outline-2 focus-visible:outline-white"
        >
          <X size={20} />
        </button>
        <div className="flex h-[calc(100%-3.75rem)] min-h-0 flex-col">
          {navigation()}
        </div>
      </dialog>
    </div>
  );
}
