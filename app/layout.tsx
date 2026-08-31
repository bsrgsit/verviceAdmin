import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Vervice Admin Portal',
  description: 'Operations & Management Portal for Vervice Car Care',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={font.variable}>
      <body className={`${font.className} font-sans bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
