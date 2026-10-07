import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Nos Produits',
  description: 'Découvrez notre sélection de gourmandises et pâtisseries artisanales.',
};

export default function ProductsPage() {
  redirect('/our-product');
}
