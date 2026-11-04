import LanguageContext from './contexts/LanguageContext';
import SessionContext from './contexts/SessionContext';
import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';

// Display face for headings on public pages; body text stays on Inter.
const display = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'iMet Machinery',
  description:
    'Explore industrial machinery, compare local dealers and international manufacturers, and request quotations on iMet.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <SessionContext>
          <LanguageContext>{children}</LanguageContext>
        </SessionContext>
      </body>
    </html>
  );
}
