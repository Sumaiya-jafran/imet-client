import Link from 'next/link';
export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="text-xl font-bold text-navy">
          iMet Machinery
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap gap-3 text-sm"
        >
          <Link href="/machinery">Machinery</Link>
          <Link href="/suppliers">Suppliers</Link>
          <Link href="/auth/signup">Create account</Link>
          <Link href="/auth/signin">Sign in</Link>
          <Link href="/dashboard/account">Account</Link>
        </nav>
        <span className="hidden text-sm text-slate-500">
          Development foundation
        </span>
      </div>
    </header>
  );
}
