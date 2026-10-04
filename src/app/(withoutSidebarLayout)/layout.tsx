import Header from '@/components/shared/Header';
export default function PublicLayout({
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
        className="mx-auto min-h-[75vh] max-w-7xl px-4 py-8 outline-none sm:px-6 lg:px-8 lg:py-10"
      >
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white px-5 py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 text-xs text-slate-500">
          <span className="font-semibold text-navy">iMet Machinery</span>
          <span>Machinery · Suppliers · Manufacturing</span>
        </div>
      </footer>
    </>
  );
}
