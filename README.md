# Délices d’Eva — Artisanal E-Commerce & Store Operations Platform

> **Project Summary:** A modern, high-performance web application built with Next.js 16, React 19, TypeScript, PostgreSQL (Prisma), and Redis Pub/Sub, designed to deliver an intuitive artisanal e-commerce shopping experience for customers and a real-time order fulfillment control center for store owners.

---

## 📌 Project Overview

**Délices d’Eva** is a production-grade web application and Progressive Web App (PWA) tailored for boutique bakeries and artisanal confectioneries. It bridges customer-facing online ordering with comprehensive back-office operations, providing sub-second catalog exploration, verified reviews, flexible delivery options, and live order tracking.

The project is engineered with a strict focus on:
- **User Experience (UX):** Seamless navigation, instant tag-filtered search, mobile-first responsive interfaces, and offline resilience.
- **High Performance:** Proactive infinite prefetching, database-level pagination, scoped raw SQL aggregations, and layout-shift-free interactions.
- **Scalability & Clean Architecture:** Component decomposition, strict separation between presentation and data access layers, and multi-instance Pub/Sub messaging.
- **Operational Reliability:** Transactional race-condition guards, immutable order price/address snapshotting, and strict order status state machines.

---

## ✨ Key Features

### 🛒 Customer Storefront & Catalog
- **Instant Search & Autocomplete Tags:** Mobile-first product search by title paired with an interactive tag autocomplete widget querying a dedicated relational `Tag` model.
- **Infinite Scrolling with Proactive Prefetching:** Powered by TanStack React Query (`useInfiniteQuery`) and custom `IntersectionObserver` thresholds to load products dynamically in batches without pagination lag.
- **Verified Customer Reviews:** Interactive star ratings where rating submissions are strictly gated to customers with confirmed completed orders (`DELIVERED` or `COMPLETED`).
- **Dynamic Homepage Showcase:** Infinite-looping carousels for Hero banners, "New Creations", and "Most Popular" items driven by live database sales metrics.
- **Interactive FAQ Accordion:** Clean, expandable Q&A section configured directly from the admin panel.

### 📦 Checkout & Order Lifecycle
- **Dual Checkout Pathways:** Supports both frictionless guest checkout and authenticated user checkouts.
- **Dynamic Delivery Methods:** Flexible fulfillment selection (Home Delivery, Boutique Pickup, Office Drop-off) with active pricing calculation.
- **Visual Order Tracker:** Live tracking page (`/orders/[id]`) with a 4-step progress timeline (`PENDING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`), human-readable reference IDs (`ORD-YYYYMMDD-XXX`), and customer self-cancellation for pending orders.
- **Immutable Historical Snapshots:** Unit prices and delivery addresses are snapshotted on the order item level at checkout, ensuring catalog price updates never alter past receipts.

### 🛡️ Administrative Command Center & CRM
- **Live Order Management & Bulk Actions:** Instant status transitions, advanced filtering, and A6 thermal receipt printing (`window.print`) with zero-margin print layouts.
- **Customer Loyalty CRM & Trust Scores:** Automatic client categorization into tiers (**VIP**, **Fidèle**, **Vérifié**, **Non vérifié**) calculated dynamically from cumulative completed order spending (£1 = 1 point).
- **Global Store Availability Switch:** Instant kill-switch allowing operators to toggle store status to Closed/Holiday, automatically rendering storefront banners and blocking checkout mutations.
- **Content Management System (CMS):** Full dashboard management for carousel slides, about stories, delivery methods, and FAQs with Cloudinary asset synchronization.

### 🔔 Real-Time Event Pipeline
- **Distributed Redis Pub/Sub & SSE:** Server-Sent Events stream with 15-second heartbeat intervals and Redis Pub/Sub messaging across multi-instance deployments (with automatic fallback to Node.js `EventEmitter` for local development).
- **Tab Presence Deduplication:** Ephemeral Redis presence registry tracking whether an admin has the dashboard actively focused, preventing duplicate desktop alerts and chime sounds.
- **Tab Visibility Audio Alerts:** Web Audio API chimes and desktop notifications when incoming orders arrive while operators work in background browser tabs.

### 📱 PWA & Offline Resilience
- **Progressive Web App (PWA):** Standalone install banner, dynamic manifest route, and custom Service Worker caching strategy (`cache-first` for static assets, `network-first` with `/offline` fallback).
- **DOM Mutation Protection:** Built-in monkeypatch for third-party browser translation engines (e.g., Google Chrome Translate) to prevent unmount runtime errors (`NotFoundError`).
- **Scrollbar Layout Shift Prevention:** Body scroll-locking helper that calculates exact scrollbar widths and tracks re-entrant modal counters.

---

## 🖼️ Project Screenshots

### 🛒 Customer Storefront Experience

| 🏠 Homepage & Hero Carousel | 🥐 Artisanal Catalog & Tag Filters |
| :---: | :---: |
| ![Homepage Showcase](screens/Screenshot_10-6-2026_1751_localhost.jpeg) | ![Artisanal Catalog](screens/Screenshot_10-6-2026_17515_localhost.jpeg) |
| *Dynamic Hero banner carousel, "Créations Vedettes", and brand story showcase.* | *Category filters (Gâteaux, Aliments Traditionnels), live pricing & infinite product grid.* |

| 🛍️ Shopping Cart & Delivery Checkout |
| :---: |
| ![Cart and Checkout](screens/Screenshot_10-6-2026_17540_localhost.jpeg) |
| *Real-time cart quantity controls, live order calculation & delivery contact form.* |

---

### 🛡️ Administrative Command Center & CMS

| 📦 Product Management & Inventory Table | ⚙️ Dynamic CMS & Store Configuration |
| :---: | :---: |
| ![Product Management Dashboard](screens/Screenshot_10-6-2026_1761_localhost.jpeg) | ![CMS Configuration Panel](screens/Screenshot_10-6-2026_17613_localhost.jpeg) |
| *Product catalog management with thumbnail preview, categories, stock availability toggles, and instant edit/delete modals.* | *Live back-office CMS for homepage carousel selection, brand storytelling narratives, and social contact details.* |

---

## 🏗️ Project Structure

```text
candy_client/
├── app/                              # Next.js App Router (Pages & Endpoints)
│   ├── (storefront)/                 # Public customer-facing routes
│   │   ├── home/                     # Dynamic homepage (Hero, New, Popular, FAQs)
│   │   ├── our-product/              # Catalog with infinite scroll & tag filters
│   │   ├── cart/                     # Cart drawer & multi-step checkout form
│   │   ├── orders/[id]/              # Customer order status timeline & cancellation
│   │   └── about/, contact/          # Brand story, opening hours & contact details
│   ├── (auth)/                       # Authentication views
│   │   ├── login/, register/         # OAuth & Credentials authentication forms
│   │   └── verify-email/             # Email verification token handler
│   ├── dashboard/                    # Role-protected admin command center
│   ├── api/                          # REST & Server-Sent Events API routes
│   │   ├── auth/                     # NextAuth configuration & token verification
│   │   ├── orders/                   # Order placement, status transitions, aggregations
│   │   ├── products/                 # Product CRUD, tag relations, review ratings
│   │   ├── notifications/            # SSE stream, Redis Pub/Sub, tab presence
│   │   ├── delivery-methods/         # Shipping methods CRUD & active pricing
│   │   ├── carousel-slides/          # Hero banner CMS endpoints
│   │   └── config/                   # Store open/closed toggle & CMS dictionary
│   ├── manifest.ts                   # Dynamic PWA web app manifest
│   └── layout.tsx                    # Root layout with providers & audio notifiers
├── components/                       # Modular UI components
│   ├── dashbord/                     # Admin control panel components
│   │   ├── cms/                      # CMS modules (Carousels, Store Status, FAQs)
│   │   ├── orders/                   # Orders filter bar, table, modal, A6 receipt
│   │   ├── products/                 # Product modal, tag editor, image uploader
│   │   ├── users/                    # Customer CRM table & loyalty tier badges
│   │   └── hooks/                    # Admin-specific hooks (pagination, modal state)
│   ├── home/                         # Storefront hero carousels & accordion FAQs
│   ├── our-product/                  # Infinite product grid & autocomplete tag filter
│   ├── cart/                         # Checkout forms & delivery option selectors
│   ├── PwaRegister.tsx               # Service Worker registration & update toasts
│   ├── TabVisibilityNotifier.tsx     # Background tab focus audio & desktop alert engine
│   └── site-header.tsx               # Responsive header, cart drawer, and PWA installer
├── lib/                              # Core business logic, utilities, and singletons
│   ├── auth.ts                       # NextAuth options & role-based route protection
│   ├── prisma.ts                     # Prisma ORM singleton instance
│   ├── redis.ts                      # Redis connection pool for Pub/Sub & presence
│   ├── notification-emitter.ts       # Unified Redis Pub/Sub / EventEmitter dispatcher
│   ├── presence.ts                   # Redis/memory active admin tab presence tracker
│   ├── theme.ts                      # Design system tokens & 60-30-10 color hierarchy
│   ├── price.ts                      # Centralized currency formatting (€)
│   └── hooks/                        # Shared custom hooks (scroll lock, products, orders)
├── prisma/                           # Database schema & migrations
│   ├── schema.prisma                 # Relational schema, compound indexes & enums
│   └── seed.ts                       # Initial database seeding script
├── public/                           # Static assets & Service Worker
│   ├── sw.js                         # Custom Service Worker (cache-first + offline page)
│   ├── notification.mp3              # Web Audio chime for incoming order notifications
│   └── logo.jpeg                     # High-resolution brand & PWA application icon
├── screens/                          # Application UI screenshots for documentation
├── scripts/                          # Maintenance & operational scripts
│   └── ensure-tags.ts                # Automatic product keyword tag classification
├── tests/                            # Automated test suite (185 tests across 26 files)
│   ├── api/                          # Backend API endpoint tests with Prisma mocks
│   ├── orders-sync.test.tsx          # React Query state synchronization tests
│   ├── scroll-lock.test.tsx          # Scrollbar layout shift compensation tests
│   └── tab-visibility.test.tsx       # Tab visibility and audio chime tests
├── middleware.ts                     # Edge-level route protection for /dashboard
└── vitest.config.ts                  # Vitest runner configuration with JSDOM
```

---

## 🔄 Architecture

The platform is architected around a **Modular, Layered Clean Architecture** that cleanly isolates presentation components, business domain logic, and data access layers:

```text
User / Customer Browser                   Administrator Dashboard
         │                                          │
         ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND APPLICATION LAYER                   │
│   - React 19 Client Components (App Router)                     │
│   - TanStack React Query (Server State Cache & Invalidation)   │
│   - Zustand (Global UI Modals Shell State)                      │
│   - Local React Hooks (Fast Keystroke Form Inputs)              │
│   - PWA Service Worker (Cache-First Assets, Offline Fallback)   │
└────────────────┬────────────────────────────────┬───────────────┘
                 │ Fetch / REST                   │ Server-Sent Events (SSE)
                 ▼                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION LAYER                    │
│   - Edge Middleware (Role-Based Access Control)                 │
│   - REST API Route Handlers (/app/api/*)                        │
│   - Zod Validation & Domain State Machine Verification          │
│   - Notification Dispatcher (Redis Pub/Sub / Local Emitter)     │
└────────────────┬───────────────────┬────────────┬───────────────┘
                 │                   │            │
                 ▼                   ▼            ▼
┌─────────────────────────┐ ┌───────────────┐ ┌───────────────────┐
│       POSTGRESQL        │ │     REDIS     │ │ EXTERNAL SERVICES │
│ - Relational Data Model │ │ - Pub/Sub     │ │ - Cloudinary CDN  │
│ - Raw SQL Aggregations  │ │ - Admin Tab   │ │ - Nodemailer SMTP │
│ - ACID Transactions     │ │   Presence    │ │ - Google OAuth    │
└─────────────────────────┘ └───────────────┘ └───────────────────┘
```

### Architectural Advantages:
- **Independent Evolution:** The storefront UI, admin control center, and backend API routes can be scaled or updated without risking regressions in unrelated modules.
- **Resilient Fallbacks:** Real-time events operate on a hybrid architecture that runs over Redis Pub/Sub in production clusters, but seamlessly falls back to a Node.js `EventEmitter` for local single-developer workflows.
- **Predictable State Synchronization:** Strict invalidation of TanStack React Query keys ensures that order status updates made in modals reflect instantly across tables and counters without manual DOM hacking.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js:** `v20.x` or higher
- **npm:** `v10.x` or higher
- **PostgreSQL:** `v15+` (Local instance or hosted on Supabase / Neon)
- **Redis:** *(Optional)* Required for multi-instance distributed notifications (falls back to in-memory locally)

### 1. Clone the Repository
```bash
git clone https://github.com/charif1206/candy_eco.git
```

### 2. Navigate to the Project Directory
```bash
cd candy_eco/candy_client
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create your local environment file:
```bash
cp .env.example .env
```

### 5. Setup Database & Prisma
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Generate Prisma Client types
npx prisma generate

# Run automatic tag verification and keyword linking
npm run db:ensure-tags
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the root of `candy_client/` and supply the required keys:

```env
# Database connection string (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/candy_client?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_32_character_secret_key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Admin Configuration (Comma-separated admin email addresses)
ADMIN_EMAILS="admin@example.com"

# Cloudinary Credentials (For image storage & optimization)
CLOUDINARY_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# SMTP Configuration (Nodemailer email verification)
SMTP_HOST="smtp.example.com"
SMTP_PORT=465
SMTP_USER="verification@example.com"
SMTP_PASSWORD="your_smtp_password"
EMAIL_FROM='"Délices d'\''Eva" <verification@example.com>'

# Optional: Distributed Redis Pub/Sub & Presence
REDIS_URL="redis://localhost:6379"
```

---

## 🔌 API Documentation

### 1. Products API

#### `GET /api/products`
Retrieves a paginated list of catalog products with optional category, search, and multi-tag filtering.

**Query Parameters:**
- `page`: Page number (default: `1`)
- `limit`: Items per page (default: `6`)
- `category`: Filter by category (e.g. `pastry`, `chocolates`)
- `search`: Case-insensitive title keyword search
- `tags`: Comma-separated list of tag names

**Sample Response:**
```json
{
  "products": [
    {
      "id": "c3d94178-5e8b-4a41-86bf-39cfae50d87a",
      "title": "Croissant Artisanal au Beurre",
      "slug": "croissant-artisanal-au-beurre",
      "price": "2.50 €",
      "category": "viennoiserie",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
      "description": "Feuilletage pur beurre AOP doré au four traditionnel.",
      "story": "Notre recette historique transmise depuis 3 générations.",
      "state": "exist",
      "tags": ["Beurre", "Tradition", "Bio"]
    }
  ],
  "total": 24,
  "page": 1,
  "totalPages": 4
}
```

---

### 2. Orders API

#### `POST /api/orders`
Creates a new customer order, validates store availability, creates snapshot records, and generates a unique human-readable reference.

**Request Payload:**
```json
{
  "customerName": "Alice Martin",
  "customerPhone": "+33612345678",
  "customerEmail": "alice@example.com",
  "shippingAddress": "14 Avenue des Champs-Élysées, 75008 Paris",
  "deliveryMethod": "Livraison à domicile",
  "items": [
    {
      "productId": "c3d94178-5e8b-4a41-86bf-39cfae50d87a",
      "quantity": 2
    }
  ]
}
```

**Sample Response:**
```json
{
  "success": true,
  "order": {
    "id": "e9b2518e-49b8-4d32-bb9a-4c2847a9d20c",
    "reference": "ORD-20260906-003",
    "status": "pending",
    "totalPrice": "5.00 €",
    "totalAmount": 5.0,
    "customerName": "Alice Martin",
    "customerPhone": "+33612345678",
    "shippingAddress": "14 Avenue des Champs-Élysées, 75008 Paris",
    "createdAt": "2026-09-06T20:10:00.000Z"
  }
}
```

#### `GET /api/orders/[id]`
Returns the tracking information and timeline for a customer order.

**Sample Response:**
```json
{
  "order": {
    "reference": "ORD-20260906-003",
    "status": "pending",
    "customerName": "Alice Martin",
    "deliveryMethod": "Livraison à domicile",
    "totalPrice": "5.00 €",
    "items": [
      {
        "title": "Croissant Artisanal au Beurre",
        "quantity": 2,
        "price": "2.50 €"
      }
    ],
    "canCancel": true
  }
}
```

---

### 3. Real-Time Notifications API

#### `GET /api/notifications/sse`
Subscribes the administrative client to a Server-Sent Events stream for live order broadcasts.
- Includes a 15-second heartbeat (`: ping\n\n`) to prevent proxy dropouts.
- Emits formatted JSON payloads on new orders.

#### `POST /api/notifications/presence`
Registers active tab visibility (`visible` / `hidden`) with an ephemeral 30s TTL to prevent duplicate audio chime notifications when the dashboard is already open.

---

## 📖 Usage Examples

### 1. Customer Shopping Flow
```text
1. Open the storefront homepage at /home.
2. Search for items via the top search bar or select tags (e.g. #Chocolat, #Bio).
3. Open product details, inspect ingredients and verified star ratings.
4. Add items to the cart and proceed to checkout (/cart).
5. Select fulfillment method (Home Delivery / Pickup), provide phone number and delivery address.
6. Submit order and copy the tracking reference (e.g. ORD-20260906-001).
7. Track live fulfillment progress in real-time on /orders/[id].
```

### 2. Store Manager / Admin Flow
```text
1. Sign in at /login with an authorized administrator account.
2. Access the /dashboard command center.
3. Receive real-time audio and visual toast notifications as orders are placed.
4. Filter orders by status (Pending, Accepted, Delivered) or customer trust score.
5. Accept pending orders and click "Imprimer" to generate an A6 thermal kitchen receipt.
6. Configure store open/closed availability switch or edit homepage carousel banners in the CMS tab.
```

### 3. Programmatic API Request Example
```javascript
// Fetch products with tag filter and search query
async function searchBakeryCatalog() {
  const queryParams = new URLSearchParams({
    page: "1",
    limit: "6",
    search: "Croissant",
    category: "viennoiserie"
  });

  const response = await fetch(`/api/products?${queryParams.toString()}`);
  const data = await response.json();
  console.log("Found products:", data.products);
}

searchBakeryCatalog();
```

---

## 🛠️ Technologies Used

- **Frontend & Fullstack Framework:** Next.js 16 (App Router), React 19, TypeScript
- **State Management & Caching:** TanStack React Query v5, Zustand v5
- **Styling & UI Architecture:** Tailwind CSS 3.4 (60-30-10 color hierarchy)
- **Database & Persistence:** PostgreSQL 15+, Prisma ORM 7.8
- **Distributed Messaging & Real-time:** Redis (`ioredis`), Server-Sent Events (SSE), Node.js `EventEmitter`
- **Authentication & Security:** NextAuth.js (Google OAuth & Credentials with `bcryptjs`)
- **Email & Communications:** Nodemailer (SMTP verification)
- **Asset Storage & CDN:** Cloudinary REST API
- **Testing & Quality Assurance:** Vitest 4, JSDOM, TypeScript strict typechecking

---

## 📍 Project Status

✅ **Production Ready & Actively Maintained**
- **Test Suite:** 185 unit and integration tests passing across 26 test suites (`npx vitest run`).
- **Type Safety:** 100% strict TypeScript compilation with zero errors (`npx tsc --noEmit`).
- **Production Build:** Successfully compiling with static and dynamic Next.js App Router optimizations.

---

## 📞 Contact & Support

For business inquiries, customized deployments, or operational questions:
- **Brand:** Délices d’Eva
- **Phone:** `+33 6 95 04 98 33`
- **Email:** `contact@boulangerie-artisanale.fr`
- **Opening Hours:** Lundi - Samedi : 7h00 - 18h00 | Dimanche : Fermé
- **Social Media:**
  - Instagram: [@lesdelices.d.eva](https://www.instagram.com/lesdelices.d.eva)
  - TikTok: [@les.delices.d.eva](https://www.tiktok.com/@les.delices.d.eva)

---

## 📄 License

This project is proprietary software. All rights of reproduction, adaptation, and modification are reserved by **Délices d’Eva**.
