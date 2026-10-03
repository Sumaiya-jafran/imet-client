import Link from 'next/link';
export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-xl font-bold text-navy">
          iMet Machinery
        </Link>
        <span className="text-sm text-slate-500">Development foundation</span>
      </div>
    </header>
  );
}
