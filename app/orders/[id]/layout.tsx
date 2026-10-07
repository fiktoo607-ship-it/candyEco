import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suivi de Commande',
  description: 'Détails et suivi en direct de votre commande Candy Eco.',
};

export default function OrderTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
