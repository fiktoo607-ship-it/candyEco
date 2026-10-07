import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vérification de l’email',
  description: 'Vérifiez votre adresse email pour valider votre compte.',
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
