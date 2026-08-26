# Performance Optimization Strategy

## Overview

CandyEco is engineered to provide fast response times, smooth dynamic filtering, lazy loading, and minimal bundle sizes. This document details frontend dynamic loading strategies, caching layers, database index tuning, and backend optimizations.

---

## Frontend Optimization

### 1. Lazy Loading & Infinite Scrolling
- **Implementation**: `components/our-product/ProductBrowser.tsx` uses `useInfiniteQuery` from TanStack React Query along with the `IntersectionObserver` API.
- **Batching**: Products are fetched in dynamic page batches (default limit = 6), reducing initial payload size and rendering times on mobile devices.
- **Skeletons**: Visual loading skeletons prevent layout shifts (CLS optimization).

### 2. Image Asset Optimization
- **Cloudinary Integration**: Images uploaded to Cloudinary are fetched with automatic webp/avif format selection, quality compression (`q_auto`), and responsive width parameters (`f_auto,q_auto`).
- **Next.js Image Component**: Used for responsive sizing, lazy loading images off-screen, and preventing Content Layout Shifts (CLS).

### 3. State & Render Management
- **Zustand**: Selected state hooks prevent unnecessary component re-renders. Cart state updates do not trigger header layout recalculations outside specific cart badges.
- **Search Debouncing**: Tag and product title search inputs utilize client-side debouncing to reduce redundant backend API queries.

---

## Backend & API Performance

### 1. Read-Only Catalog Operations
- Product search and catalog list endpoints (`GET /api/products`) are strictly read-only.
- Automatic tag syncing routines (`ensureProductTags`) are offloaded to standalone CLI tools (`npm run db:ensure-tags`) or specific tag mutations (`/api/tags`), preventing DB write locks during GET request processing.

### 2. In-Memory Redis Caching (`lib/redis.ts`)
- **Presence & Session State**: Transient operations, user presence counters, and temporary session keys are maintained in Redis rather than hitting the primary PostgreSQL database.
- **Connection Reuse**: Connection pools with automatic retry strategies ensure sub-millisecond cache latency.

### 3. SWC Lockfile Shim Build Acceleration
- Custom execution scripts (`scripts/next-with-swc-lockfile-shim.cjs`) resolve native SWC binary locks on Windows/Linux build environments, ensuring fast incremental builds and hot module reloading.

---

## Database Performance & Indexing

### Database Schema Indexing Strategy

Prisma schema defines explicit indexes on high-cardinality foreign keys and search target fields:

```prisma
model Product {
  id        String   @id @default(uuid())
  slug      String   @unique
  category  String
  // Indexed relation implicitly via Prisma join tables
}

model User {
  id        String   @id @default(uuid())
  email     String?  @unique
  phone     String?  @unique
}

model PushSubscription {
  // Explicit indexing for fast subscription lookups
  @@index([userId])
  @@index([deviceToken])
}
```

---

## Targeted Performance Benchmarks

| Metric | Target Goal | Strategy |
|---|---|---|
| **Largest Contentful Paint (LCP)** | `< 2.0s` | RSC pre-rendering, Next/Image priority on Hero carousel |
| **First Input Delay / INP** | `< 100ms` | React 19 concurrent features & Zustand state isolation |
| **Cumulative Layout Shift (CLS)** | `< 0.05` | Aspect ratio wrappers & skeleton loader placeholders |
| **Product API Latency (GET)** | `< 80ms` | Parameterized Prisma queries with indexed pagination |
| **Tag Autocomplete Response** | `< 50ms` | Redis query caching & filtered database joins |
