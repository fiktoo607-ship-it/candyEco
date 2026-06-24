import { Product } from './hooks/use-products';

/**
 * Filters a list of products by their title using a case-insensitive search.
 * Trims leading and trailing spaces from the query.
 *
 * @param products The array of products to filter.
 * @param query The search term.
 * @returns The filtered array of products.
 */
export function filterProductsByTitle(products: Product[], query: string): Product[] {
  if (!query) return products;
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return products;
  return products.filter((product) =>
    product.title.toLowerCase().includes(normalizedQuery)
  );
}
