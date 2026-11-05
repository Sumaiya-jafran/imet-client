import LanguageContext from './contexts/LanguageContext';
import SessionContext from './contexts/SessionContext';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Display face for headings on public pages; body text stays on Inter.
const display = localFont({
  src: './fonts/archivo-latin.woff2',
  weight: '100 900',
  variable: '--font-archivo',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Machinmate',
  description:
    'Explore industrial machinery, compare local dealers and international manufacturers, and request quotations on Machinmate.',
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
