import LanguageContext from './contexts/LanguageContext';
import SessionContext from './contexts/SessionContext';
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'iMet Machinery',
  description: 'Industrial machinery marketplace development foundation.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <SessionContext>
          <LanguageContext>{children}</LanguageContext>
        </SessionContext>
      </body>
    </html>
  );
}
