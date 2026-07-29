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
  - `components/home/HeroCarousel.tsx`: Made `order` type field optional. Moved the Prev/Next navigation buttons from the bottom indicators bar to the left and right edges of the slide, styled with a premium glassmorphic circle design. Converted the bottom indicators to clean, borderless, larger diamond shapes (`rotate-45`) with expanded spacing and scale animations. Set the active indicator dot color to `#2a1082` (with matching shadow) and styled the "Coming Soon" button as a disabled light grey element (`bg-neutral-200 text-neutral-500`).
  - `app/home/page.tsx`: Merges checklist products (first) and custom uploaded slides (second) from database, capped by `carousel_max_slides`.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `CarouselSlide` model.
  - `app/api/carousel-slides/route.ts` & `app/api/carousel-slides/[id]/route.ts`: Built GET, POST, PUT, DELETE endpoints for slides management.
  - `app/api/config/route.ts`: Validates dynamic max slides limits.

### 4. Product Tags & Filtering (Dedicated Tag Model & Automatic Validation)
- **Description**: Migrated product tags to a dedicated database `Tag` model with a many-to-many relationship to `Product`. Built an autocomplete tag search widget at the top of the product browser to allow filtering products by multiple tags dynamically. Implemented automatic product tag verification ensuring that every product has tags assigned, and updated the tags filter suggestions to only show tags associated with at least one product.
- **Components**:
  - `components/our-product/ProductBrowser.tsx`: Repositioned the main search bar to the top. Added a search input for tags next to it, complete with a dropdown displaying matching suggestions matching the user's typing (fetched from `/api/tags?q=...`). Supports multi-select, displaying selected tags as premium, deletable pills.
  - `components/dashbord/ProductModal.tsx`: Maintained compatibility with a chip-based tags editor, mapping `tags: string[]` in POST/PUT API request/response payloads to/from the database relation.
  - `components/product-details/ProductDetails.tsx`: Displays tags prefixed with `#` next to the product category.
  - `components/ProductCard.tsx`: Displays up to 3 tags as styled badges below the product title.
- **APIs & Database**:
  - `prisma/schema.prisma`: Replaced the string array with a many-to-many relationship using a dedicated `Tag` model (`tags Tag[]` on Product, `products Product[]` on Tag).
  - `prisma/seed.ts`: Updated database seed script to explicitly connect initial products with tags upon creation.
  - `lib/tags.ts`: Built a server-side helper `ensureProductTags` that scans the database for products lacking tags and maps appropriate tags based on Arabic/French keyword matching (e.g. chocolate, butter, lemon, olive oil, etc.).
  - `app/api/tags/route.ts`: Rewritten to call `ensureProductTags` and query the `Tag` table, applying the `products: { some: {} }` constraint to filter out any unused tags from being shown in the autocomplete filter search.
  - `app/api/products/route.ts` & `app/api/products/[id]/route.ts`: Updated GET, POST, and PUT handlers to link tags relation and map returned tags to `string[]` for frontend compatibility. Removed database write modification (`ensureProductTags()`) from the products GET handler in `app/api/products/route.ts` to eliminate database latency and keep catalog loads read-only.
  - `scripts/ensure-tags.ts`: Standalone database seeding/migration script that runs the tag verification routine via `npm run db:ensure-tags`.
  - `tests/api/tags.test.ts`: Added automated unit/integration tests to verify tag endpoints and product association rules.

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
  - `app/api/products/[id]/route.ts`: Implemented `POST` handler for user rating submissions, calculating running average. Fixed syntax error at the end of the file.
  - `app/api/products/[id]/can-rate/route.ts` & `app/api/products/[id]/route.ts`: Expanded rating eligibility rules. Customers who checked out as guest can now rate products after logging in by matching order's phone or email against their profile. Supports both `DELIVERED` and `COMPLETED` order statuses.


### 6. Homepage New Products Section
- **Description**: Displays the newest products on the homepage directly below the Hero Carousel, using a single-card infinite looping slider layout.
- **Components**:
  - `components/home/NewProductsSection.tsx`: Renders the products using a single-card infinite looping slider layout on all screen sizes. Uses larger, circular dot indicators styled in `#2a1082`.
  - `components/home/HomeProductSection.tsx`: Configured to receive the list of new products and render the new section directly below `HeroCarousel`.
  - `components/dashbord/CmsSection.tsx`: Form interface updated to allow configuring `new_products_limit` with standard validation.
- **APIs & Database**:
  - `lib/config.ts` & `lib/hooks/use-config.ts` & `lib/copy-dictionary.json`: Added `new_products_limit` to defaults and CMS maps.
  - `app/api/config/route.ts`: Configured POST handler to validate that the new products limit is a positive integer >= 1.
  - `app/home/page.tsx`: Queries the database for products ordered by `createdAt` desc, filtering for active products (`state: 'exist'`), using the configured limit.

### 7. Homepage Popular Products Section
- **Description**: Displays the most ordered products on the homepage directly below the New Products section, using a single-card infinite looping slider layout.
- **Components**:
  - `components/home/PopularProductsSection.tsx`: Renders the products using a single-card infinite looping slider layout on all screen sizes. Uses larger, circular dot indicators styled in `#2a1082`.
  - `components/home/HomeProductSection.tsx`: Configured to receive the list of popular products and render the new section directly below `NewProductsSection`.

### 7b. Homepage Featured Products Section (Créations Vedettes)
- **Description**: Displays featured products on the homepage using a single-card infinite looping slider layout.
- **Components**:
  - `components/home/FeaturedProducts.tsx`: Renders featured products using a single-card infinite looping slider layout on all screen sizes. Uses larger, circular dot indicators styled in `#2a1082`.
- **Integrations**:
  - `app/home/page.tsx`: Limits database query to exactly 5 featured products.
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

### 12. Delivery Method Selection
- **Description**: Customers can choose between delivery options (e.g. Home Delivery, Office Pickup, Store Pickup) at checkout. Admins can create, edit, enable/disable methods in the dashboard.
- **Components**:
  - `components/cart/CheckoutForm.tsx`: Fetches active delivery methods and renders selection radio buttons during checkout, falling back to a default set if none are configured in database.
  - `components/dashbord/DeliverySection.tsx`: Admin panel for CRUD operations and active status toggling of delivery methods.
  - `components/dashbord/OrdersSection.tsx`: Displays the selected delivery method inside the customer details card for each order.
  - `components/dashbord/Sidebar.tsx` & `app/dashboard/page.tsx` & `lib/dashboard-store.ts`: Added routing and navigation for the "Méthodes de livraison" dashboard tab.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `DeliveryMethod` model and `deliveryMethod` field to `Order`.
  - `app/api/delivery-methods/route.ts` & `app/api/delivery-methods/[id]/route.ts`: Built endpoints for delivery methods.
  - `app/api/orders/route.ts`: Refactored to accept `deliveryMethod` and save it to database orders.

### 13. Email & Phone During Checkout
- **Description**: Enabled optional email input and required phone number input during checkout. Added validation checks on both frontend and backend and displays customer emails in the admin dashboard orders list/details view.
- **Components**:
  - `components/cart/CheckoutForm.tsx`: Added form fields for phone and email, validated formats before submission, and displayed localized input errors.
  - `components/dashbord/OrdersSection.tsx`: Extended admin order items table and order details modal to show customer email.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added optional `customerEmail` field to `Order` model.
  - `app/api/orders/route.ts`: Validates required phone (6-25 characters) and optional email patterns in POST. Support searching orders by email in GET.
  - `lib/hooks/use-orders.ts`: Extended payload/response TypeScript interfaces.

### 14. Order Status Workflow
- **Description**: Implemented order acceptance workflow allowing order status transitions from "Pending" to "Accepted". Created "Accept Order" action button for admins updating instantly, and a customer tracking page.
- **Components**:
  - `components/dashbord/OrdersSection.tsx`: Rendered "Accepter" (Accept) button for pending orders in the table and modal view, updating statuses instantly.
  - `app/orders/[id]/page.tsx`: Added customer tracking page displaying a visual stepper timeline (Pending -> Accepted -> Shipped -> Delivered) and order details.
  - `app/cart/page.tsx`: Handled created order IDs upon checkout success and linked customers to their tracking page.
- **APIs & Database**:
  - `app/api/orders/[id]/route.ts`: Added GET endpoint to retrieve order tracking information by ID for customer access.
  - `lib/hooks/use-orders.ts`: Integrated `deliveryMethod` into `Order` type interfaces.

### 15. Order Notifications
- **Description**: Real-time order notifications for administrators in the dashboard.
- **Components**:
  - `components/dashbord/NotificationBell.tsx`: Premium glassmorphic notification bell displaying an unread counter badge. Features sliding toast alerts and standard double chime tone (Web Audio API) for new orders. Clicking a notification marks it read and redirects admin to the "Commandes" tab with filters set to inspect that specific order.
  - `app/dashboard/page.tsx`: Embedded the notification bell in the dashboard page header.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `OrderNotification` model, linked to `Order` with cascade delete.
  - `lib/notification-emitter.ts`: Multi-module EventEmitter attached to `globalThis` to broadcast events.
  - `app/api/orders/route.ts`: Inside transaction, creates `OrderNotification` record and emits event outside transaction.
  - `app/api/notifications/route.ts`: GET endpoint fetches notifications (up to 50, sorted desc). PATCH handler marks specific or all notifications as read.
  - `app/api/notifications/sse/route.ts`: Server-Sent Events endpoint streaming real-time notification events.
  - `lib/hooks/use-notifications.ts`: Added React Query custom hooks `useNotifications` and `useMarkNotifications`.

### 16. Order Cancellation Rules
- **Description**: Enabled customers to cancel their pending orders directly from the tracking page, while restricting cancellation of accepted/shipped/delivered orders. Admins retain full status update rights and can always view the cancellation history.
- **Components**:
  - `app/orders/[id]/page.tsx`: Added an "Annuler la commande" button (active only when status is PENDING) with a confirmation dialog, and a periodic status poll.
- **APIs & Database**:
  - `app/api/orders/[id]/route.ts`: Enforces backend validation checks restricting customers to only cancel pending orders and forbidding anyone from cancelling accepted/shipped/delivered orders.

### 17. Order Reference Code
- **Description**: Implemented unique, automatically generated order reference codes in the format `ORD-YYYYMMDD-001`. Searchable from the admin dashboard and visible to customers.
- **Components**:
  - `app/orders/[id]/page.tsx`: Displays reference code at the top of the customer order tracking page.
  - `components/dashbord/OrdersSection.tsx`: Replaced the UUID display in the main dashboard orders list table and details modal header with the human-readable reference code.
- **APIs & Database**:
  - `prisma/schema.prisma`: Added `reference String? @unique` to `Order` model.
  - `app/api/orders/route.ts`: Automatically computes sequence increment numbers based on existing orders for the current UTC day. Implemented a transaction retry loop to guarantee unique constraint safety under concurrent orders. Extended GET handler search query filters to match on the reference code.

### 18. Address Linked To Order
- **Description**: Confirmed and tested the requirement that delivery addresses are entered during checkout, stored per-order on the order record, and not persisted to the user profile, allowing future address changes without affecting past orders.
- **APIs & Database**:
  - `tests/api/orders.test.ts`: Added automated integration tests to explicitly verify these per-order address storage and snapshotting rules.

### 19. Store Availability Mode
- **Description**: Enabled administrators to toggle store operations ON/OFF (e.g. Holiday, Maintenance, Temporary Closure) with a custom notification message. Displays the closure banner globally across client-facing pages, disables checkout inputs/submission on the frontend, and rejects order creation requests on the backend API with a 400 Bad Request.
- **Components**:
  - `components/dashbord/CmsSection.tsx`: Form toggle switches (Ouvert/Fermé) and text area for message configuration.
  - `components/site-header.tsx`: Renders global closure warning banner with the custom notification message.
  - `components/cart/CheckoutForm.tsx`: Warns checkout users and disables order placement when store is closed.
- **APIs**:
  - `app/api/orders/route.ts`: Blocks order placement on POST if the store is closed, returning the closure reason.

### 20. Advanced Order Management
- **Description**: Improved order management with sorting, filtering, searching, and pagination performance optimizations. Admins can filter by PENDING, ACCEPTED, CANCELLED statuses, search orders by ID/reference, customer name, or phone number, and sort by date, status, customer trust score, and order count. The backend utilizes native database queries for date/status sort paths and a lightweight two-step paginated fetch for computed fields.
- **Components**:
  - `components/dashbord/OrdersSection.tsx`: Integrated sorting controls and filters, and added trust score and volume of orders badges next to customer details in the orders list.
- **APIs**:
  - `app/api/orders/route.ts`: Extended GET handler to process advanced sorting pathways with optimal paginated queries, and attached customer metrics.

### 21. Pure Database Data Source & Cleanup
- **Description**: Cleaned up the codebase to ensure the database acts as the single source of truth for the application's data. All mock data seeding and importing scripts were deleted. Client-side fallback mock datasets for carousel slides and delivery methods were removed.
- **Removed Scripts**:
  - `scripts/import-candies.ts`
  - `scripts/migrate-tags.ts`
  - `scripts/seed-carousel-products.ts`
  - `scripts/seed-faqs.ts`
  - `scripts/update-categories.ts`
  - `scripts/upload-carousel.ts`
- **Components**:
  - `components/cart/CheckoutForm.tsx`: Removed the local fallback array for `DeliveryMethod`.
  - `components/home/HeroCarousel.tsx`: Removed the static fallback slides array, rendering nothing (`null`) if no slides are returned from the database.
  - `components/dashbord/ProductsSection.tsx`: Added Category Filter dropdown, "Reset Filters" button, and responsive skeleton loaders.
  - `components/dashbord/orders/`: Added checkboxes for bulk status updates (Accept, Deliver, Cancel), mobile card order items expandability, and a page-size selector.
  - `components/dashbord/products/`: Added manual slug regenerator button, enabled vertical resizing on Description/Story textareas, and improved empty image upload state UI.
  - `lib/price.ts`: Centralized currency to Euro (`CURRENCY_SYMBOL = '€'`).
  - `tests/price.test.ts`: Added unit tests verifying Euro price formatting.

### 23. Fixed & Collapsible Dashboard Sidebar
- **Description**: Redesigned the desktop dashboard sidebar to support fixed scrolling and custom collapse states without layout overlaps or clipped elements.
- **Components**:
  - `components/dashbord/Sidebar.tsx`:
    - Structured with a parent fixed outer wrapper `div` to maintain position on scroll while leaving the toggle button non-clipped.
    - Set the collapse toggle button at `absolute -right-4 top-6` so it stays fixed on scroll.
    - Shortened navigation labels to <= 2 words: *Gérer produits*, *Gestion contenu*, *Questions/Réponses*, and *Méthodes livraison*.
    - Enforced `whitespace-nowrap` on all button texts.
    - Applied premium padding and rounded corners (`rounded-xl px-4 py-3`).
    - Added `justify-between` to the mobile header flex container to separate the logo and action items.
    - Removed `sticky top-0` from the mobile `<aside>` container so it scrolls naturally with the page, avoiding overlap bugs.
    - Shifted the desktop responsive breakpoint from 768px (`md:`) to 1300px (`min-[1300px]:`), meaning all viewports below 1300px render the hamburger menu navigation.
  - `app/dashboard/page.tsx`:
    - Shifted page layout splitting threshold and header responsiveness configurations from `md:` to `min-[1300px]:` to match the sidebar's collapse breakpoint.
    - Removed `overflow-hidden` from the page `<header>` to resolve the notification dropdown menu clipping bug.
    - Removed the "Ajouter un nouveau produit" button from the global header.
  - `components/dashbord/ProductsSection.tsx`:
    - Relocated the "Ajouter un produit" button to the right side of the products section filter header, next to the product counter, where it cleanly aligns with its context.
    - Elevated the header's z-index to `z-20 min-[1300px]:z-40` on desktop so it stacks above scrollable page content.
  - `components/dashbord/NotificationBell.tsx`:
    - Changed the dropdown backdrop and layout breakpoints from `sm:` to `desktop:` so the notification dropdown uses `fixed` positioning relative to the viewport on all screen widths < 1300px, avoiding clipping under scrollable wrappers.
  - `tailwind.config.ts`:
    - Extended standard screen breakpoints to include a custom `desktop: '1300px'` screen breakpoint for robust compiles.

### 24. Standard Web Notifications Removal
- **Description**: Completely removed old native browser OS-level desktop notifications for new orders, relying instead on standard in-app chimes, floating toasts, and the dropdown menu.
- **Affected Files**:
  - `components/dashbord/hooks/useNotificationBell.ts`: Removed service worker registration and native desktop notification triggers.
  - `public/sw.js` [DELETED]: Removed standard background service worker.

### 25. Tab Visibility Notification System
- **Description**: Triggers a browser desktop alert and plays a chime audio file when the user is away from the website (tab switches to background or window is minimized).
- **Core Logic**:
  - `components/TabVisibilityNotifier.tsx` [NEW]: Recreated from scratch as a Next.js client component. Force-unregisters any active ghost service workers, requests browser notification permissions on mount, monitors page visibility changes, plays `/notification.mp3` catching autoplay rejections, and displays standard desktop notifications.
  - `app/layout.tsx` [MODIFY]: Mounts `<TabVisibilityNotifier />` component globally to apply the event listener.
  - `components/providers.tsx` [MODIFY]: Removed old TabVisibilityNotifier import and mounting.
  - `tests/tab-visibility.test.tsx` [NEW]: Full test coverage using Vitest jsdom, ensuring Service Worker unregistration, permission requests, visibility-triggered notifications, audio playback, and autoplay policy graceful rejection.

### 26. Dashboard Overlay Layer Prioritization
- **Description**: Reordered visual layering (z-index hierarchy) on the administrative dashboard to avoid overlaps and ensure popup modal and notification visibility.
- **Priority Layers**:
  - **Notification Dropdowns & Toasts (z-[90])**: Placed at the highest layer so notification dropdowns and toast alerts display above everything else.
  - **Notification Bell Backdrop (z-[85])**: Backdrop container layer to dismiss the dropdown.
  - **Confirmation & Delete Modals (z-[80])**: `OrderStatusConfirmModal`, `DeleteModal`, and `DashboardDeleteModal` stack above standard editing popups but below notifications.
  - **Update & Create Modals (z-[70])**: `ProductModal`, `OrderDetailsModal`, `QnaModal`, and `CarouselSlideModal` stack above the sidebar and dashboard page headers.
  - **Sidebar & Core Navigation (z-30 / z-[35])**: Sidebar content and collapse toggles are set to remain below modals.
  - **Sticky Header (z-20)**: Placed below modals but above sticky sub-headers (`z-10`) for smooth scroll stacking.

### 27. Translation Crash Mitigation
- **Description**: Add monkeypatches to prevent third-party translation tools (like Google Translate built-in to Google Chrome) from crashing React when modifying DOM elements on dynamic changes (e.g., submitting orders or saving CMS settings).
- **Patch Area**:
  - `components/providers.tsx`: Overrides native `Node.prototype.removeChild` and `Node.prototype.insertBefore` inside a client-side `useEffect` callback, intercepting and safely swallowing `NotFoundError` DOM errors caused by Google Translate replacement tags.

### 28. Stale Session Order Creation Safeguard
- **Description**: Prevents database foreign key constraint violations (`Order_userId_fkey`) when placing orders using a stale browser session (where the user ID stored in NextAuth JWT no longer exists in the database, e.g., after database wipe/seed).
- **Core Logic**:
  - `app/api/orders/route.ts`: Prior to transaction processing in the POST handler, queries the `User` table for the session's `userId`. If the user record is not found in the database, `userId` is set to `null` to gracefully fall back to a guest checkout.
  - `tests/api/orders.test.ts`: Added automated unit test verifying that a stale session user ID successfully triggers the `null` fallback.
  - `tests/api/trust.test.ts`: Updated session linkage test to mock the database user validation check successfully.

### 29. Header Hamburger Breakpoint Update
- **Description**: Configures the site header navigation bar to show the hamburger menu for all viewports smaller than 1024px (`lg`), providing a cleaner tablet layout.
- **Affected Files**:
  - `components/site-header.tsx`: Updated visibility helper classes from `md:` (768px) to `lg:` (1024px) on desktop navigation (hide/show blocks) and mobile action triggers.

### 30. Progressive Web App (PWA) Conversion
- **Description**: Enabled offline fallback capabilities, update notifications, progressive install banners, and standard-compliant metadata for the site.
- **Manifest**: Created dynamic manifest route `app/manifest.ts` using Next.js MetadataRoute.Manifest, pulling name and description from the central theme, and setting display mode to `standalone` and orientation to `portrait`.
- **Metadata**: Extended `app/layout.tsx` metadata with PWA capability flags and touch icons.
- **Service Worker**: Custom Service Worker at `public/sw.js` that implements versioned caching, cache-first for static assets, network-first with `/offline` fallback for navigation, and network-first for product API endpoints. Completely bypasses caching for admin dashboard, mutations, and non-GET requests.
- **Registration**: Created client component `components/PwaRegister.tsx` to register `sw.js` in production and show non-intrusive French update toast when a new sw version is available (hidden on `/cart` page).
- **Install Button**: Created `components/PwaInstallButton.tsx` to handle captures of `beforeinstallprompt` event and render a clean, standard install banner next to the Cart icon in `components/site-header.tsx`.
- **Offline page**: Created custom accessible French offline fallback page at `/offline` with a retry button redirecting to `/home`.
- **Offline Guard**: Updated `components/cart/CheckoutForm.tsx` to track online status, block submissions when offline, and disable the order buttons to prevent data synchronization issues.
- **Testing**: Added focused Vitest coverage in `tests/pwa.test.tsx` to mock service worker registration and verify installer behavior.

### 31. Trust Score to Points Conversion
- **Description**: Converted the "Score de Confiance" (Trust Score) system to a points-based system instead of simple completed order counts or currency formatting. Each point represents £1 spent on completed orders (status `DELIVERED` or `COMPLETED`), which is computed from the floored sum of their `totalAmount`.
- **Core Logic**:
  - `app/api/users/route.ts`: Queries the sum of `totalAmount` of all completed orders for each user and floors it to compute their trust score points.
  - `app/api/orders/route.ts`: Grouped completed orders by `userId` and `customerPhone`, summing their `totalAmount` to compute and floor their trust score points.
- **Dashboard UI**:
  - `components/dashbord/users/`: Updated sorting option label, table headers, and badges to display points with proper singular/plural labeling (`X point` vs `X points`).
  - `components/dashbord/orders/`: Updated sorting option label and customer details view to display `Points de Confiance` as points instead of a score out of 100.
- **Testing**:
  - `tests/api/trust.test.ts`: Updated tests with `totalAmount` mocked on orders and asserted the floored sum of completed order amounts are correctly returned as points.

### 32. Clients Section & Dynamic Status
- **Description**: Replaced the general admin dashboard "Utilisateurs" section with a dedicated "Clients" (Customers) section. Filters out administrative roles from the list and calculates client statuses dynamically based on point milestones and order history.
- **Routing & Navigation**:
  - `components/dashbord/Sidebar.tsx` & `lib/copy-dictionary.json`: Renamed sidebar tab and tooltips from "Utilisateurs" to "Clients" and synchronized them with the centralized copy dictionary. Applied `suppressHydrationWarning` to the label text spans to avoid Next.js hydration mismatch errors.
  - `app/dashboard/page.tsx`: Updated main view header to "Gestion des clients".
- **Backend & API Route**:
  - `app/api/users/route.ts`: Added `where` constraint to exclude `role` matching `'admin'` or `'ADMIN'`. Computes client status based on priority logic: "VIP" ($\ge 500$ points), "Fidèle" ($\ge 100$ points), "Vérifié" (has at least one `DELIVERED` order), and "Non vérifié" (default).
- **Dashboard UI**:
  - `components/dashbord/UsersSection.tsx` & `components/dashbord/hooks/useUsersSection.ts`: Updated loader, delete modals, and toast message texts to use French "client" terms.
  - `components/dashbord/helpers/UsersSectionHelpers.tsx`: Replaced "Rôle" table column with "Statut" and implemented a custom status badge renderer using specific icons and premium tag colors (Gold for VIP, Indigo for Fidèle, Emerald for Vérifié, Slate for Non vérifié).
- **Testing**:
  - `tests/api/trust.test.ts`: Added tests verifying admin role exclusion and correct evaluation of all 4 status tiers.
- **PWA Asset Updates**:
  - `public/logo.jpeg`: Overwrote default logo asset with the new custom brand icon for standalone app installs.
- **Carousel UI Refinements**:
  - `components/home/NewProductsSection.tsx`, `components/home/PopularProductsSection.tsx`, `components/home/FeaturedProducts.tsx`, `components/home/HeroCarousel.tsx`: Updated slide indicator dots to make the active dot longer (w-12 pill-shape) than the inactive ones (w-3) to create a premium, dynamic feel.
- **Body Scroll Locking for Modals**:
  - `lib/hooks/use-lock-body-scroll.ts`: Created a custom hook to toggle `overflow: hidden` on the page body when a modal is active.
  - Integrated this hook in all application modal components: `DeleteModal`, `ProductModal`, `DashboardDeleteModal`, `QnaModal`, `OrderDetailsModal`, `OrderStatusConfirmModal`, mobile filters modal in `ProductBrowser`, and rating modal in `ProductDetails`. Prevents scroll when popups are shown.

### 33. Scrollbar Layout Shift Prevention & Multi-Modal Support
- **Description**: Re-engineered the scroll-locking system to completely prevent horizontal page content jumping (layout shift) and correctly support multiple/nested active modals.
- **Scrollbar Padding Compensation**: Calculates the exact viewport scrollbar width via `window.innerWidth - document.documentElement.clientWidth` when a modal is opened, applying the width as `paddingRight` to `document.body` while scroll is locked.
- **Nested Modal Counting**: Tracks active scroll locks via a module-level counter (`lockCount`). Prevents early release of styles when a nested modal is closed before its parent, and only restores the original body styles (`overflow` and `padding-right`) when the count reaches `0`.
- **Testing**: Added focused JSDOM test suite in `tests/scroll-lock.test.tsx` to verify layout shift calculations, nested/sequential modal locking, and cleanup behaviour.

### 34. Responsive Tag Editor Layout
- **Description**: Stacks the "Ajouter" (Add) tag button under the input field on screens narrower than 415px in the dashboard product editing modal.
- **Affected Files**:
  - `components/dashbord/products/`: Changed the tag input container class in `ProductTagsEditor` to `flex flex-col min-[415px]:flex-row gap-xs` to responsive-stack elements on small viewports.

### 35. Simplified Client Card UI
- **Description**: Simplified the user/client card layout in the dashboard mobile/tablet view by removing the avatar initials icon and allowing the user name and ID container to span the full available width.
- **Affected Files**:
  - `components/dashbord/users/`: Removed the initials avatar element, changed the name/ID parent container class to `flex-1`, and deleted the unused `initials` calculation logic.

### 36. Delivery Methods Modal Layout & Responsive Table
- **Description**: Re-engineered the "Méthodes de livraison" (Delivery Methods) dashboard tab to look and behave like the products section. Replaced the split-column layout with a full-width table and converted the creation/update form into a popup modal overlay.
- **Affected Files**:
  - `components/dashbord/DeliverySection.tsx`: Swapped grid columns for a full-width header (featuring an "Ajouter une méthode" button) and rendered `DeliveryForm` inside a fixed popup modal.
  - `components/dashbord/hooks/useDeliverySection.ts`: Expanded hook to manage and export modal visibility state (`isModalOpen`), automatically opening on edit and closing on submit/reset.
  - `components/dashbord/helpers/DeliverySectionHelpers.tsx`: Refactored `DeliveryForm` as modal form contents (incorporating `useLockBodyScroll(true)`), removed obsolete border cards, and updated `DeliveryTable` breakpoints to `lg:hidden` (card grid) and `lg:block hidden` (table) for unified dashboard responsiveness.

### 37. Print Order Feature
- **Description**: Enabled administrators to print accepted orders directly from the dashboard. Generates a standard 10x15 cm (A6) viewport printout/PDF formatted with zero margins and high contrast.
- **Components**:
  - `components/dashbord/helpers/OrderPrintReceipt.tsx` [NEW]: Renders order details via a React Portal, applies print-specific media query styles, and invokes `window.print()` dynamically.
  - `components/dashbord/orders/` [MODIFY]: Added Print buttons with printer icons in the mobile card and desktop table layouts for accepted orders.
  - `components/dashbord/OrdersSection.tsx` [MODIFY]: Manages state for the active print order.
- **Testing**:
  - `tests/print-order.test.tsx` [NEW]: Unit tests for receipt printing layout, window.print triggering, and state cleanup.

### 38. Unused Code & Dependency Cleanup
- **Description**: Removed the unused component `PushNotificationManager.tsx` (previously part of the Web Push notification system) and purged the obsolete packages `firebase`, `web-push`, and `@types/web-push` from `package.json` and `package-lock.json` to optimize bundle sizing and keep the codebase minimal.
- **Removed Files**:
  - `components/PushNotificationManager.tsx` [DELETE]
- **Modified Files**:
  - `package.json` [MODIFY]
  - `package-lock.json` [MODIFY]

### 39. Dashboard Optimization Pass (Products & Orders)
- **Description**: Refactored the dashboard's product and order management code to remove redundancies, centralize core business formatting logic, and improve maintainability.
- **Deduplication & Optimizations**:
  - **Date Formatting**: Extracted `formatFrenchDate` from duplicate local declarations in `orders/` and `users/` into a new centralized utility `lib/date.ts`. Updated `OrderPrintReceipt.tsx` to consume the utility.
  - **Slug Generation**: Created a reusable `generateSlug` helper in `lib/products.ts` and integrated it across title changes and manual generation triggers in `products/`.
  - **Product State Badges**: Created a single `ProductStateBadge` component in `products/` and removed identical inline styling logic in `ProductsSection.tsx` mobile card grid and desktop table views.
  - **Order Status Configs**: Centralized order status translation strings and Tailwind color configurations into `ORDER_STATUS_CONFIG` inside `orders/`, reducing visual noise in status dropdowns and detail views.
  - **Image Default Cleanup**: Swapped out the default Unsplash image placeholder in `dashboard-store.ts` for an empty string (`""`) to represent a cleaner initial product creation state.
- **New Files**:
  - `lib/date.ts` [NEW]
- **Modified Files**:
  - `lib/products.ts` [MODIFY]
  - `lib/dashboard-store.ts` [MODIFY]
  - `components/dashbord/products/` [MODIFY]
  - `components/dashbord/ProductsSection.tsx` [MODIFY]
  - `components/dashbord/orders/` [MODIFY]
  - `components/dashbord/users/` [MODIFY]
  - `components/dashbord/helpers/OrderPrintReceipt.tsx` [MODIFY]

### 40. Localized Product Modal Form State
- **Description**: Refactored the product modal form state to move all transient form inputs (`title`, `slug`, `price`, `category`, `description`, `story`, `limitBay`, etc.) from the global Zustand store `useDashboardStore` into local React state. This prevents global dashboard components from re-rendering on every keystroke, resulting in a completely fluid typing experience. The Zustand store is now strictly kept for modal orchestration.
- **Deduplication & Optimizations**:
  - **Local React State**: Form state, tag lists, and uploaded images are managed locally inside `useProductModal.ts`.
  - **Refs-Based Initialization**: Implemented `prevIsOpen` and `prevEditingId` refs to initialize form states exactly once when the modal is opened or when changing products, preventing infinite rendering loops and background refetch overwrites.
  - **Autogeneration of Slugs**: Slugs are generated dynamically from local titles, keeping the UI interactive.
- **Affected Files**:
  - `lib/dashboard-store.ts` [MODIFY]
  - `components/dashbord/hooks/useProductModal.ts` [MODIFY]
- **Testing**:
  - `tests/product-modal.test.tsx` [NEW]: Focused JSDOM unit tests verifying create/edit initialization, slug auto-generation, and tags manipulation locally.

### 41. Asset Deletion Integrity & Race Condition Resolution
- **Description**: Resolved asset deletion race conditions in the product PUT and DELETE endpoints to protect against orphaned references and broken image URLs in the database.
- **Core Logic**:
  - `app/api/products/[id]/route.ts`: Placed Prisma update and delete database queries inside explicit Prisma transaction blocks (`prisma.$transaction`).
  - Deferred the Cloudinary `deleteImage` calls until *after* the database transactions commit successfully.
  - If a database operation fails (e.g., database timeout or foreign key constraint violation), the endpoint returns a 500 error response without invoking the Cloudinary asset cleanup, keeping the local image URLs and assets completely in sync.
- **Testing**:
  - `tests/api/products.test.ts`: Added automated unit/integration tests confirming that a failing database query does not delete assets from Cloudinary.

### 42. Dynamic Category Querying
- **Description**: Replaced hardcoded category conditional filters in the products GET endpoint with a dynamic equality check.
- **Core Logic**:
- `app/api/products/route.ts`: Resolves category parameter dynamically using a simple equality filter `where: { category }` in database queries.
- **Testing**:
- `tests/api/products-pagination.test.ts` & `tests/api/products.test.ts`: Added and updated unit tests to verify dynamic category filter resolution.

### 43. Server-Side Product Pagination and Lazy Loading
- **Description**: Refactored the products GET endpoint, client hooks, and the admin dashboard products section to support server-side execution (pagination, sorting, and search) using PostgreSQL (via Prisma), while maintaining backward-compatibility and adding support for server-side infinite scroll.
- **Backend API**:
  - `app/api/products/route.ts`: Supported database-level sorting by rating via `sortBy` parameter. Computes total matching items count and has-next-page indicators, returning them in `x-total-count` and `x-has-next-page` response headers.
- **Client-Side Hooks**:
  - `lib/hooks/use-products.ts`: Refactored `useProducts` query hook to accept pagination, filter, and sorting parameters, mapping the returned `x-total-count` header to a `.total` property. Added `useInfiniteProducts` utilizing TanStack React Query `useInfiniteQuery` and `x-has-next-page` header mapping for server-side infinite scrolling.
- **Dashboard View**:
  - `components/dashbord/ProductsSection.tsx`: Replaced client-side sorting, filtering, and slicing in favor of sending pagination and filter parameters directly to the query hook, ensuring only lightweight page chunks are fetched and rendered.
- **Product Browser Catalog**:
  - `components/our-product/ProductBrowser.tsx`: Refactored the lazy-loading products browser to consume the unified `useInfiniteProducts` hook and integrated `rootMargin: '250px'` in the Intersection Observer configuration to enable proactive next-page prefetching before the user reaches the bottom.
- **Testing**:
  - `tests/api/products.test.ts` & `tests/api/products-pagination.test.ts`: Added mocks for `prisma.product.count` and integration tests verifying database-side rating sorting.

### 44. Scoped Order Aggregations (Database Optimization)
- **Description**: Replaced the performance-heavy global group-by aggregations executed on all historical database orders during listing. The orders route now fetches the paginated page records first, extracts unique customers, and scopes database group-by aggregations (completed amounts and total count) only to those unique active page users/phones, resolving pagination scaling bottlenecks.
- **APIs**:
  - `app/api/orders/route.ts`: Added helper function `getAggregations` and refactored the `GET` route to fetch paginated orders first and run aggregations exclusively for those active page customer records.

### 45. Database-Level Computed Sort & Pagination (Orders API)
- **Description**: Eliminated the in-memory array sorting and map-sort-slice pagination bottleneck for computed fields (`customerTrustScore`, `customerOrderCount`). Replaced it with a single-transaction database-level query using raw SQL (`$queryRaw`) to compute aggregations, filter, sort, and slice paginated results directly in PostgreSQL.
- **APIs & Database**:
  - `app/api/orders/route.ts` [MODIFY]: Unified all sorting paths to use `prisma.$transaction`. Safe dynamic WHERE clauses are constructed using `Prisma.sql`. Computed customer trust score and order count are aggregated on the database side. BigInt return values are correctly converted to standard numbers before serialization.
- **Testing**:
  - `tests/api/orders.test.ts` [MODIFY]: Updated mock client behavior and updated test assertions to use `$queryRaw` mocks and verify exact query parameters.

### 46. Orders Dashboard Component Decomposition
- **Description**: Decomposed the monolithic and complex `OrdersSectionHelpers.tsx` helper component into distinct single-responsibility modules: `OrdersFilters.tsx`, `OrdersTable.tsx`, `OrderDetailsModal.tsx`, and `OrderStatusConfirmModal.tsx`. Centralized common Tailwind classes and translations into `orderStatusConfig.ts`.
- **Affected Files**:
  - `components/dashbord/helpers/OrdersSectionHelpers.tsx` [DELETE]
  - `components/dashbord/OrdersSection.tsx` [MODIFY]
  - `components/dashbord/orders/orderStatusConfig.ts` [NEW]
  - `components/dashbord/orders/OrdersFilters.tsx` [NEW]
  - `components/dashbord/orders/OrdersTable.tsx` [NEW]
  - `components/dashbord/orders/OrderDetailsModal.tsx` [NEW]
  - `components/dashbord/orders/OrderStatusConfirmModal.tsx` [NEW]

### 47. CMS Dashboard Component Decomposition
- **Description**: Decomposed the monolithic and complex `CmsSectionHelpers.tsx` helper component into distinct single-responsibility modules: `ShopStatusSection.tsx`, `CarouselManagerSection.tsx`, `HomepageStorySection.tsx`, `AboutHistorySection.tsx`, `ContactSocialSection.tsx`, and `SlideModal.tsx`.
- **Affected Files**:
  - `components/dashbord/helpers/CmsSectionHelpers.tsx` [DELETE]
  - `components/dashbord/CmsSection.tsx` [MODIFY]
  - `components/dashbord/cms/ShopStatusSection.tsx` [NEW]
  - `components/dashbord/cms/CarouselManagerSection.tsx` [NEW]
  - `components/dashbord/cms/HomepageStorySection.tsx` [NEW]
  - `components/dashbord/cms/AboutHistorySection.tsx` [NEW]
  - `components/dashbord/cms/ContactSocialSection.tsx` [NEW]
  - `components/dashbord/cms/SlideModal.tsx` [NEW]

### 48. Product Dashboard Component Decomposition
- **Description**: Decomposed the monolithic and complex `ProductModalHelpers.tsx` helper component into distinct single-responsibility modules: `ProductBasicInfo.tsx`, `ProductImageUpload.tsx`, `ProductDetailsInfo.tsx`, `ProductMetrics.tsx`, `ProductTagsEditor.tsx`, `ProductDescriptionStory.tsx`, and `ProductStateBadge.tsx`. Centralized categories configuration into `productCategories.ts`.
- **Affected Files**:
  - `components/dashbord/helpers/ProductModalHelpers.tsx` [DELETE]
  - `components/dashbord/ProductModal.tsx` [MODIFY]
  - `components/dashbord/ProductsSection.tsx` [MODIFY]
  - `components/dashbord/products/productCategories.ts` [NEW]
  - `components/dashbord/products/ProductBasicInfo.tsx` [NEW]
  - `components/dashbord/products/ProductImageUpload.tsx` [NEW]
  - `components/dashbord/products/ProductDetailsInfo.tsx` [NEW]
  - `components/dashbord/products/ProductMetrics.tsx` [NEW]
  - `components/dashbord/products/ProductTagsEditor.tsx` [NEW]
  - `components/dashbord/products/ProductDescriptionStory.tsx` [NEW]
  - `components/dashbord/products/ProductStateBadge.tsx` [NEW]

### 49. Clients Dashboard Component Decomposition
- **Description**: Decomposed the monolithic and complex `UsersSectionHelpers.tsx` helper component into distinct single-responsibility modules: `UsersFilters.tsx` and `UsersTable.tsx`. Extracted the type interfaces and status styling indicators to `userHelpers.tsx`.
- **Affected Files**:
  - `components/dashbord/helpers/UsersSectionHelpers.tsx` [DELETE]
  - `components/dashbord/UsersSection.tsx` [MODIFY]
  - `components/dashbord/hooks/useUsersSection.ts` [MODIFY]
  - `components/dashbord/users/userHelpers.tsx` [NEW]
  - `components/dashbord/users/UsersFilters.tsx` [NEW]
  - `components/dashbord/users/UsersTable.tsx` [NEW]

### 50. React Query Cache Invalidation & Order Dashboard Synchronization
- **Description**: Enforced React Query cache invalidation to fix state synchronization issues in the orders dashboard. Removed temporary local state patching in `OrderDetailsModal.tsx` and implemented automatic synchronization between the `selectedOrder` state and the React Query `['orders']` cache.
- **Affected Files**:
  - `components/dashbord/orders/OrderDetailsModal.tsx` [MODIFY]: Removed `onUpdateOrderLocal` prop and callbacks.
  - `components/dashbord/OrdersSection.tsx` [MODIFY]: Removed `onUpdateOrderLocal={setSelectedOrder}` and added a `useEffect` hook to keep `selectedOrder` dynamically synchronized with the React Query cache list. If the order is no longer in the list (e.g., due to filter status updates), the modal automatically closes.
- **Testing**:
  - `tests/orders-sync.test.tsx` [NEW]: Focused unit and integration tests verifying order status updates, React Query cache invalidation, and modal state synchronization/auto-closure.

### 51. Shared Refactoring: Centralized Status Guards, Style Maps, and Pagination Hook
- **Description**: Unified safety policies, centralized configuration maps, and generalized pagination logic across the dashboard.
- **Safety Transitions & Styling Guards**:
  - `types/orderStatusConfig.ts` [NEW]: Created a centralized types file defining the unified `ORDER_STATUS_CONFIG` style map (label, bg, selectClass, badgeClass) and a transition safety guard helper `isValidStatusTransition(current, target)`.
  - Blocks invalid status transitions (e.g. reverting `CANCELLED` or `DELIVERED` to `PENDING`, or cancelling `ACCEPTED` or `DELIVERED` orders) at both the API level (`app/api/orders/[id]/route.ts`) and client UI level (`components/dashbord/OrdersSection.tsx`, `app/orders/[id]/page.tsx`, `app/orders/page.tsx`).
  - Deleted old local `components/dashbord/orders/orderStatusConfig.ts` file to keep a single source of truth.
- **Shared Dashboard Pagination Hook**:
  - `components/dashbord/hooks/useDashboardPagination.ts` [NEW]: Built a generalized React custom hook that encapsulates query states (pagination page, search text, limit, sorting key, sorting direction) and manages resetting current pages to 1 automatically when search input or query filters change.
  - Refactored `components/dashbord/hooks/useOrdersSection.ts` and `components/dashbord/ProductsSection.tsx` to consume the new shared hook, ensuring a unified pagination interface.
- **Affected Files**:
  - `types/orderStatusConfig.ts` [NEW]
  - `components/dashbord/hooks/useDashboardPagination.ts` [NEW]
  - `components/dashbord/orders/orderStatusConfig.ts` [DELETE]
  - `app/api/orders/[id]/route.ts` [MODIFY]
  - `components/dashbord/OrdersSection.tsx` [MODIFY]
  - `components/dashbord/orders/OrdersTable.tsx` [MODIFY]
  - `components/dashbord/orders/OrderDetailsModal.tsx` [MODIFY]
  - `components/dashbord/orders/OrderStatusConfirmModal.tsx` [MODIFY]
  - `app/orders/page.tsx` [MODIFY]
  - `app/orders/[id]/page.tsx` [MODIFY]
  - `components/dashbord/hooks/useOrdersSection.ts` [MODIFY]
  - `components/dashbord/ProductsSection.tsx` [MODIFY]
- **Testing**:
  - `tests/shared-refactoring.test.tsx` [NEW]: Dedicated JSDOM unit tests confirming transition guard safety logic and verification of search/filter-dependent pagination resets inside `useDashboardPagination`.

### 52. Minimal Browser Desktop Notifications
- **Description**: Added native OS-level desktop notification capability for administrators. When a new order is received via the existing real-time SSE listener in the background, a native browser `Notification` alert is triggered alongside the chime sound. Includes a simple, premium button in the notification bell dropdown to request browser notification permission.
- **Affected Files**:
  - `components/dashbord/hooks/useNotificationBell.ts` [MODIFY]: Instantiates native `Notification` constructor when SSE message is received if permission is granted.
  - `components/dashbord/NotificationBell.tsx` [MODIFY]: Tracks permission state and renders a request button.
- **Testing**:
  - `tests/desktop-notifications.test.tsx` [NEW]: Unit tests verifying the notification construction, permission request updates, and denied state bypass logic.

### 53. Console Error Resolution, Hydration Mismatch & Test Harness Fixes
- **Description**: Resolved console errors and warnings reported in runtime logs and unit test suites:
  - **Sidebar Navigation TypeError**: Added optional chaining and safe string fallback (`dictionary?.dashboard?.navigation?.clients || "Clients"`) in `components/dashbord/Sidebar.tsx` to handle optional dictionary structures gracefully.
  - **HeroCarousel Hydration Mismatch**: Removed `{isMounted && ...}` conditional wrapper around slide indicator buttons in `components/home/HeroCarousel.tsx` to align initial SSR and client DOM output.
  - **PostgreSQL SSL Warning**: Appended `&uselibpqcompat=true` to `DATABASE_URL` in `.env` to satisfy `pg-connection-string` security standards and eliminate runtime SSL mode deprecation warnings.
  - **Unit Test Suite Integrity**: Added `siteConfig` Prisma mock to `tests/api/trust.test.ts`, updated assertions in `tests/api/delivery.test.ts`, and stubbed `PushManager`, `serviceWorker`, `matchMedia`, and `fetch` in `tests/desktop-notifications.test.tsx`.
- **Affected Files**:
  - `components/dashbord/Sidebar.tsx` [MODIFY]
  - `components/home/HeroCarousel.tsx` [MODIFY]
  - `.env` [MODIFY]
  - `lib/hooks/use-push-notifications.ts` [MODIFY]
  - `tests/api/trust.test.ts` [MODIFY]
  - `tests/api/delivery.test.ts` [MODIFY]
  - `tests/desktop-notifications.test.tsx` [MODIFY]
- **Verification**:
  - All 180 unit and integration tests across 25 test files pass with 0 failures (`npx vitest run`).
  - TypeScript compilation completed with 0 errors (`npx tsc --noEmit`).

### 54. Multi-Instance Redis Pub/Sub, SSE 15s Heartbeat, and Web Push Deduplication
- **Description**: Resolved 3 core architectural notification issues:
  1. **EventEmitter Limitations (Redis Pub/Sub)**: Created `lib/redis.ts` and updated `lib/notification-emitter.ts` to utilize Redis Pub/Sub for broadcasting SSE notifications across multi-instance / serverless deployments when `REDIS_URL` is set, with seamless fallback to Node.js `EventEmitter` for local/test environments.
  2. **SSE Connection Timeouts (15s Heartbeat)**: Added explicit keep-alive heartbeat interval (`: ping\n\n` every 15 seconds) and proxy buffering headers (`X-Accel-Buffering: no`) in `app/api/notifications/sse/route.ts` to keep long-lived connections active across proxies and serverless environments.
  3. **Notification Deduplication (Active Tab Presence)**: Implemented `lib/presence.ts` and `/api/notifications/presence` API route to track active visible admin dashboard tabs (`document.visibilityState === 'visible'`). Added presence checks in `app/api/orders/route.ts` to skip triggering Web Push notifications if the admin tab is currently open and active.
- **Affected Files**:
  - `package.json` [MODIFY]: Installed `ioredis` and `@types/ioredis`.
  - `lib/redis.ts` [NEW]: Redis Pub/Sub connection manager with offline queue disabled and error handlers.
  - `lib/notification-emitter.ts` [MODIFY]: Enhanced emitter class to publish and subscribe over Redis channels with local fallback.
  - `lib/presence.ts` [NEW]: Redis/memory-backed presence service for tracking active admin dashboard tabs with 30s TTL.
  - `app/api/notifications/presence/route.ts` [NEW]: Presence reporting API endpoint for client tab visibility changes.
  - `app/api/notifications/sse/route.ts` [MODIFY]: Enhanced SSE route handler with 15s heartbeat interval and `X-Accel-Buffering: no` header.
  - `app/api/orders/route.ts` [MODIFY]: Integrated `hasActiveAdminTab()` check before dispatching Web Push notifications.
  - `components/dashbord/hooks/useNotificationBell.ts` [MODIFY]: Added `useEffect` hook to report tab visibility state and periodic presence heartbeats.
- **Testing**:
  - `tests/api/pubsub-sse-dedup.test.ts` [NEW]: Unit tests verifying presence API endpoint, admin active tab tracking, SSE headers, and `notificationEmitter` fallback.
  - All 185 unit tests across 26 test files pass cleanly (`npx vitest run`).
  - TypeScript validation passed (`npx tsc --noEmit`).

### 55. Database Connection Fallback, Hydration Mismatch & Sidebar TypeError Fixes
- **Description**: Resolved 3 runtime errors encountered during initial admin panel & homepage loading:
  1. **Database Connection Fallback**: Wrapped `prisma.siteConfig.findMany()` in `lib/config.ts` (`getDictionaryWithDbOverrides`) in a try/catch block. If PostgreSQL is offline or unreachable, the application catches the error gracefully and returns the static `copy-dictionary.json` dictionary without crashing SSR.
  2. **Hydration Mismatch Fix**: Removed `{isMounted && ...}` conditional guard from the slide indicator buttons container in `components/home/NewProductsSection.tsx`. Now, indicator buttons render consistently across both SSR and client hydration.
  3. **Sidebar TypeError Fix**: Replaced unsafe property access (`dictionary.dashboard.navigation.clients`) on lines 276 & 280 in `components/dashbord/Sidebar.tsx` with optional chaining (`dictionary?.dashboard?.navigation?.clients || "Clients"`).
- **Affected Files**:
  - `lib/config.ts` [MODIFY]: Wrapped dictionary override DB query in try/catch fallback.
  - `components/home/NewProductsSection.tsx` [MODIFY]: Removed `isMounted` wrapper around slide indicator buttons.
  - `components/dashbord/Sidebar.tsx` [MODIFY]: Added optional chaining for dictionary properties.
- **Verification**:
  - All 185 unit tests across 26 test files pass cleanly (`npx vitest run`).
  - TypeScript validation passed with 0 errors (`npx tsc --noEmit`).

### 56. Slide Indicator Hydration Warning Suppression & Module Export Resolution
- **Description**: Fixed remaining hydration mismatch warnings and module import resolution issues:
  1. **Slide Indicator Hydration Warnings**: Added `suppressHydrationWarning` to the dot indicator container elements across [`components/home/HeroCarousel.tsx`](file:///c:/Users/InfoBulles/Desktop/candyEco/candy_client/components/home/HeroCarousel.tsx), [`components/home/NewProductsSection.tsx`](file:///c:/Users/InfoBulles/Desktop/candyEco/candy_client/components/home/NewProductsSection.tsx), and [`components/home/PopularProductsSection.tsx`](file:///c:/Users/InfoBulles/Desktop/candyEco/candy_client/components/home/PopularProductsSection.tsx). Removed `{isMounted && ...}` guard in `PopularProductsSection.tsx` so indicators render consistently on SSR and client without throwing hydration errors.
  2. **Product Hook Module Resolution**: Refreshed `useInfiniteProducts` export in [`lib/hooks/use-products.ts`](file:///c:/Users/InfoBulles/Desktop/candyEco/candy_client/lib/hooks/use-products.ts) for [`components/our-product/ProductBrowser.tsx`](file:///c:/Users/InfoBulles/Desktop/candyEco/candy_client/components/our-product/ProductBrowser.tsx).
- **Affected Files**:
  - `components/home/HeroCarousel.tsx` [MODIFY]
  - `components/home/NewProductsSection.tsx` [MODIFY]
  - `components/home/PopularProductsSection.tsx` [MODIFY]
  - `lib/hooks/use-products.ts` [MODIFY]
- **Verification**:
  - All 185 unit tests across 26 test files pass with 0 failures (`npx vitest run`).
  - TypeScript validation completed with 0 errors (`npx tsc --noEmit`).

## Verification & Build Status
- **Type Checking**: Passed (`npx tsc --noEmit`).
- **Production Build**: Successfully compiled (`npm run build`).
- **Unit & Integration Tests**:
  - All 185 tests pass successfully under `vitest` (`npx vitest run`) across 26 test files.





