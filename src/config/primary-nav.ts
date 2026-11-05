import type { UserRole } from '@/types/auth';

export type PrimaryLink = { label: string; href?: string; description: string };

// These are existing workspaces, not a public services catalogue or chat inbox.
export function primaryLinks(
  roles: UserRole[],
  signedIn: boolean,
): PrimaryLink[] {
  const admin = roles.includes('ADMIN');
  const seller = roles.some((role) =>
    [
      'LOCAL_SUPPLIER',
      'INTERNATIONAL_MANUFACTURER',
      'INDEPENDENT_SELLER',
      'SALES_PERSON',
    ].includes(role),
  );
  const buyer = roles.includes('BUYER');
  const messages = admin
    ? '/dashboard/admin/rfqs'
    : buyer
      ? '/dashboard/rfqs'
      : seller
        ? '/dashboard/leads'
        : undefined;
  const services = admin
    ? '/dashboard/admin/service-tickets'
    : buyer
      ? '/dashboard/service-tickets'
      : seller
        ? '/dashboard/service-management'
        : undefined;
  return [
    { label: 'Home', href: '/', description: 'Marketplace home' },
    { label: 'Machines', href: '/machinery', description: 'Browse machines' },
    {
      label: 'Spare parts',
      description: 'Spare parts — coming in a future release',
    },
    {
      label: 'Services',
      href: signedIn ? services : undefined,
      description:
        services && signedIn
          ? 'Your service-ticket workspace'
          : 'Service tickets — sign in with an eligible account',
    },
    {
      label: 'Messages',
      href: signedIn ? messages : undefined,
      description:
        messages && signedIn
          ? 'Conversations inside your RFQ workspace'
          : 'RFQ conversations — sign in with an eligible account',
    },
    {
      label: 'Account',
      href: signedIn ? '/dashboard/account' : '/auth/signin',
      description: signedIn
        ? 'Your account and role-specific workspace'
        : 'Sign in to your account',
    },
  ];
}

export function isPrimaryActive(href: string, pathname: string) {
  if (href === '/') return pathname === '/';
  if (href === '/dashboard/account')
    return (
      pathname.startsWith('/dashboard') &&
      !/\/(rfqs|leads|service-tickets|service-management)(\/|$)/.test(pathname)
    );
  if (/\/(service-tickets|service-management)$/.test(href))
    return /\/dashboard\/(?:admin\/)?(service-tickets|service-management)(\/|$)/.test(
      pathname,
    );
  if (/\/(rfqs|leads)$/.test(href))
    return /\/dashboard\/(?:admin\/)?(rfqs|leads)(\/|$)/.test(pathname);
  if (href === '/auth/signin') return pathname.startsWith('/auth/');
  return pathname === href || pathname.startsWith(`${href}/`);
}
