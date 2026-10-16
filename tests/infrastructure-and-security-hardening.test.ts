import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Infrastructure & Security Hardening (Issues #104, #115, #119)', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('Issue #115: Next.js Security Upgrades & CVE Mitigation', () => {
    it('package.json requires a secure Next.js version (>= 16.4.1) patching GHSA-673q-mjm6-r5xr, CVE-2026-96889, GHSA-p3m5-59mp-jv5r', () => {
      const pkgPath = path.join(rootDir, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const nextVersion = pkg.dependencies?.next || '';

      // Must not be vulnerable 16.2.x or 16.4.0
      expect(nextVersion).not.toBe('^16.2.7');
      expect(nextVersion).not.toBe('16.2.7');
      expect(nextVersion).not.toBe('^16.4.0');
      expect(nextVersion).not.toBe('16.4.0');

      // Must be at least 16.4.1 or higher
      const match = nextVersion.match(/(?:[\^~>=]\s*)?(\d+)\.(\d+)\.(\d+)/);
      expect(match).not.toBeNull();
      if (match) {
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        const patch = parseInt(match[3], 10);

        const isAtLeast16_4_1 =
          major > 16 ||
          (major === 16 && (minor > 4 || (minor === 4 && patch >= 1)));
        expect(isAtLeast16_4_1).toBe(true);
      }
    });
  });

  describe('Issue #104: Docker Compose Network Hardening & Strong Passwords', () => {
    it('docker-compose.yml must not publish database or redis ports to the host', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const composeContent = fs.readFileSync(composePath, 'utf8');

      // db service should not map 5432 to host
      const dbBlockMatch = composeContent.match(/\n  db:\s*[\s\S]*?(?=\r?\n  [a-z0-9_-]+:|$)/i);
      expect(dbBlockMatch).not.toBeNull();
      const dbBlock = dbBlockMatch ? dbBlockMatch[0] : '';

      expect(dbBlock).not.toMatch(/ports:\s*[\r\n]+\s*-\s*["']?\$\{?POSTGRES_PORT.*?:5432/i);
      expect(dbBlock).not.toMatch(/ports:\s*[\r\n]+\s*-\s*["']?5432:5432/i);

      // redis service should not map 6379 to host
      const redisBlockMatch = composeContent.match(/\n  redis:\s*[\s\S]*?(?=\r?\n  [a-z0-9_-]+:|$)/i);
      expect(redisBlockMatch).not.toBeNull();
      const redisBlock = redisBlockMatch ? redisBlockMatch[0] : '';

      expect(redisBlock).not.toMatch(/ports:\s*[\r\n]+\s*-\s*["']?\$\{?REDIS_PORT.*?:6379/i);
      expect(redisBlock).not.toMatch(/ports:\s*[\r\n]+\s*-\s*["']?6379:6379/i);
    });

    it('docker-compose.yml enforces strong passwords via environment for Postgres and Redis', () => {
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const composeContent = fs.readFileSync(composePath, 'utf8');

      // Postgres password must not default to insecure 'postgres'
      expect(composeContent).not.toMatch(/POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD:-postgres\}/);
      // Redis must have password protection configured
      expect(composeContent).toMatch(/REDIS_PASSWORD/);
      expect(composeContent).toMatch(/--requirepass|\$\{REDIS_PASSWORD/);
    });
  });

  describe('Issue #119: Prisma Migration Step in CI and Docker Scripts', () => {
    it('CI workflow includes prisma migrate deploy step', () => {
      const ciPath = path.join(rootDir, '.github', 'workflows', 'ci.yml');
      const ciContent = fs.readFileSync(ciPath, 'utf8');

      expect(ciContent).toMatch(/prisma migrate deploy/i);
    });

    it('Docker scripts/configuration include prisma migrate deploy step', () => {
      const dockerfilePath = path.join(rootDir, 'Dockerfile');
      const composePath = path.join(rootDir, 'docker-compose.yml');
      const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
      const composeContent = fs.readFileSync(composePath, 'utf8');

      const migrationConfiguredInDocker =
        dockerContent.includes('prisma migrate deploy') ||
        composeContent.includes('prisma migrate deploy');

      expect(migrationConfiguredInDocker).toBe(true);
    });
  });
});
