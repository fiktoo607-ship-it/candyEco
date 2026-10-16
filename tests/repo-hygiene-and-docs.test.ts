import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Repo Hygiene, Environment Variables & Documentation (Issues #105, #107, #109)", () => {
  const rootDir = path.resolve(__dirname, "..");

  describe("Issue #105: Untrack debug, scratch, Firebase, and obsolete artifacts", () => {
    it("obsolete debug and placeholder files must not exist in the repository", () => {
      const forbiddenFiles = [
        ".firebaserc",
        "test-api.ts",
        "rollback.sql",
        "candy_html/about.html",
        "candy_html/contact.html",
        "candy_html/dashbord.html",
        "candy_html/home.html",
        "candy_html/our_product.html",
        "logs/featurs/index.ts",
        "scratch/debug-products.ts",
        "scratch/load-env.ts",
        "scratch/test-orders-push.ts",
        "scratch/test-push-loop.ts",
        "scratch/test-push.ts",
      ];

      const existingFiles = forbiddenFiles.filter((relPath) =>
        fs.existsSync(path.join(rootDir, relPath))
      );
      expect(existingFiles).toEqual([]);
    });

    it(".gitignore should exclude scratch, logs, test-api, rollback.sql and drop !/logs/featurs/ exception", () => {
      const gitignoreContent = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf8");

      expect(gitignoreContent).not.toContain("!/logs/featurs/");
      expect(gitignoreContent).toContain(".firebaserc");
      expect(gitignoreContent).toContain("rollback.sql");
      expect(gitignoreContent).toContain("test-api.ts");
      expect(gitignoreContent).toContain("scratch/");
      expect(gitignoreContent).toContain("/logs/");
    });

    it("lib/auth.ts should import audit logging from @/lib/audit-logger instead of legacy logs/featurs", () => {
      const authContent = fs.readFileSync(path.join(rootDir, "lib", "auth.ts"), "utf8");
      expect(authContent).not.toContain("@/logs/featurs");
      expect(authContent).toContain("@/lib/audit-logger");
    });
  });

  describe("Issue #107: Wire NEXT_PUBLIC_SITE_URL, VAPID documentation, and remove stale Railway fallback", () => {
    it(".env.example must document NEXT_PUBLIC_SITE_URL and VAPID variables", () => {
      const envExampleContent = fs.readFileSync(path.join(rootDir, ".env.example"), "utf8");

      expect(envExampleContent).toContain("NEXT_PUBLIC_SITE_URL");
      expect(envExampleContent).toContain("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      expect(envExampleContent).toContain("VAPID_PRIVATE_KEY");
      expect(envExampleContent).toContain("VAPID_SUBJECT");
    });

    it("docker-compose.yml must configure NEXT_PUBLIC_SITE_URL for the web service", () => {
      const dockerComposeContent = fs.readFileSync(path.join(rootDir, "docker-compose.yml"), "utf8");
      expect(dockerComposeContent).toContain("NEXT_PUBLIC_SITE_URL");
    });

    it("app/sitemap.ts and app/robots.ts must NOT use the stale Railway domain fallback", () => {
      const sitemapContent = fs.readFileSync(path.join(rootDir, "app", "sitemap.ts"), "utf8");
      const robotsContent = fs.readFileSync(path.join(rootDir, "app", "robots.ts"), "utf8");

      expect(sitemapContent).not.toContain("candyeco-production.up.railway.app");
      expect(robotsContent).not.toContain("candyeco-production.up.railway.app");
    });
  });

  describe("Issue #109: README setup instructions and accurate toolchain versions", () => {
    it("README.md setup steps should not reference nonexistent candy_client subdirectory", () => {
      const readmeContent = fs.readFileSync(path.join(rootDir, "README.md"), "utf8");

      expect(readmeContent).not.toContain("cd candy_eco/candy_client");
      expect(readmeContent).not.toContain("root of `candy_client/`");
    });

    it("README.md environment section must document NEXT_PUBLIC_SITE_URL and VAPID keys", () => {
      const readmeContent = fs.readFileSync(path.join(rootDir, "README.md"), "utf8");

      expect(readmeContent).toContain("NEXT_PUBLIC_SITE_URL");
      expect(readmeContent).toContain("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
      expect(readmeContent).toContain("VAPID_PRIVATE_KEY");
      expect(readmeContent).toContain("VAPID_SUBJECT");
      expect(readmeContent).toContain("npx web-push generate-vapid-keys");
    });

    it("README.md should list accurate versions (Prisma 7.10, Vitest 5) and consistent database name", () => {
      const readmeContent = fs.readFileSync(path.join(rootDir, "README.md"), "utf8");

      expect(readmeContent).toContain("Prisma ORM 7.10");
      expect(readmeContent).toContain("Vitest 5");
      expect(readmeContent).toContain("localhost:5432/candy_eco");
      expect(readmeContent).not.toContain("localhost:5432/candy_client");
    });
  });
});
