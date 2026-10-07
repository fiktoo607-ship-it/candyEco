import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez votre compte Candy Eco en quelques instants.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
