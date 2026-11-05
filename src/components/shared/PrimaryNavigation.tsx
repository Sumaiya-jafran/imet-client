'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Home,
  Factory,
  Boxes,
  Wrench,
  MessageSquare,
  UserRound,
} from 'lucide-react';
import { isPrimaryActive, primaryLinks } from '@/config/primary-nav';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';

const icons = [Home, Factory, Boxes, Wrench, MessageSquare, UserRound];

export default function PrimaryNavigation({ roles }: { roles?: UserRole[] }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const slot = useRef<HTMLDivElement>(null);
  const [docked, setDocked] = useState(false);
  const signedIn = status === 'authenticated' && !session?.error;
  const links = primaryLinks(roles ?? session?.account?.roles ?? [], signedIn);

  useEffect(() => {
    const element = slot.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      // Below the viewport is still the top state (e.g. after history restoration).
      setDocked(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={slot} className="primary-nav-slot" data-docked={docked}>
      <nav aria-label="Primary navigation" className="primary-nav">
        <ul className="grid grid-cols-6 gap-0.5">
          {links.map(({ href, label, description }, index) => {
            const Icon = icons[index];
            const active = href && isPrimaryActive(href, pathname);
            const content = (
              <>
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </>
            );
            const className = cn(
              'primary-nav-item',
              active && 'primary-nav-active',
            );
            return (
              <li key={label} className="min-w-0">
                {href ? (
                  <Link
                    href={href}
                    prefetch={false}
                    title={description}
                    aria-current={active ? 'page' : undefined}
                    className={className}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    aria-label={description}
                    title={description}
                    className={cn(className, 'primary-nav-unavailable')}
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
