import { describe, it, expect } from 'vitest';
import { filterProductsByTitle } from '@/lib/products';
import { Product } from '@/lib/hooks/use-products';

const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Gâteau au Chocolat',
    slug: 'gateau-au-chocolat',
    category: 'gâteau',
    price: '$5.00',
    imageUrl: '/mock.jpg',
    description: 'Chocolat délicieux',
    story: 'L’histoire',
    limitBay: 1,
    state: 'exist',
    visibility: 1,
    tags: [],
    publishedAt: null,
  },
  {
    id: '2',
    title: 'Pain au Chocolat',
    slug: 'pain-au-chocolat',
    category: 'aliments traditionnel',
    price: '$1.50',
    imageUrl: '/mock2.jpg',
    description: 'Viennoiserie',
    story: 'L’histoire 2',
    limitBay: null,
    state: 'exist',
    visibility: 2,
    tags: [],
    publishedAt: null,
  },
  {
    id: '3',
    title: 'Croissant Nature',
    slug: 'croissant-nature',
    category: 'aliments traditionnel',
    price: '$1.20',
    imageUrl: '/mock3.jpg',
    description: 'Croissant croustillant',
    story: 'L’histoire 3',
    limitBay: null,
    state: 'exist',
    visibility: 3,
    tags: [],
    publishedAt: null,
  }
];

describe('filterProductsByTitle helper', () => {
  it('should return all products when query is empty', () => {
    const results = filterProductsByTitle(mockProducts, '');
    expect(results).toEqual(mockProducts);
  });

  it('should return all products when query is just whitespace', () => {
    const results = filterProductsByTitle(mockProducts, '   ');
    expect(results).toEqual(mockProducts);
  });

  it('should filter products case-insensitively by title', () => {
    const results = filterProductsByTitle(mockProducts, 'chocolat');
    expect(results).toHaveLength(2);
    expect(results.map(p => p.id)).toContain('1');
    expect(results.map(p => p.id)).toContain('2');
  });

  it('should trim query whitespace before filtering', () => {
    const results = filterProductsByTitle(mockProducts, '  chocolat  ');
    expect(results).toHaveLength(2);
    expect(results.map(p => p.id)).toContain('1');
    expect(results.map(p => p.id)).toContain('2');
  });

  it('should match titles with different casings', () => {
    const results = filterProductsByTitle(mockProducts, 'gÂtEaU');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');
  });

  it('should return empty list if no products match the query', () => {
    const results = filterProductsByTitle(mockProducts, 'tarte');
    expect(results).toHaveLength(0);
  });
});
