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
  title: {
    default: 'Candy Eco',
    template: '%s | Candy Eco',
  },
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
  userScalable: true,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" dir="ltr" suppressHydrationWarning className={`${outfit.variable} ${fredoka.variable}`}>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <Providers>
          <TabVisibilityNotifier />
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}