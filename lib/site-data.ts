export type ProductCategory = 'all' | 'gâteau' | 'aliments traditionnel';

export type SiteLink = {
  href: string;
  label: string;
};



export type ProductCard = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  price: string;
  imageUrl: string;
  description: string;
  story: string;
  limitBay: number | null; // Maximum purchase limit per order
  state: 'exist' | 'outofStock' | 'commingSoun';
  publishedAt: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export function getProductFilter(category: string, slug: string): Exclude<ProductCategory, 'all'> {
  const normalizedCategory = category.toLowerCase().trim();
  if (normalizedCategory === 'aliments traditionnel' || normalizedCategory.includes('traditionnel')) {
    return 'aliments traditionnel';
  }
  return 'gâteau';
}
