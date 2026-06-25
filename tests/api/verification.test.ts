import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as registerUser } from '@/app/api/auth/register/route';
import { POST as verifyToken } from '@/app/api/auth/verify/route';
import { DELETE as deleteUser } from '@/app/api/users/[id]/route';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock lib/email
vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ messageId: 'mock-msg-id' }),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
      },
      verificationToken: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

describe('Authentication Registration & Verification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 400 if name is missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await registerUser(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Le nom est obligatoire.');
    });

    it('should return 400 if email is invalid', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'invalid-email', password: 'password123' }),
      });

      const response = await registerUser(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Une adresse e-mail valide est obligatoire.');
    });

    it('should return 400 if password is too short', async () => {
      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'short' }),
      });

      const response = await registerUser(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Le mot de passe doit comporter au moins 8 caractères.');
    });

    it('should return 400 if email is already taken', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'u1', email: 'test@example.com' } as any);

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@example.com', password: 'password123' }),
      });

      const response = await registerUser(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Cette adresse e-mail est déjà utilisée.');
    });

    it('should create user, generate token, and send email successfully', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.count).mockResolvedValue(1);
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'new-user-id', email: 'test@example.com' } as any);
      vi.mocked(prisma.verificationToken.create).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
      });

      const response = await registerUser(req);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.verificationToken.create).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should return 400 if token is missing', async () => {
      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await verifyToken(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Le jeton de vérification est requis.');
    });

    it('should return 400 if token is invalid or not found', async () => {
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'invalid-token' }),
      });

      const response = await verifyToken(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Ce lien d'activation est invalide ou a déjà été utilisé.");
    });

    it('should return 400 if token is expired', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 sec ago
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
        identifier: 'test@example.com',
        token: 'expired-token',
        expires: expiredDate,
      } as any);
      vi.mocked(prisma.verificationToken.delete).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'expired-token' }),
      });

      const response = await verifyToken(req);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Ce lien d'activation a expiré.");
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({ where: { token: 'expired-token' } });
    });

    it('should successfully verify email, mark user, and clean up token', async () => {
      const validDate = new Date(Date.now() + 60000); // 1 min from now
      vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
        identifier: 'test@example.com',
        token: 'valid-token',
        expires: validDate,
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      vi.mocked(prisma.verificationToken.delete).mockResolvedValue({} as any);

      const req = new NextRequest('http://localhost/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token' }),
      });

      const response = await verifyToken(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        data: { emailVerified: expect.any(Date) },
      });
      expect(prisma.verificationToken.delete).toHaveBeenCalledWith({ where: { token: 'valid-token' } });
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('should return 401 if user session is not admin', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'user-id-1', role: 'user' },
      });

      const req = new NextRequest('http://localhost/api/users/delete-id-1', {
        method: 'DELETE',
      });

      const response = await deleteUser(req, { params: Promise.resolve({ id: 'delete-id-1' }) });
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if admin user tries to delete their own account', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-id-1', role: 'admin' },
      });

      const req = new NextRequest('http://localhost/api/users/admin-id-1', {
        method: 'DELETE',
      });

      const response = await deleteUser(req, { params: Promise.resolve({ id: 'admin-id-1' }) });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Vous ne pouvez pas supprimer votre propre compte.');
    });

    it('should return 200 on successful deletion of other user', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: 'admin-id-1', role: 'admin' },
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'other-user-id', name: 'Other' } as any);
      vi.mocked(prisma.user.delete).mockResolvedValueOnce({} as any);

      const req = new NextRequest('http://localhost/api/users/other-user-id', {
        method: 'DELETE',
      });

      const response = await deleteUser(req, { params: Promise.resolve({ id: 'other-user-id' }) });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'other-user-id' } });
    });
  });
});
