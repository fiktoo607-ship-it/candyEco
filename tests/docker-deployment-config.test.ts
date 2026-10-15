import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Docker & Deployment Configuration (Issue #13)', () => {
  const rootDir = path.resolve(__dirname, '..');

  it('Dockerfile exists and contains multi-stage build instructions', () => {
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);

    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');

    // Stage checks
    expect(dockerfileContent).toMatch(/AS deps/i);
    expect(dockerfileContent).toMatch(/AS builder/i);
    expect(dockerfileContent).toMatch(/AS runner/i);

    // Node 20 alpine check
    expect(dockerfileContent).toMatch(/node:20-alpine/i);

    // Non-root user check
    expect(dockerfileContent).toMatch(/addgroup .* nodejs/i);
    expect(dockerfileContent).toMatch(/adduser .* nextjs/i);
    expect(dockerfileContent).toMatch(/USER nextjs/i);

    // Standalone & Prisma commands
    expect(dockerfileContent).toMatch(/prisma generate/i);
    expect(dockerfileContent).toMatch(/standalone/i);
    expect(dockerfileContent).toMatch(/node.*server\.js/i);
  });

  it('docker-compose.yml exists and defines web, db, and redis services', () => {
    const composePath = path.join(rootDir, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);

    const composeContent = fs.readFileSync(composePath, 'utf8');

    // Services
    expect(composeContent).toContain('web:');
    expect(composeContent).toContain('db:');
    expect(composeContent).toContain('redis:');

    // Database & Redis images/config
    expect(composeContent).toMatch(/postgres:/i);
    expect(composeContent).toMatch(/redis:/i);

    // Env wiring
    expect(composeContent).toContain('DATABASE_URL');
    expect(composeContent).toContain('REDIS_URL');
    expect(composeContent).toContain('NEXTAUTH_SECRET');
  });

  it('.dockerignore exists and excludes node_modules, .next, and sensitive files', () => {
    const dockerignorePath = path.join(rootDir, '.dockerignore');
    expect(fs.existsSync(dockerignorePath)).toBe(true);

    const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');

    expect(dockerignoreContent).toContain('node_modules');
    expect(dockerignoreContent).toContain('.next');
    expect(dockerignoreContent).toContain('.git');
    expect(dockerignoreContent).toContain('.env');
  });

  it('next.config.mjs specifies output: standalone', () => {
    const configPath = path.join(rootDir, 'next.config.mjs');
    const configContent = fs.readFileSync(configPath, 'utf8');

    expect(configContent).toMatch(/output:\s*['"]standalone['"]/);
  });
});
