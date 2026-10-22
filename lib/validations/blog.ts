import { z } from 'zod';

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const createBlogPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre ne peut pas être vide')
    .max(255, 'Le titre est trop long'),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? slugify(val) : undefined)),
  summary: z
    .string()
    .trim()
    .min(1, 'Le résumé ne peut pas être vide'),
  content: z
    .string()
    .min(1, 'Le contenu ne peut pas être vide'),
  coverImage: z
    .string()
    .trim()
    .min(1, "L'image de couverture ne peut pas être vide"),
  category: z
    .string()
    .trim()
    .min(1, 'La catégorie ne peut pas être vide'),
  readingTime: z
    .union([z.number().int().min(1), z.string().regex(/^\d+$/).transform(Number)])
    .default(3),
  isPublished: z.boolean().default(false),
  publishedAt: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

export const updateBlogPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre ne peut pas être vide')
    .max(255, 'Le titre est trop long')
    .optional(),
  slug: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? slugify(val) : undefined)),
  summary: z
    .string()
    .trim()
    .min(1, 'Le résumé ne peut pas être vide')
    .optional(),
  content: z
    .string()
    .min(1, 'Le contenu ne peut pas être vide')
    .optional(),
  coverImage: z
    .string()
    .trim()
    .min(1, "L'image de couverture ne peut pas être vide")
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, 'La catégorie ne peut pas être vide')
    .optional(),
  readingTime: z
    .union([z.number().int().min(1), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((val) => (val ? new Date(val) : null)),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
