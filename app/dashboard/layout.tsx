import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de Bord',
  description: 'Panneau d’administration et gestion de la boutique.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
