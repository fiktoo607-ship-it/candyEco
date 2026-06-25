import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getConfig, POST as updateConfig } from '@/app/api/config/route';
import { getAllSiteConfigs, saveSiteConfig } from '@/lib/config';
import { NextRequest } from 'next/server';

// Mock lib/config
vi.mock('@/lib/config', () => ({
  getAllSiteConfigs: vi.fn(),
  saveSiteConfig: vi.fn(),
  initCmsConfigIfNeeded: vi.fn(),
}));

// Mock next-auth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue({
    user: { id: 'admin-uuid', role: 'admin', name: 'Admin', email: 'admin@example.com' },
  }),
}));

describe('Config API', () => {
  const mockConfigs = {
    carousel_products: ['p1', 'p2'],
    carousel_max_slides: 5,
    new_products_limit: 4,
    homepage_story_title: "Histoire",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllSiteConfigs).mockResolvedValue(mockConfigs);
  });

  describe('GET /api/config', () => {
    it('should retrieve all site configurations', async () => {
      const response = await getConfig();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual(mockConfigs);
      expect(getAllSiteConfigs).toHaveBeenCalled();
    });
  });

  describe('POST /api/config', () => {
    it('should successfully save valid configurations', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 6,
          new_products_limit: 8,
          homepage_story_title: 'Updated title',
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(saveSiteConfig).toHaveBeenCalledWith('carousel_max_slides', 6);
      expect(saveSiteConfig).toHaveBeenCalledWith('new_products_limit', 8);
      expect(saveSiteConfig).toHaveBeenCalledWith('homepage_story_title', 'Updated title');
    });

    it('should return 400 when carousel_max_slides is less than 1', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 0,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Le nombre maximum de diapositives doit être un entier supérieur ou égal à 1.');
    });

    it('should return 400 when new_products_limit is less than 1', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          new_products_limit: 0,
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('La limite des nouveaux produits doit être un entier supérieur ou égal à 1.');
    });

    it('should return 400 when new_products_limit is not a number', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          new_products_limit: 'invalid',
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('La limite des nouveaux produits doit être un entier supérieur ou égal à 1.');
    });

    it('should return 400 when carousel_products exceeds carousel_max_slides limit', async () => {
      const req = new NextRequest('http://localhost/api/config', {
        method: 'POST',
        body: JSON.stringify({
          carousel_max_slides: 2,
          carousel_products: ['slug-1', 'slug-2', 'slug-3'],
        }),
      });

      const response = await updateConfig(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBe('Vous ne pouvez pas sélectionner plus de 2 produits pour le carousel.');
    });
  });
});
