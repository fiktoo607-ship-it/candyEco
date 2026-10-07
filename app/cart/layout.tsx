import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panier',
  description: 'Consultez et validez votre panier de commande.',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
