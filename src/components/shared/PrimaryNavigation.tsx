'use client';
import {
  isPrimaryActive,
  primaryLinks,
  type PrimaryLink,
} from '@/config/primary-nav';
import { QUOTE_HREF } from '@/config/routes';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth';
import {
  ArrowUp,
  Boxes,
  Factory,
  Home,
  MessageSquare,
  Plus,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const icons = [Home, Factory, Boxes, Wrench, MessageSquare, UserRound];

export default function PrimaryNavigation({ roles }: { roles?: UserRole[] }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const slot = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [docked, setDocked] = useState(false);
  const [bumpCenterX, setBumpCenterX] = useState<number>(156);

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

  const updateBumpPosition = useCallback(() => {
    const navEl = dockRef.current;
    if (!navEl) return;
    const activeLink =
      links.find((l) => l.href && isPrimaryActive(l.href, pathname)) ??
      links[0];
    const targetEl = activeLink ? itemRefs.current[activeLink.label] : null;
    if (!targetEl) return;

    const navRect = navEl.getBoundingClientRect();
    const itemRect = targetEl.getBoundingClientRect();
    if (navRect.width > 0 && itemRect.width > 0) {
      setBumpCenterX(itemRect.left - navRect.left + itemRect.width / 2);
    }
  }, [links, pathname]);

  useEffect(() => {
    updateBumpPosition();
    const timer = window.setTimeout(updateBumpPosition, 60);
    window.addEventListener('resize', updateBumpPosition);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', updateBumpPosition);
    };
  }, [updateBumpPosition, docked, pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderDesktopLink = (
    item: PrimaryLink,
    index: number,
    isDockedMode: boolean,
  ) => {
    const { href, label, description } = item;
    const active = Boolean(href && isPrimaryActive(href, pathname));
    const className = cn(
      'primary-nav-item',
      active && 'primary-nav-active',
      !href && 'primary-nav-unavailable',
    );

    const setRef = (el: HTMLElement | null) => {
      if (isDockedMode) {
        itemRefs.current[label] = el;
      }
    };

    if (href) {
      return (
        <Link
          ref={setRef}
          href={href}
          prefetch={false}
          title={description}
          aria-current={active ? 'page' : undefined}
          className={className}
        >
          <span>{label}</span>
        </Link>
      );
    }

    return (
      <span
        ref={setRef}
        aria-disabled="true"
        aria-label={description}
        title={description}
        className={className}
      >
        <span>{label}</span>
      </span>
    );
  };

  // Mobile 5-slot bottom bar items: Home, Suppliers/Machines, Center + Post RFQ, RFQs/Messages, Account
  const mobileLeftItems = [links[0], links[1]];
  const mobileRightItems = [links[4], links[5]];

  return (
    <div ref={slot} className="primary-nav-slot" data-docked={docked}>
      <nav
        ref={dockRef}
        aria-label="Primary navigation"
        className="primary-nav"
      >
        {/* ===================================================================
            DESKTOP TOP NOTCH BAR (Image 1 — Before Scrolling, docked=false)
           =================================================================== */}
        <div className="primary-nav-notch-inner hidden lg:flex">
          <Link
            href="/"
            prefetch={false}
            aria-label="Machinmate home"
            className="primary-nav-brand"
          >
            <span className="primary-nav-brand-badge">
              <Factory size={15} aria-hidden="true" />
            </span>
            <span className="primary-nav-brand-text">Machinmate</span>
          </Link>

          <ul className="primary-nav-links-list">
            {links.map((item, index) => (
              <li key={item.label} className="min-w-0">
                {renderDesktopLink(item, index, false)}
              </li>
            ))}
          </ul>

          <Link
            href={QUOTE_HREF}
            prefetch={false}
            className="primary-nav-cta-pill"
          >
            <Factory size={13} aria-hidden="true" />
            <span>Request Quote</span>
          </Link>
        </div>

        {/* ===================================================================
            DESKTOP FLOATING BOTTOM DOCK (Image 2 — After Scrolling, docked=true)
           =================================================================== */}
        <div className="primary-nav-dock-inner hidden lg:flex">
          {/* Dynamic Upward Bezier Wave Hump aligned over the active pill */}
          <svg
            aria-hidden="true"
            viewBox="0 0 156 24"
            preserveAspectRatio="none"
            className="primary-nav-dock-wave"
            style={{
              left: `${Math.max(52, bumpCenterX - 78)}px`,
            }}
          >
            <path
              d="M0,24 C34,24 46,2 78,2 C110,2 122,24 156,24 Z"
              fill="currentColor"
            />
          </svg>

          {/* Left Square Scroll-to-Top Button */}
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            title="Scroll to top"
            className="primary-nav-dock-square-btn"
          >
            <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>

          {/* Center Navigation Links (Active gets white pill #eff1f3) */}
          <ul className="primary-nav-dock-list">
            {links.map((item, index) => (
              <li key={item.label} className="min-w-0">
                {renderDesktopLink(item, index, true)}
              </li>
            ))}
          </ul>

          {/* Right Square User Profile Button */}
          <Link
            href={signedIn ? '/dashboard/account' : '/auth/signin'}
            prefetch={false}
            aria-label={signedIn ? 'Your account workspace' : 'Sign in'}
            title={signedIn ? 'Your account workspace' : 'Sign in'}
            className="primary-nav-dock-square-btn"
          >
            <UserRound size={20} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>

        {/* ===================================================================
            MOBILE APP-STYLE BOTTOM TAB BAR (Image 3 — <1024px)
           =================================================================== */}
        <ul className="primary-nav-mobile-grid grid grid-cols-5 items-center lg:hidden">
          {mobileLeftItems.map((item, idx) => {
            if (!item) return null;
            const Icon = icons[idx] ?? Home;
            const active = Boolean(
              item.href && isPrimaryActive(item.href, pathname),
            );
            const content = (
              <>
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
              </>
            );
            return (
              <li key={item.label} className="min-w-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    prefetch={false}
                    title={item.description}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'primary-nav-mobile-item',
                      active && 'primary-nav-mobile-active',
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title={item.description}
                    className="primary-nav-mobile-item primary-nav-unavailable"
                  >
                    {content}
                  </span>
                )}
              </li>
            );
          })}

          {/* Center Raised Yellow/Amber '+' Action Button */}
          <li className="flex flex-col items-center justify-end">
            <Link
              href={QUOTE_HREF}
              prefetch={false}
              aria-label="Request a quote"
              className="primary-nav-mobile-fab"
            >
              <Plus size={22} strokeWidth={2.6} aria-hidden="true" />
            </Link>
            <span className="mt-1 text-[10px] font-semibold leading-none text-slate-500">
              Post RFQ
            </span>
          </li>

          {mobileRightItems.map((item, idx) => {
            if (!item) return null;
            const Icon = icons[idx + 4] ?? UserRound;
            const active = Boolean(
              item.href && isPrimaryActive(item.href, pathname),
            );
            const content = (
              <>
                <Icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
              </>
            );
            return (
              <li key={item.label} className="min-w-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    prefetch={false}
                    title={item.description}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'primary-nav-mobile-item',
                      active && 'primary-nav-mobile-active',
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title={item.description}
                    className="primary-nav-mobile-item primary-nav-unavailable"
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
