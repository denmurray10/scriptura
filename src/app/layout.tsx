import type { Metadata } from 'next';
import { Open_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import ClientProviders from '@/components/ClientProviders';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-open-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Scriptura',
  description: 'Craft Your Narrative. Forge Your World.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(openSans.variable, playfair.variable, "font-sans antialiased")}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
