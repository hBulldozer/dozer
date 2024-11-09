# Production image, copy all the files and run next
FROM node:20-alpine AS base

# Root app production image
FROM base AS root-runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=9000
ENV HOSTNAME="0.0.0.0"

# Create app directory
RUN mkdir -p /app/apps/_root && chown -R nextjs:nodejs /app

# Copy built app
COPY --chown=nextjs:nodejs ./apps/_root/.next/standalone/ ./
COPY --chown=nextjs:nodejs ./apps/_root/.next/static ./apps/_root/.next/static
COPY --chown=nextjs:nodejs ./apps/_root/public ./apps/_root/public

USER nextjs

CMD ["node", "apps/_root/server.js"]

# Swap app production image
FROM base AS swap-runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=9001
ENV HOSTNAME="0.0.0.0"

RUN mkdir -p /app/apps/swap && chown -R nextjs:nodejs /app

COPY --chown=nextjs:nodejs ./apps/swap/.next/standalone/ ./
COPY --chown=nextjs:nodejs ./apps/swap/.next/static ./apps/swap/.next/static
COPY --chown=nextjs:nodejs ./apps/swap/public ./apps/swap/public

USER nextjs

CMD ["node", "apps/swap/server.js"]

# Earn app production image
FROM base AS earn-runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=9002
ENV HOSTNAME="0.0.0.0"

RUN mkdir -p /app/apps/earn && chown -R nextjs:nodejs /app

COPY --chown=nextjs:nodejs ./apps/earn/.next/standalone/ ./
COPY --chown=nextjs:nodejs ./apps/earn/.next/static ./apps/earn/.next/static
COPY --chown=nextjs:nodejs ./apps/earn/public ./apps/earn/public

USER nextjs

CMD ["node", "apps/earn/server.js"]