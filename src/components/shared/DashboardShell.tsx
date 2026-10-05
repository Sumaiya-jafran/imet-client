'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
        className="mb-8 flex min-h-10 items-center gap-3 px-3 font-bold text-white"
      >
        <Factory size={21} aria-hidden="true" />
        {!compact && (
          <span className="text-xl tracking-tight">
            iMet
            <span className="ml-2 text-xs font-normal text-slate-400">
              Workspace
            </span>
          </span>
        )}
      </Link>
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
            title={compact ? label : undefined}
            aria-label={compact ? label : undefined}
            aria-current={pathname === href ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium',
              pathname === href
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon size={18} aria-hidden="true" />
            {!compact && label}
          </Link>
        ))}
      </nav>
      <Link
        prefetch={false}
        href="/machinery"
        className="mt-8 flex min-h-11 items-center gap-3 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5"
        aria-label="Browse marketplace"
      >
        <ArrowUpRight size={18} aria-hidden="true" />
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
          'sticky top-0 hidden h-screen shrink-0 flex-col bg-navy p-4 lg:flex',
          collapsed ? 'w-20' : 'w-60',
        )}
      >
        {navigation(collapsed)}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="mt-auto flex min-h-11 items-center gap-3 rounded-lg px-3 text-slate-300 hover:bg-white/10"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <>
              <PanelLeftClose size={18} />
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
          className="mb-5 ml-auto block rounded p-2 text-slate-300"
        >
          <X size={20} />
        </button>
        {navigation()}
      </dialog>
    </div>
  );
}
