# Specify base image
FROM node:20-alpine AS base

# Install required system dependencies
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable pnpm

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy all source files and install deps
COPY . .

# Mount and use secret during install
RUN --mount=type=secret,id=env,target=/app/.env \
    pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy all source files and install deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Mount and use secret during build
RUN --mount=type=secret,id=env,target=/app/.env \
    pnpm build

# Root app production image
FROM base AS root-runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 9000
ENV HOSTNAME "0.0.0.0"

# Create app directory
RUN mkdir -p /app/apps/_root && chown -R nextjs:nodejs /app

# Copy standalone build and required files for root app
COPY --from=builder --chown=nextjs:nodejs /app/apps/_root/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/_root/.next/static ./apps/_root/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/_root/public ./apps/_root/public

# Create a wrapper script to replace environment variables in the server code
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'sed -i "s|http://localhost:9000|$ROOT_URL|g" /app/apps/_root/server.js' >> /app/start.sh && \
    echo 'sed -i "s|http://localhost:9001|$SWAP_URL|g" /app/apps/_root/server.js' >> /app/start.sh && \
    echo 'sed -i "s|http://localhost:9002|$EARN_URL|g" /app/apps/_root/server.js' >> /app/start.sh && \
    echo 'exec node apps/_root/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

USER nextjs

CMD ["/app/start.sh"]

# Swap app production image
FROM base AS swap-runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 9001
ENV HOSTNAME "0.0.0.0"

RUN mkdir -p /app/apps/swap && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/apps/swap/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/swap/.next/static ./apps/swap/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/swap/public ./apps/swap/public

USER nextjs

CMD ["node", "apps/swap/server.js"]

# Earn app production image
FROM base AS earn-runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 9002
ENV HOSTNAME "0.0.0.0"

RUN mkdir -p /app/apps/earn && chown -R nextjs:nodejs /app

COPY --from=builder --chown=nextjs:nodejs /app/apps/earn/.next/standalone/ ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/earn/.next/static ./apps/earn/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/earn/public ./apps/earn/public

USER nextjs

CMD ["node", "apps/earn/server.js"]