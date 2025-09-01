#dd  GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

Dozer Protocol is a DEX (Decentralized Exchange) built on Hathor Network using nano contracts (blueprints). The project has recently migrated from individual pool contracts (Uniswap v2 style) to a singleton pool manager contract called `DozerPoolManager` (Uniswap v4 style).

### Architecture

- **Monorepo Structure**: Uses pnpm workspaces with apps, packages, and config directories
- **Frontend**: Next.js apps for swap interface (`apps/swap`) and earning/liquidity management (`apps/earn`)
- **Backend**: tRPC API with TypeScript (`packages/api`)
- **Smart Contracts**: Python nano contracts (`contracts/` directory)
- **Database**: Prisma with PostgreSQL (`packages/database`)
- **UI Components**: Shared UI library (`packages/ui`)

## Development Commands

### Build System

- **Full build**: `pnpm build` - Builds entire monorepo using Turbo
- **Development**: `pnpm dev` - Starts all apps in development mode
- **Individual app dev**: `pnpm dev --filter=swap` or `pnpm dev --filter=earn`

### Testing and Validation

- **Lint**: `pnpm lint` - ESLint for all packages
- **Type checking**: `turbo run check` - TypeScript validation
- **Format**: `pnpm format` - Prettier formatting
- **Testing**: `pnpm test` - Jest test runner

## Key Files

- `contracts/dozer_pool_manager.py`: The main singleton contract for managing liquidity pools.
- `packages/api/src/router/pool.ts`: The tRPC router for fetching pool data.
- `apps/swap/src/pages/index.tsx`: The main page for the swap interface.
- `apps/earn/src/pages/index.tsx`: The main page for the earn/liquidity interface.
- `seed_all.ts`: The script for seeding the database and deploying contracts.
