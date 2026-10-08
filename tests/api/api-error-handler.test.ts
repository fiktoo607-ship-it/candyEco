import { describe, it, expect, vi } from 'vitest';
import { formatApiError, handleServerError } from '@/lib/api-error-handler';

describe('API Error Handler (lib/api-error-handler.ts) - Issue #4', () => {
  it('returns generic message in production for 500 status codes without leaking stack or raw error', async () => {
    const rawSensitiveError = new Error('FATAL: password authentication failed for user "postgres"');
    
    const response = formatApiError(
      rawSensitiveError,
      'Une erreur interne est survenue.',
      500,
      'production'
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Une erreur interne est survenue.');
    expect(data.error).not.toContain('postgres');
    expect(data.error).not.toContain('password');
  });

  it('exposes detailed error message in development for 500 status codes', async () => {
    const devError = new Error('Database connection failed at 127.0.0.1:5432');
    
    const response = formatApiError(
      devError,
      'Une erreur interne est survenue.',
      500,
      'development'
    );

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Database connection failed at 127.0.0.1:5432');
  });

  it('handleServerError logs error context and returns sanitized 500 response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('PrismaClientInitializationError: Unable to connect');

    const response = handleServerError(
      error,
      '[Test Endpoint]',
      'Erreur serveur générique',
      'production'
    );

    expect(consoleSpy).toHaveBeenCalledWith('[Test Endpoint]', error);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Erreur serveur générique');
    expect(data.error).not.toContain('Prisma');

    consoleSpy.mockRestore();
  });
});
