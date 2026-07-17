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

  // Split query into individual words
  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return products;

  // Dictionary for translating common English search terms to French equivalents
  const englishToFrenchMap: { [key: string]: string[] } = {
    'traditional': ['tradition', 'traditionnel', 'traditionnelle'],
    'french': ['français', 'francaise', 'française', 'france'],
    'cake': ['gâteau', 'gateau'],
    'oil': ['huile'],
    'olive': ['olive'],
    'bread': ['pain', 'baguette'],
    'baguette': ['baguette'],
    'sweet': ['sucré', 'sucre', 'doux'],
    'salty': ['salé', 'sale'],
    'organic': ['bio'],
  };

  return products.filter((product) => {
    const title = product.title.toLowerCase();
    const category = product.category.toLowerCase();
    const description = product.description?.toLowerCase() || '';
    const tags = product.tags?.map(t => t.toLowerCase()) || [];

    // All query words must match in some way (either directly or via English-to-French mappings)
    return queryWords.every((word) => {
      // 1. Direct match on title, category, description, or tags
      if (
        title.includes(word) ||
        category.includes(word) ||
        description.includes(word) ||
        tags.some(t => t.includes(word))
      ) {
        return true;
      }

      // 2. Check English-to-French translations
      for (const [eng, freWords] of Object.entries(englishToFrenchMap)) {
        // If the query word matches or is a prefix/substring of the English term (e.g., "traditiona", "traditional")
        if (eng.includes(word) || word.includes(eng)) {
          if (
            freWords.some(
              (fre) =>
                title.includes(fre) ||
                category.includes(fre) ||
                description.includes(fre) ||
                tags.some(t => t.includes(fre))
            )
          ) {
            return true;
          }
        }
      }

      return false;
    });
  });
}

/**
 * Generates a URL-friendly slug from a text string, supporting Arabic/French characters.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-ء-ي]/g, '');
}

