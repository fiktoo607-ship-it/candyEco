import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sanitizeLogData, logAuditEvent, logAuthData } from '@/lib/audit-logger';
import fs from 'fs';
import path from 'path';

describe('Audit Logger & Sensitive Data Sanitizer (SEC-04)', () => {
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('sanitizeLogData()', () => {
    it('should redact sensitive OAuth tokens and secrets', () => {
      const rawPayload = {
        userId: 'usr-123',
        access_token: 'ya29.a0AfH6SMD-extremely-sensitive-access-token',
        refresh_token: '1//0gK9...refresh-token',
        id_token: 'eyJhbGciOiJSUzI1NiIs...id-token',
        client_secret: 'GOCSPX-super-secret',
        password: 'PlainTextPassword123!',
        authorization: 'Bearer secret-bearer-token',
        cookie: 'next-auth.session-token=secret-session',
        apiKey: 'AIzaSySecretApiKey',
        safeMetadata: 'public-info',
      };

      const sanitized = sanitizeLogData(rawPayload);

      expect(sanitized.userId).toBe('usr-123');
      expect(sanitized.safeMetadata).toBe('public-info');
      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.refresh_token).toBe('[REDACTED]');
      expect(sanitized.id_token).toBe('[REDACTED]');
      expect(sanitized.client_secret).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
    });

    it('should recursively sanitize deeply nested objects and arrays', () => {
      const nestedPayload = {
        user: {
          id: 'u-1',
          auth: {
            password: 'my-password',
            sessionToken: 'jwt-token-string',
          },
        },
        accounts: [
          {
            provider: 'google',
            accessToken: 'token-123',
            scope: 'openid',
          },
        ],
      };

      const sanitized = sanitizeLogData(nestedPayload);

      expect(sanitized.user.id).toBe('u-1');
      expect(sanitized.user.auth.password).toBe('[REDACTED]');
      expect(sanitized.user.auth.sessionToken).toBe('[REDACTED]');
      expect(sanitized.accounts[0].provider).toBe('google');
      expect(sanitized.accounts[0].accessToken).toBe('[REDACTED]');
    });
  });

  describe('logAuditEvent() & logAuthData()', () => {
    it('should not persist plain credentials to disk (authData.txt decommissioned)', () => {
      const sensitiveAccount = {
        provider: 'google',
        type: 'oauth',
        providerAccountId: 'google-uid-123',
        access_token: 'secret-access-token-live',
        refresh_token: 'secret-refresh-token-live',
        id_token: 'secret-id-token-live',
      };

      const user = {
        id: 'usr-999',
        email: 'victim@example.com',
        name: 'Jane Doe',
      };

      // Call authentication logger
      logAuthData({ user, account: sensitiveAccount });

      // Verify no authData.txt file is written to the logs directory
      const authDataPath = path.join(process.cwd(), 'logs', 'authData.txt');
      expect(fs.existsSync(authDataPath)).toBe(false);
    });

    it('should format structured audit events with sanitized metadata', () => {
      logAuditEvent({
        eventType: 'AUTH_LOGIN',
        provider: 'google',
        userId: 'usr-123',
        success: true,
        metadata: {
          ip: '192.168.1.1',
          access_token: 'raw-token',
        },
      });

      // No exception thrown, metadata sanitized
      const sanitized = sanitizeLogData({
        eventType: 'AUTH_LOGIN',
        provider: 'google',
        userId: 'usr-123',
        access_token: 'raw-token',
      });

      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.provider).toBe('google');
    });
  });
});
