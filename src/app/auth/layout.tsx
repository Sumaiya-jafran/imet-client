import Header from '@/components/shared/Header';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="px-5 py-12">{children}</main>
    </>
  );
}
