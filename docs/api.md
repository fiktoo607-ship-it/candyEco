# API Specification & Endpoints Guide

## Overview

CandyEco provides RESTful API endpoints using Next.js App Router Route Handlers. All API endpoints return JSON payloads and utilize standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `500 Server Error`).

---

## Authentication Endpoints (`/api/auth/*`)

Managed by NextAuth.js handler (`app/api/auth/[...nextauth]/route.ts`).

- `POST /api/auth/signin`: Authenticate credentials (phone + password) or initiate OAuth flow.
- `GET /api/auth/session`: Fetch active user JWT session data.
- `POST /api/auth/signout`: Terminate active session token.

---

## Products API (`/api/products`)

### `GET /api/products`
Retrieves products catalog with pagination, title search, and category filters.

- **Query Parameters**:
  - `page` (number, default: 1): Current page number.
  - `limit` (number, default: 10): Items per page.
  - `search` (string, optional): Title substring filter.
  - `category` (string, optional): Category slug filter.
  - `tag` (string, optional): Tag name filter.
  - `dashboard` (boolean, optional): Set to `true` by authenticated admins to include rating stats.
- **Response `200 OK`**:
```json
{
  "products": [
    {
      "id": "c1a82...",
      "title": "Chocolat Artisanal",
      "slug": "chocolat-artisanal",
      "price": "$12.00",
      "category": "chocolates",
      "imageUrl": "https://res.cloudinary.com/...",
      "description": "Premium dark chocolate.",
      "tags": ["chocolate", "sweet"]
    }
  ],
  "hasMore": true,
  "total": 24
}
```

### `POST /api/products` (Admin Only)
Creates a new product catalog item.

### `GET /api/products/[id]`
Retrieves product details by ID or slug.

### `PUT /api/products/[id]` (Admin Only)
Updates product attributes, price, state, or tags.

### `DELETE /api/products/[id]` (Admin Only)
Deletes a product item from database.

### `POST /api/products/[id]` (Customer Rating)
Submits a rating score (1-5) for a purchased product.
- **Payload**: `{ "rating": 5 }`

### `GET /api/products/[id]/can-rate`
Checks if current user/guest is eligible to submit a product rating based on verified order history.

---

## Tags API (`/api/tags`)

### `GET /api/tags`
Fetches tags list with optional search query for autocomplete suggestions. Only returns tags linked to at least one product.
- **Query Parameters**: `q` (string, optional tag name query)
- **Response `200 OK`**:
```json
[
  { "id": "t1", "name": "chocolate" },
  { "id": "t2", "name": "almond" }
]
```

---

## Carousel Slides API (`/api/carousel-slides`)

- `GET /api/carousel-slides`: Retrieves dynamic homepage hero slides ordered by display priority.
- `POST /api/carousel-slides` (Admin Only): Creates a custom slide.
- `PUT /api/carousel-slides/[id]` (Admin Only): Updates slide order, image, or link.
- `DELETE /api/carousel-slides/[id]` (Admin Only): Removes a slide.

---

## Orders API (`/api/orders`)

- `GET /api/orders`: Admin retrieves all store orders; standard user retrieves their personal order history.
- `POST /api/orders`: Creates a new customer checkout order.
  - **Payload**:
```json
{
  "customerName": "Alice Dupont",
  "customerPhone": "+212600000000",
  "customerEmail": "alice@example.com",
  "shippingAddress": "123 Rue principal, Casablanca",
  "deliveryMethod": "Home Delivery",
  "items": [
    { "productId": "c1a82...", "quantity": 2 }
  ]
}
```
- `GET /api/orders/[id]`: Retrieves single order breakdown and status.
- `PUT /api/orders/[id]` (Admin Only): Updates order status (`pending` -> `processing` -> `completed` / `cancelled`).

---

## Content & Admin Config Endpoints

- `GET/PUT /api/config`: Reads and updates key-value app settings (e.g. `carousel_max_slides`).
- `POST /api/upload` (Admin Only): Accepts Multipart Form File data and uploads image to Cloudinary, returning image URL.
- `GET/POST /api/delivery-methods`: Retrieves and updates available shipping delivery pricing options.
- `POST /api/notifications/push`: Registers browser push notification subscription tokens.
