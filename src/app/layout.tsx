import LanguageContext from './contexts/LanguageContext';
import SessionContext from './contexts/SessionContext';
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Self-host Inter so builds and browsers do not depend on Google Fonts access.
const inter = localFont({
  src: './fonts/inter-latin.woff2',
  weight: '400 700',
  variable: '--font-inter',
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
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-foreground antialiased">
        <SessionContext>
          <LanguageContext>{children}</LanguageContext>
        </SessionContext>
      </body>
    </html>
  );
}
