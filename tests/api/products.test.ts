import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GET as getProducts, POST as createProduct } from '@/app/api/products/route';
import { GET as getProduct, PUT as updateProduct, DELETE as deleteProduct } from '@/app/api/products/[id]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { deleteImage } from '@/lib/cloudinary';

// Mock Cloudinary
vi.mock('@/lib/cloudinary', () => ({
  uploadImage: vi.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/mock.jpg',
    publicId: 'products/mock',
  }),
  deleteImage: vi.fn().mockResolvedValue({
    result: 'ok',
  }),
  getPublicIdFromUrl: vi.fn().mockReturnValue('products/mock'),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const mockPrisma = {
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    pointsTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrisma);
      }
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return Promise.resolve(arg);
    }),
  };
  return {
    prisma: mockPrisma,
  };
});

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: 'prod-uuid-1',
    title: 'Test Cake',
    slug: 'test-cake',
    price: '$10.00',
    category: 'Cakes',
    imageUrl: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/mock.jpg',
    description: 'A delicious test cake.',
    story: 'The story behind the test cake.',
    limitBay: 5,
    state: 'exist',
    visibility: 2,
    publishedAt: new Date('2026-06-04T10:00:00Z'),
    createdAt: new Date('2026-06-04T10:00:00Z'),
    updatedAt: new Date('2026-06-04T10:00:00Z'),
  };

  const mockProductJson = JSON.parse(JSON.stringify(mockProduct));

  describe('GET /api/products', () => {
    it('should retrieve all products sorted by visibility (desc) and createdAt (desc)', async () => {
      const mockProducts = [
        { ...mockProduct, id: 'prod-uuid-1', visibility: 10 },
        { ...mockProduct, id: 'prod-uuid-2', visibility: 5 },
      ];
      const mockProductsJson = JSON.parse(JSON.stringify(mockProducts));

      vi.mocked(prisma.product.findMany).mockResolvedValueOnce(mockProducts);

      const response = await getProducts();
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual(mockProductsJson);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        orderBy: [
          { visibility: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    });

    it('should return 500 when database fetching fails', async () => {
      vi.mocked(prisma.product.findMany).mockRejectedValueOnce(new Error('DB connection failed'));

      const response = await getProducts();
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'DB connection failed' });
    });
  });

  describe('POST /api/products', () => {
    const validBody = {
      title: 'New Product',
      slug: 'new-product',
      price: '$15.00',
      category: 'Cupcakes',
      imageUrl: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/mock.jpg',
      description: 'Brand new cupcake.',
      story: 'Story of cupcake.',
      limitBay: 10,
      visibility: 3,
      publishedAt: '2026-06-04T12:00:00.000Z',
    };

    it('should validate and create a new product successfully', async () => {
      const req = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });

      const expectedCreated = {
        ...mockProduct,
        ...validBody,
        publishedAt: new Date(validBody.publishedAt),
      };
      const expectedCreatedJson = JSON.parse(JSON.stringify(expectedCreated));

      vi.mocked(prisma.product.create).mockResolvedValueOnce(expectedCreated);

      const response = await createProduct(req);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toEqual(expectedCreatedJson);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          title: validBody.title,
          slug: validBody.slug,
          price: validBody.price,
          category: validBody.category,
          imageUrl: validBody.imageUrl,
          description: validBody.description,
          story: validBody.story,
          limitBay: 10,
          state: 'exist',
          visibility: 3,
          publishedAt: new Date(validBody.publishedAt),
        },
      });
    });

    it('should return 400 error when required fields are missing', async () => {
      const incompleteBody = {
        title: 'Missing other fields',
      };

      const req = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteBody),
      });

      const response = await createProduct(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'Missing required fields' });
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('should handle optional fields and default values correctly', async () => {
      const bodyWithDefaults = {
        title: 'Default Product',
        slug: 'default-product',
        price: '$5.00',
        category: 'Cookies',
        imageUrl: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/mock.jpg',
        description: 'Cookie description',
        story: 'Cookie story',
      };

      const req = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyWithDefaults),
      });

      vi.mocked(prisma.product.create).mockResolvedValueOnce({
        ...mockProduct,
        ...bodyWithDefaults,
        limitBay: null,
        state: 'exist',
        visibility: 0,
        publishedAt: null,
      });

      const response = await createProduct(req);
      expect(response.status).toBe(201);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          title: bodyWithDefaults.title,
          slug: bodyWithDefaults.slug,
          price: bodyWithDefaults.price,
          category: bodyWithDefaults.category,
          imageUrl: bodyWithDefaults.imageUrl,
          description: bodyWithDefaults.description,
          story: bodyWithDefaults.story,
          limitBay: null,
          state: 'exist',
          visibility: 0,
          publishedAt: null,
        },
      });
    });

    it('should return 500 when product creation fails in the database', async () => {
      const req = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });

      vi.mocked(prisma.product.create).mockRejectedValueOnce(new Error('Unique constraint failed on slug'));

      const response = await createProduct(req);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'Unique constraint failed on slug' });
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should return product details when product exists', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct);

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`);
      const response = await getProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockProductJson);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
    });

    it('should return 404 when product does not exist', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/products/unknown-id');
      const response = await getProduct(req, { params: Promise.resolve({ id: 'unknown-id' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Product not found' });
    });

    it('should return 500 when fetching product by ID fails', async () => {
      vi.mocked(prisma.product.findUnique).mockRejectedValueOnce(new Error('Database error'));

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`);
      const response = await getProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Database error' });
    });
  });

  describe('PUT /api/products/[id]', () => {
    it('should return 404 if product to update is not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

      const req = new NextRequest(`http://localhost/api/products/unknown-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      });

      const response = await updateProduct(req, { params: Promise.resolve({ id: 'unknown-id' }) });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Product not found' });
    });

    it('should update product fields successfully without deleting image if image is unchanged', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct);
      
      const updateData = {
        title: 'New Cake Name',
        price: '$12.00',
      };

      const expectedUpdated = { ...mockProduct, ...updateData };
      const expectedUpdatedJson = JSON.parse(JSON.stringify(expectedUpdated));
      vi.mocked(prisma.product.update).mockResolvedValueOnce(expectedUpdated);

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await updateProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual(expectedUpdatedJson);
      expect(deleteImage).not.toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        data: {
          title: updateData.title,
          slug: mockProduct.slug,
          category: mockProduct.category,
          price: updateData.price,
          imageUrl: mockProduct.imageUrl,
          description: mockProduct.description,
          story: mockProduct.story,
          limitBay: mockProduct.limitBay,
          state: mockProduct.state,
          visibility: mockProduct.visibility,
          publishedAt: mockProduct.publishedAt,
        },
      });
    });

    it('should trigger deleteImage on Cloudinary if imageUrl changes', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct);
      
      const updateData = {
        imageUrl: 'https://res.cloudinary.com/dummy/image/upload/v12345/products/new-mock.jpg',
      };

      const expectedUpdated = { ...mockProduct, ...updateData };
      vi.mocked(prisma.product.update).mockResolvedValueOnce(expectedUpdated);

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const response = await updateProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });
      expect(response.status).toBe(200);
      expect(deleteImage).toHaveBeenCalledWith(mockProduct.imageUrl);
      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('should return 500 when product update fails in the database', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct);
      vi.mocked(prisma.product.update).mockRejectedValueOnce(new Error('Update database timeout'));

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Name' }),
      });

      const response = await updateProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Update database timeout' });
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should return 404 if product to delete is not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(null);

      const req = new NextRequest('http://localhost/api/products/unknown-id', {
        method: 'DELETE',
      });

      const response = await deleteProduct(req, { params: Promise.resolve({ id: 'unknown-id' }) });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Product not found' });
    });

    it('should delete product and trigger Cloudinary image cleanup if image exists', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct);
      vi.mocked(prisma.product.delete).mockResolvedValueOnce(mockProduct);

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`, {
        method: 'DELETE',
      });

      const response = await deleteProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({ message: 'Product deleted successfully' });
      expect(deleteImage).toHaveBeenCalledWith(mockProduct.imageUrl);
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
    });

    it('should return 500 when product deletion fails', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(mockProduct);
      vi.mocked(prisma.product.delete).mockRejectedValueOnce(new Error('Delete restricted by foreign key'));

      const req = new NextRequest(`http://localhost/api/products/${mockProduct.id}`, {
        method: 'DELETE',
      });

      const response = await deleteProduct(req, { params: Promise.resolve({ id: mockProduct.id }) });
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data).toEqual({ error: 'Delete restricted by foreign key' });
    });
  });
});
