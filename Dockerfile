# Multi-stage Dockerfile for Next.js standalone application

# -----------------------------------------------------------
# Stage 1: Base image
# -----------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# -----------------------------------------------------------
# Stage 2: Dependencies (deps)
# -----------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy package management files and prisma schema for pre-install & code generation
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies cleanly including devDependencies needed for build
RUN npm ci

# -----------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables and build args for Next.js inlining
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client and build the Next.js standalone app
RUN npx prisma generate
RUN npm run build

# -----------------------------------------------------------
# Stage 4: Lightweight Runner
# -----------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Add runtime dependencies (Prisma query engine requires OpenSSL on Alpine)
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root system group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public directory and standalone output artifacts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy Prisma CLI and configuration dependencies from deps to enable migrations at runtime
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Symlink prisma executable to PATH
RUN ln -sf /app/node_modules/prisma/build/index.js /usr/local/bin/prisma

# Switch to the non-root user
USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
