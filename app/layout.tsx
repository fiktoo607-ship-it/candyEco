import type { Metadata } from 'next';
import { Cairo, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from '@/components/providers';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Boulangerie Artisanale',
  description: 'Projet Next.js pour un site de boulangerie artisanale avec Tailwind CSS et Zustand.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" dir="ltr" className={`${cairo.variable} ${playfair.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}