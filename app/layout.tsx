import type { Metadata, Viewport } from 'next';
import { Outfit, Fredoka } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';
import TabVisibilityNotifier from '@/components/TabVisibilityNotifier';
import PwaRegister from '@/components/PwaRegister';
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
  applicationName: THEME_CONFIG.brand.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: THEME_CONFIG.brand.name,
  },
  icons: {
    icon: [
      { url: '/logo.jpeg', sizes: '192x192', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/logo.jpeg', sizes: '180x180', type: 'image/jpeg' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: THEME_CONFIG.colors.primary,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}