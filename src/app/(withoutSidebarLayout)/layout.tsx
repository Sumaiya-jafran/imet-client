import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
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
      <Footer />
    </>
  );
}
