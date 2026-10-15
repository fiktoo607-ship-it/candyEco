import { vi, describe, it, expect, beforeEach } from 'vitest';
import { POST as submitContact } from '@/app/api/contact/route';
import { GET as getDeliveryMethods } from '@/app/api/delivery-methods/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as emailLib from '@/lib/email';

const mockSendMail = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/email', () => ({
  getTransporter: vi.fn(() => ({
    sendMail: mockSendMail,
  })),
  sendContactEmail: vi.fn((data) => mockSendMail(data)),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deliveryMethod: {
      findMany: vi.fn(),
    },
  },
}));

describe('Issues #54, #55, and #123: Contact Form & Delivery Labels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #55: Contact form submission with real email service & real error handling', () => {
    it('should invoke email service and return 200 upon valid contact submission', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'msg-101' });

      const req = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Benali',
          email: 'sarah@example.dz',
          phone: '0550123456',
          message: 'Bonjour, je souhaite commander pour un événement.',
        }),
      });

      const res = await submitContact(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('should return a real error (status >= 400) upon failure instead of fake success message', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP Transport Connection Failed'));

      const req = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Karim',
          email: 'karim@example.dz',
          message: 'Demande de devis',
        }),
      });

      const res = await submitContact(req);
      expect(res.status).toBeGreaterThanOrEqual(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
      expect(data.success).toBeUndefined();
    });

    it('should reject invalid input payload with 400 when name, email or message is missing or invalid', async () => {
      // 1. Missing name
      const reqNoName = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'valid@example.com', message: 'Hello' }),
      });
      const resNoName = await submitContact(reqNoName);
      expect(resNoName.status).toBe(400);

      // 2. Invalid email format
      const reqBadEmail = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Samir', email: 'not-an-email', message: 'Hello' }),
      });
      const resBadEmail = await submitContact(reqBadEmail);
      expect(resBadEmail.status).toBe(400);

      // 3. Missing message
      const reqNoMsg = new NextRequest('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Samir', email: 'samir@example.com', message: '' }),
      });
      const resNoMsg = await submitContact(reqNoMsg);
      expect(resNoMsg.status).toBe(400);

      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('Issue #123: Delivery option labels clean of "test test test"', () => {
    it('should sanitize delivery option labels and ensure they do not contain "test test test"', async () => {
      vi.mocked(prisma.deliveryMethod.findMany).mockResolvedValueOnce([
        { id: 'dm-1', name: 'Livraison Express test test test', price: 10, active: true },
        { id: 'dm-2', name: 'yalidin test test test', price: 5, active: true },
      ] as any);

      const res = await getDeliveryMethods();
      expect(res.status).toBe(200);

      const methods = await res.json();
      expect(methods).toHaveLength(2);

      expect(methods[0].name).not.toContain('test test test');
      expect(methods[0].name).toBe('Livraison Express');

      expect(methods[1].name).not.toContain('test test test');
      expect(methods[1].name).toBe('Yalidine Express');
    });
  });
});
