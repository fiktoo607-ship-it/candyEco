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

# Install dependencies cleanly including devDependencies needed for build
RUN npm ci

# -----------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
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

# Switch to the non-root user
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
