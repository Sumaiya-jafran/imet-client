import Header from '@/components/shared/Header';
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-5 py-12">{children}</main>
    </>
  );
}
