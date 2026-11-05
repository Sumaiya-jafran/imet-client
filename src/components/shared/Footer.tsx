import Link from 'next/link';
import { Factory } from 'lucide-react';
import { QUOTE_HREF } from '@/config/routes';

const columns = [
  {
    title: 'Marketplace',
    links: [
      { href: '/machinery', label: 'Browse machinery' },
      { href: '/suppliers', label: 'Find suppliers' },
      { href: QUOTE_HREF, label: 'Request a quote' },
      { href: '/#how-it-works', label: 'How it works' },
    ],
  },
  {
    title: 'For suppliers',
    links: [
      { href: '/#supplier-plans', label: 'Marketplace plans' },
      { href: '/dashboard/supplier', label: 'Become a supplier' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/auth/signin', label: 'Sign in' },
      { href: '/auth/signup', label: 'Create account' },
      { href: '/dashboard/account', label: 'Your workspace' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-border-strong">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2.5 font-sans text-section font-bold text-inverse"
          >
            <span className="flex size-9 items-center justify-center bg-accent text-foreground">
              <Factory size={19} aria-hidden="true" />
            </span>
            Machinmate <span className="text-nav font-medium text-subtle">Machinery</span>
          </Link>
          <p className="mt-5 max-w-xs text-nav leading-6 text-subtle">
            An industrial machinery marketplace connecting buyers with local
            dealers and international manufacturers.
          </p>
          {/* PLACEHOLDER: add company address, support email and phone once confirmed. */}
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-sans text-nav font-bold uppercase tracking-[0.15em] text-inverse">
              {col.title}
            </h2>
            <ul className="mt-5 space-y-3 text-nav">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-surface/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-4 py-6 text-meta text-subtle sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Machinmate. All rights reserved.</p>
          <p>Machinery · Suppliers · Manufacturing</p>
        </div>
      </div>
    </footer>
  );
}
