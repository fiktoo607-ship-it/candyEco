import type { Metadata } from 'next';
import { Outfit, Fredoka } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import TabVisibilityNotifier from '@/components/TabVisibilityNotifier';
import { THEME_CONFIG } from '@/lib/theme';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap'
});

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap'
});

export const metadata: Metadata = {
  title: THEME_CONFIG.brand.name,
  description: THEME_CONFIG.brand.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" dir="ltr" className={`${outfit.variable} ${fredoka.variable}`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        <Providers>
          <TabVisibilityNotifier />
          {children}
        </Providers>
      </body>
    </html>
  );
}