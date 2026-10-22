export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  readingTime: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const BLOG_CATEGORIES = [
  'Tous',
  'Recettes',
  'Ingrédients Bio',
  'Coulisses',
  'Actualités',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
