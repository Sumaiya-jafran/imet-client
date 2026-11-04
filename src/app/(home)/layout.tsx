import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';

// Homepage layout: same chrome as other public pages, but full-bleed sections.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
