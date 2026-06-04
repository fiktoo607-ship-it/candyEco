export type ProductCategory = 'all' | 'pastry' | 'dessert' | 'bread' | 'cookies' | 'tart' | 'macarons' | 'cake';

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
  limitBay: number | null;
  state: 'exist' | 'outofStock' | 'commingSoun';
  publishedAt: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export function getProductFilter(category: string, slug: string): Exclude<ProductCategory, 'all'> {
  const s = slug.toLowerCase();
  if (s.includes('macaron')) return 'macarons';
  if (s.includes('tart')) return 'tart';
  
  switch (category) {
    case 'Viennoiseries':
      return 'pastry';
    case 'Gâteaux':
      return 'cake';
    case 'Biscuits':
      return 'cookies';
    case 'Boulangerie':
      return 'bread';
    case 'Pâtisseries':
      return 'tart';
    default:
      return 'cake';
  }
}


