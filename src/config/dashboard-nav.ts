import {
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  Headphones,
  History,
  Languages,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Star,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/auth';

export type NavLink = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { title: string; links: NavLink[] };

const SUPPLIER_ROLES: UserRole[] = [
  'LOCAL_SUPPLIER',
  'INTERNATIONAL_MANUFACTURER',
];
const SELLER_ROLES: UserRole[] = [
  ...SUPPLIER_ROLES,
  'INDEPENDENT_SELLER',
  'SALES_PERSON',
];

// Navigation grouped by job, filtered by the signed-in user's roles.
export function navGroups(roles: UserRole[]): NavGroup[] {
  const has = (list: UserRole[]) => roles.some((r) => list.includes(r));
  const groups: NavGroup[] = [
    {
      title: 'Workspace',
      links: [
        {
          href: '/dashboard/account',
          label: 'Account overview',
          icon: UserRound,
        },
      ],
    },
  ];
  if (roles.includes('BUYER'))
    groups.push({
      title: 'Buying',
      links: [
        {
          href: '/dashboard/purchases',
          label: 'My purchases',
          icon: ShoppingBag,
        },
        {
          href: '/dashboard/service-tickets',
          label: 'Service tickets',
          icon: Wrench,
        },
        { href: '/dashboard/reviews', label: 'My reviews', icon: Star },
      ],
    });
  groups.push({
    title: 'Selling',
    links: [
      {
        href: '/dashboard/supplier',
        label: 'Supplier account',
        icon: Building2,
      },
      ...(has(SUPPLIER_ROLES)
        ? [
            {
              href: '/dashboard/supplier/machinery',
              label: 'Your machinery',
              icon: Package,
            },
          ]
        : []),
      ...(has(SELLER_ROLES)
        ? [
            {
              href: '/dashboard/sales/history',
              label: 'Sales history',
              icon: History,
            },
            {
              href: '/dashboard/service-management',
              label: 'Assigned service',
              icon: Headphones,
            },
          ]
        : []),
    ],
  });
  if (roles.includes('ADMIN'))
    groups.push({
      title: 'Administration',
      links: [
        {
          href: '/dashboard/admin/analytics',
          label: 'Analytics',
          icon: BarChart3,
        },
        {
          href: '/dashboard/admin/sales/history',
          label: 'Sales history',
          icon: History,
        },
        {
          href: '/dashboard/admin/service-tickets',
          label: 'Service management',
          icon: Wrench,
        },
        {
          href: '/dashboard/admin/reviews',
          label: 'Review moderation',
          icon: ShieldCheck,
        },
        { href: '/dashboard/admin/catalogue', label: 'Catalogue', icon: Boxes },
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
        {
          href: '/dashboard/admin/users',
          label: 'Users & access',
          icon: Users,
        },
        {
          href: '/dashboard/admin/translations',
          label: 'AI translations',
          icon: Languages,
        },
        {
          href: '/dashboard/admin/audit-logs',
          label: 'Audit log',
          icon: ScrollText,
        },
      ],
    });
  return groups;
}

// Longest matching prefix wins, so /dashboard/rfqs/123 highlights "My RFQs"
// and /dashboard/sales/history highlights "Sales history", not "Sales pipeline".
export function findActive(groups: NavGroup[], pathname: string) {
  let best: (NavLink & { group: string }) | undefined;
  for (const g of groups)
    for (const l of g.links)
      if (
        (pathname === l.href || pathname.startsWith(`${l.href}/`)) &&
        l.href.length > (best?.href.length ?? 0)
      )
        best = { ...l, group: g.title };
  return best;
}
