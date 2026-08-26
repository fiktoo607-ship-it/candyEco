import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getTransporter, sendVerificationEmail } from '@/lib/email';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

describe('SMTP TLS & Email Security (SEC-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASSWORD = 'password123';
  });

  it('should enforce strict TLS certificate validation (rejectUnauthorized: true)', () => {
    const createTransportSpy = vi.spyOn(nodemailer, 'createTransport');
    
    getTransporter();

    expect(createTransportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false, // Port 587 uses STARTTLS
        tls: expect.objectContaining({
          rejectUnauthorized: true,
          minVersion: 'TLSv1.2',
        }),
      })
    );
  });

  it('should configure direct SSL (secure: true) when SMTP port is 465', () => {
    process.env.SMTP_PORT = '465';
    const createTransportSpy = vi.spyOn(nodemailer, 'createTransport');
    
    getTransporter();

    expect(createTransportSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 465,
        secure: true,
        tls: expect.objectContaining({
          rejectUnauthorized: true,
        }),
      })
    );
  });

  it('should verify sendVerificationEmail encodes token and invokes transporter.sendMail', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'msg-123' });
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: mockSendMail,
    } as any);

    await sendVerificationEmail('recipient@example.com', 'raw-token-123+special');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
        subject: expect.stringContaining('Activez votre compte'),
        html: expect.stringContaining('raw-token-123%2Bspecial'),
      })
    );
  });

  it('should ensure rejectUnauthorized: false is never used anywhere in the codebase', () => {
    const libDir = path.join(process.cwd(), 'lib');
    const appDir = path.join(process.cwd(), 'app');

    function checkFilesForInsecureTLS(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkFilesForInsecureTLS(fullPath);
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          expect(content).not.toContain('rejectUnauthorized: false');
          expect(content).not.toContain('rejectUnauthorized:false');
        }
      }
    }

    checkFilesForInsecureTLS(libDir);
    checkFilesForInsecureTLS(appDir);
  });
});
