import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes Commandes',
  description: 'Consultez l’historique et le statut de vos commandes Candy Eco.',
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
