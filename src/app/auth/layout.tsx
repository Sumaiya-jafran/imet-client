import Header from '@/components/shared/Header';
import { Factory, ArrowUpRight } from 'lucide-react';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto grid min-h-[calc(100vh-85px)] max-w-6xl items-center gap-10 px-4 py-10 outline-none sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-16"
      >
        <aside className="hidden lg:block">
          <span className="eyebrow">Your industry. Connected.</span>
          <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight">
            A workspace for
            <br />
            your next big move.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
            Explore machinery, discover suppliers and manage your business
            profile in one industrial marketplace.
          </p>
          <div className="mt-9 flex items-center gap-4 border-t border-slate-200 pt-6">
            <span className="rounded-xl bg-navy p-3 text-white">
              <Factory size={25} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">iMet Machinery</p>
              <p className="text-xs text-slate-500">
                Built for buyers, suppliers and manufacturers
              </p>
            </div>
            <ArrowUpRight
              size={18}
              className="ml-auto text-slate-400"
              aria-hidden="true"
            />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </main>
    </>
  );
}
