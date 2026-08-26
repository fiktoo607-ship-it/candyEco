# Security Policy & Implementation

## Overview

Security in CandyEco (`candy_client`) is implemented through multiple defense layers across authentication, access control, database operations, input validation, and media asset management.

---

## Authentication & Session Management

- **Framework**: Powered by `NextAuth.js` (`v4.24.14`).
- **Session Strategy**: JSON Web Tokens (JWT) encrypted server-side using `NEXTAUTH_SECRET`.
- **Supported Authentication Providers**:
  1. **Google OAuth 2.0**: Fetches profile credentials alongside phone and address permissions via Google People API.
  2. **Credentials Provider**: Phone number and password authentication.
- **Password Security**: Passwords are hashed using `bcryptjs` with 12 salt rounds before storage in the database. Raw passwords are never stored or logged.
- **Account Verification**: Credentials logins require `emailVerified` verification status.

---

## Role-Based Access Control (RBAC)

User privileges are categorized into two primary roles:
1. `user`: Standard customer access (browsing, shopping cart, placing orders, leaving ratings).
2. `admin`: Administrative access (managing products, CMS carousel slides, viewing all orders, modifying delivery methods, site configuration).

### Middleware Enforcement (`middleware.ts`)

```typescript
// Route protection for all /dashboard/* endpoints
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAdmin = token?.role === "admin";

    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      if (!isAuth) return NextResponse.redirect(new URL("/login", req.url));
      if (!isAdmin) return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);
```

### Server API Enforcement

API routes handling administrative functions (e.g., POST/PUT/DELETE on `/api/products`, `/api/carousel-slides`, `/api/delivery-methods`) explicitly check the session token role:

```typescript
const session = await getServerSession(authOptions);
if (!session || session.user.role !== "admin") {
  return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
}
```

---

## Data Input Protection & Sanitization

- **SQL Injection Prevention**: Prisma ORM uses parameterized queries for all database operations, eliminating raw SQL injection vectors.
- **Cross-Site Scripting (XSS)**: React 19 automatically escapes dynamic strings before rendering them to the DOM.
- **Data Stripping for Public APIs**: Customer-facing endpoints explicitly strip sensitive or admin-only fields. For example, `rating` and `ratingCount` fields are omitted from public GET `/api/products` requests unless `dashboard=true` is requested by an authenticated admin.

---

## Asset & Upload Security (`/api/upload`)

- **Service**: Cloudinary media storage.
- **Validation**: Upload API verifies file extensions, MIME types, and file size boundaries.
- **Access Control**: Upload endpoints enforce admin authentication to prevent arbitrary storage consumption by unauthenticated entities.

---

## Web Push & Secret Management

- **VAPID Keys**: Web-Push subscriptions rely on VAPID keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`). Private keys are isolated in environment variables.
- **Environment Isolation**: Production deployments require secret configuration via environment variables (`.env`). Secrets such as `DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, and `CLOUDINARY_API_SECRET` must never be checked into version control.

---

## Common Threat Safeguards Matrix

| Threat | Safeguard Implemented |
|---|---|
| **Brute Force Attacks** | Hashing with `bcryptjs`, environment rate-limiting via Redis |
| **CSRF** | SameSite cookie attributes & NextAuth CSRF token validation |
| **Unauthorized Admin Elevation** | Environment whitelist (`ADMIN_EMAILS`) and initial database setup check only |
| **Data Leakage** | Selective JSON field projection in API responses |
| **Broken Object Level Auth (BOLA)** | User ID validation on order queries and review eligibility checks (`can-rate`) |
