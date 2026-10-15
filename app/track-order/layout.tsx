import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suivre ma Commande',
  description: 'Suivez l’état de préparation et de livraison de votre commande Candy Eco en temps réel.',
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
