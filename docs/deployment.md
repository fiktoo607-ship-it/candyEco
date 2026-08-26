# Deployment Guide

## Overview

This guide outlines deployment procedures for CandyEco (`candy_client`). The application can be deployed to modern cloud hosting platforms such as Vercel, AWS Amplify, Docker containers, or standalone Linux VMs (Ubuntu with Node.js & PM2).

---

## Environment Prerequisites

- **Node.js**: v20.x or higher LTS
- **Package Manager**: npm v10+
- **Database**: PostgreSQL v14+ (hosted on Supabase, Neon, AWS RDS, or self-hosted)
- **Cache**: Redis v6+ (hosted on Upstash, Redis Cloud, or self-hosted)
- **Cloudinary**: Cloudinary account credentials for media storage
- **SMTP**: Email provider configuration for Nodemailer notifications

---

## Environment Variables Configuration

Copy `.env.example` to `.env` in production and configure the following variables:

```env
# Application URLs
NEXTAUTH_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database Connection
DATABASE_URL=postgresql://user:password@db-host:5432/candyeco?sslmode=require

# Authentication Secrets
NEXTAUTH_SECRET=your-super-secret-random-32-char-string
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
ADMIN_EMAILS=admin@candyeco.com,owner@candyeco.com

# Cloudinary Media Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Redis Cache Connection
REDIS_URL=redis://default:password@redis-host:6379

# Web Push VAPID Credentials
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-vapid-key
VAPID_PRIVATE_KEY=your-private-vapid-key
VAPID_SUBJECT=mailto:admin@candyeco.com

# Email SMTP Credentials
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@candyeco.com
SMTP_PASS=your-smtp-app-password
```

---

## Deployment Pipelines

### Option A: Vercel Deployment (Recommended)

1. Connect the GitHub repository `charif1206/candy_eco` to Vercel.
2. Set the root directory to `candy_client` (if in a monorepo).
3. Environment Variables: Input all `.env` keys in the Vercel dashboard.
4. **Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Prisma DB Migrations are automatically run via `postinstall` script:
   - `package.json`: `"postinstall": "prisma generate"`
   - Add a deployment hook or run `npx prisma migrate deploy` in build command:
     `npx prisma migrate deploy && node ./scripts/next-with-swc-lockfile-shim.cjs build`

---

### Option B: Standalone Node.js & PM2 Server Deployment

1. **Clone repository & install dependencies**:
   ```bash
   git clone https://github.com/charif1206/candy_eco.git
   cd candy_client
   npm ci
   ```

2. **Apply Database Migrations & Ensure Tag Indices**:
   ```bash
   npx prisma migrate deploy
   npm run db:ensure-tags
   ```

3. **Build Production Application**:
   ```bash
   npm run build
   ```

4. **Start Application Process with PM2**:
   ```bash
   npm install -g pm2
   pm2 start npm --name "candy-client" -- run start
   pm2 save
   pm2 startup
   ```

5. **Nginx Reverse Proxy Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Post-Deployment Verification Checklist

- [ ] Execute `curl -I https://your-domain.com/api/products` and verify `200 OK`.
- [ ] Log in with an admin account and verify `/dashboard` access.
- [ ] Test product image upload via Cloudinary.
- [ ] Test placing a guest order and verify order record in database.
- [ ] Verify Web Push subscription prompt and background push delivery.
