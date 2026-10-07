import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hors Ligne',
  description: 'Vous êtes actuellement hors ligne.',
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
