# Project State

## Implemented Features

### 1. Mobile Search Bar
- **Description**: Instant, mobile-first product search by title on the Home page and Product listing page.
- **Components**:
  - `components/SearchBar.tsx`: Reusable, touch-friendly input component with search and reset icons.
  - `components/home/HomeProductSection.tsx`: Client-side wrapper for the Home page that handles search state, triggers API fetching on search, and manages loading/empty states.
- **Integrations**:
  - `app/home/page.tsx`: Embedded `HomeProductSection` instead of rendering featured products/story sections directly.
  - `components/our-product/ProductBrowser.tsx`: Integrated the search bar at the top, filtering the product grid instantly.

### 2. Product Lazy Loading
- **Description**: Progressive loading / infinite scrolling on the product listing page.
- **Components**:
  - `components/our-product/ProductBrowser.tsx`: Integrated `useInfiniteQuery` from React Query, loading skeletons, and Intersection Observer to load products in batches of 6.
- **APIs**:
  - `app/api/products/route.ts`: Updated the GET route to support pagination parameters (`page`, `limit`) and filters (`category`, `search`), maintaining full backward compatibility.

### 3. Carousel Optimization & Management
- **Description**: Re-engineered the homepage carousel and admin dashboard to merge product selection checklist items and custom uploaded database slides, up to a user-defined max slides limit. Repositioned and redesigned the Next/Prev navigation buttons.
- **Components**:
  - `components/dashbord/CmsSection.tsx`: Configures slide limit (`carousel_max_slides`), product selection checklist, and custom image uploads, dynamically enforcing the limit constraints.
  - `components/home/HeroCarousel.tsx`: Made `order` type field optional. Moved the Prev/Next navigation buttons from the bottom indicators bar to the left and right edges of the slide, styled with a premium glassmorphic circle design. Keep dots/pills indicators centered at the bottom.
  - `app/home/page.tsx`: Merges checklist products (first) and custom uploaded slides (second) from database, capped by `carousel_max_slides`.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `CarouselSlide` model.
  - `app/api/carousel-slides/route.ts` & `app/api/carousel-slides/[id]/route.ts`: Built GET, POST, PUT, DELETE endpoints for slides management.
  - `app/api/config/route.ts`: Validates dynamic max slides limits.

### 4. Product Tags & Filtering (Dedicated Tag Model)
- **Description**: Migrated product tags to a dedicated database `Tag` model with a many-to-many relationship to `Product`. Seeding has been applied to assign 2 to 6 random tags for every existing product in the database. Built an autocomplete tag search widget at the top of the product browser to allow filtering products by multiple tags dynamically.
- **Components**:
  - `components/our-product/ProductBrowser.tsx`: Repositioned the main search bar to the top. Added a search input for tags next to it, complete with a dropdown displaying matching suggestions matching the user's typing (fetched from `/api/tags?q=...`). Supports multi-select, displaying selected tags as premium, deletable pills.
  - `components/dashbord/ProductModal.tsx`: Maintained compatibility with a chip-based tags editor, mapping `tags: string[]` in POST/PUT API request/response payloads to/from the database relation.
  - `components/product-details/ProductDetails.tsx`: Displays tags prefixed with `#` next to the product category.
  - `components/ProductCard.tsx`: Displays up to 3 tags as styled badges below the product title.
- **APIs & Database**:
  - `prisma/schema.prisma`: Replaced the string array with a many-to-many relationship using a dedicated `Tag` model (`tags Tag[]` on Product, `products Product[]` on Tag).
  - `scripts/migrate-tags.ts`: A one-off script that populated `Tag` tables and associated 2 to 6 random tags with all products.
  - `app/api/tags/route.ts`: Rewritten to query the `Tag` table and support case-insensitive prefix search (`?q=ل` returns matching tags like `لوز`, `حليب`, `لحم`).
  - `app/api/products/route.ts` & `app/api/products/[id]/route.ts`: Updated GET, POST, and PUT handlers to link tags relation and map returned tags to `string[]` for frontend compatibility. GET queries support intersection filter via multiple nested `AND` conditions.

### 5. Product Rating System
- **Description**: Storing, editing and sorting products by ratings inside the admin dashboard while hiding ratings from customer views, plus allowing customers to rate products from the details page.
- **Components**:
  - `components/dashbord/ProductsSection.tsx`: Enabled dashboard-specific query parameter and added Note column with rating sort select dropdown.
  - `components/dashbord/ProductModal.tsx`: Added note rating input field for creating and editing products.
  - `components/dashbord/CmsSection.tsx`: Enabled dashboard-specific query parameter.
  - `components/product-details/ProductDetails.tsx`: Embedded interactive star rating selection widget allowing customers to submit a rating.
  - `app/our-product/[slug]/page.tsx`: Explicitly stripped rating and ratingCount before rendering product details for customers.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `rating Float @default(0.0)` and `ratingCount Int @default(0)` fields to `Product`.
  - `app/api/products/route.ts` & `app/api/products/[id]/route.ts`: Added conditional rating and ratingCount omission unless `dashboard=true` query parameter is set.
  - `app/api/products/[id]/route.ts`: Implemented `POST` handler for user rating submissions, calculating running average.

### 6. Homepage New Products Section
- **Description**: Displays the newest products on the homepage directly below the Hero Carousel, using a responsive slider/grid layout and a configurable limit from the admin dashboard.
- **Components**:
  - `components/home/NewProductsSection.tsx`: Renders the products using a responsive grid layout on desktop, transitioning to a touch-swipeable horizontal scroll container on mobile and tablet.
  - `components/home/HomeProductSection.tsx`: Configured to receive the list of new products and render the new section directly below `HeroCarousel`.
  - `components/dashbord/CmsSection.tsx`: Form interface updated to allow configuring `new_products_limit` with standard validation.
- **APIs & Database**:
  - `lib/config.ts` & `lib/hooks/use-config.ts` & `lib/copy-dictionary.json`: Added `new_products_limit` to defaults and CMS maps.
  - `app/api/config/route.ts`: Configured POST handler to validate that the new products limit is a positive integer >= 1.
  - `app/home/page.tsx`: Queries the database for products ordered by `createdAt` desc, filtering for active products (`state: 'exist'`), using the configured limit.

### 7. Homepage Popular Products Section
- **Description**: Displays the most ordered products on the homepage directly below the New Products section, automatically updating based on orders count.
- **Components**:
  - `components/home/PopularProductsSection.tsx`: Renders the products using a responsive grid layout on desktop, transitioning to a touch-swipeable horizontal scroll container on mobile and tablet.
  - `components/home/HomeProductSection.tsx`: Configured to receive the list of popular products and render the new section directly below `NewProductsSection`.
- **APIs & Database**:
  - `app/home/page.tsx`: Queries database order statistics using `Prisma` aggregation (`groupBy` on `OrderItem` by `productId` summing `quantity` in desc order) to fetch the top 4 most ordered products, falling back to general active products if necessary.

### 8. General Q&A (FAQ) System
- **Description**: Interactive FAQ/QA accordion section at the bottom of the home page showing recurring questions and responses. Admins can create, edit, and delete FAQ questions and responses from a dedicated tab in the dashboard.
- **Components**:
  - `components/home/FaqSection.tsx`: Responsive client-side accordion component rendering the list of FAQs.
  - `components/home/HomeProductSection.tsx`: Integrates the `<FaqSection />` component at the bottom of the home page.
  - `components/dashbord/QnaSection.tsx`: Admin panel interface to manage general FAQ items.
  - `components/dashbord/Sidebar.tsx` & `app/dashboard/page.tsx` & `lib/dashboard-store.ts`: Added routing and navigation for the "Questions & Réponses" dashboard tab.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `Faq` model.
  - `app/api/faqs/route.ts` & `app/api/faqs/[id]/route.ts`: Built GET, POST, PUT, DELETE endpoints for FAQs.

### 9. Google Authentication & Protected Routes
- **Description**: Secure role-based Google Sign-In, Sign-Up, and session management using NextAuth and a PostgreSQL Prisma adapter. Restricts access to the admin dashboard and mutative REST endpoints to users with the `"admin"` role.
- **Components**:
  - `app/login/page.tsx`: Glassmorphic, responsive Google Sign-In screen with error boundaries.
  - `middleware.ts`: Intercepts and validates `/dashboard` routing.
  - `components/site-header.tsx`: Renders session avatar, sign-in/out toggles, and dashboard redirection dynamically.
  - `components/dashbord/Sidebar.tsx`: Handles dashboard sidebar log-out integration.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added NextAuth schema support (`User`, `Account`, `Session`, `VerificationToken`).
  - `lib/auth.ts` & `app/api/auth/[...nextauth]/route.ts`: Core NextAuth handler, session mapper, and role updates (auto-promoting specified email lists or the first user in the database).
  - Multi-endpoint protection: Injected session and role validators in products, FAQs, slides, configs, and file upload API endpoints.

### 10. Email Verification (Nodemailer) & Credentials Auth
- **Description**: Enabled local email/password registration, password hashing using `bcryptjs`, and email verification using Nodemailer. Unverified users are blocked from signing in. Verified users are reported in the admin dashboard.
- **Components**:
  - `app/register/page.tsx`: Sign-up screen with name, email, password, and confirmations.
  - `app/verify-email/page.tsx`: Token processor rendering activation success or failure states.
  - `app/login/page.tsx`: Integrated credentials input forms and verification warning flags alongside Google login.
  - `components/dashbord/UsersSection.tsx`: Searchable user table in the dashboard reporting credentials roles and verification status badges.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `password String?` to the `User` model.
  - `lib/email.ts`: Nodemailer SMTP transporter and HTML validation email dispatch helper.
  - `app/api/auth/register/route.ts`: Hashes credentials, persists profiles, generates secure tokens, and dispatches verification emails.
  - `app/api/auth/verify/route.ts`: Validates tokens, marks users as verified, and deletes tokens.
  - `app/api/users/route.ts` & `app/api/users/[id]/route.ts`: Restricted users lookup and deletion API endpoints returning verification lists and handling admin deletion.

### 11. User Trust System
- **Description**: Automatically evaluates and displays user reliability in the admin dashboard through a Trust Score calculated from the count of completed orders (status `DELIVERED` or `COMPLETED`).
- **Components**:
  - `components/dashbord/UsersSection.tsx`: Extended the users dashboard table with columns displaying completed orders count, trust score badges, and latest activity timestamp. Added sorting controls allowing admins to sort the user registry dynamically by trust score, latest activity, or email.
- **APIs & Database**:
  - `prisma/schema.prisma`: Created a one-to-many relationship linking `User` and `Order` via `userId` field, and added a `createdAt` tracking timestamp to the `User` model.
  - `app/api/orders/route.ts`: Injected `getServerSession` lookup in POST request processing to associate placed orders with the authenticated user ID if a session is present.
  - `app/api/users/route.ts`: Refactored user listing handler to load users with associated orders, compute completed order counts and latest activity metrics dynamically, and sort in-memory based on requested query parameters.

## Verification & Build Status
- **Type Checking**: Passed (`npm run typecheck`).
- **Production Build**: Successfully compiled (`npm run build`).
- **Unit & Integration Tests**:
  - Created `tests/api/auth.test.ts` to test signIn, jwt, and session callbacks.
  - Created `tests/api/verification.test.ts` to test local sign-up input validation, token generation, SMTP email dispatching, expiration, and database cleaning (including user deletion actions).
  - Created `tests/api/trust.test.ts` to verify session linkage during order creation, trust score calculations, and users list sorting.
  - Mocked `getServerSession` across all other API test modules to isolate authentication during endpoint operations.
  - All 98 tests pass successfully under `vitest`.
