# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dozer Protocol is a DEX (Decentralized Exchange) built on Hathor Network using nano contracts (blueprints). The project has recently migrated from individual pool contracts (Uniswap v2 style) to a singleton pool manager contract called `DozerPoolManager` (Uniswap v4 style).

### Architecture

- **Monorepo Structure**: Uses pnpm workspaces with apps, packages, and config directories
- **Frontend**: Next.js apps for swap interface (`apps/swap`) and earning/liquidity management (`apps/earn`)
- **Backend**: tRPC API with TypeScript (`packages/api`)
- **Smart Contracts**: Python nano contracts (`contracts/` directory)
- **Database**: Prisma with PostgreSQL (`packages/database`)
- **UI Components**: Shared UI library (`packages/ui`)

### Key Apps

1. **Swap App** (`apps/swap`): Main trading interface with multi-hop swap support
2. **Earn App** (`apps/earn`): Liquidity provision and farming interface
3. **Root App** (`apps/_root`): Landing page and general information

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

### Database Operations

- **Generate**: `pnpm generate` - Generate Prisma client
- **Database push**: `turbo run db:push` - Push schema changes
- **Database studio**: `cd packages/database && pnpm studio`

### Seeding and Setup

- **Seed all**: `pnpm seed_all` - Deploys contracts and seeds database
- **Contract seeding**: Located in `packages/nanocontracts/src/seed_nc.ts`
- **Database seeding**: Located in `packages/database/src/seed_db.ts`

## Architecture Details

### DozerPoolManager Migration

The project uses a singleton contract pattern where all pools are managed by a single `DozerPoolManager` contract. This is a significant architectural change:

- **Pool Identification**: Pools are identified by pool keys (format: `tokenA/tokenB/fee`)
- **Contract Integration**: All pool operations go through the singleton manager
- **Data Fetching**: Pool and token data fetched directly from blockchain via nano contract state endpoints

### Key Environment Variables

```bash
NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID=<manager_contract_id>
DATABASE_URL=<postgres_connection_string>
```

### Multi-hop Swaps

The system supports multi-hop token swaps through the DozerPoolManager contract:
- Uses `find_best_swap_path()` for route discovery
- Supports up to 3 hops for optimal routing
- Routes displayed visually in the UI

### Token and Pool Management

- **Pool Keys**: Format `tokenA/tokenB/fee` (e.g., "HTR/DZR/100")
- **Fees**: Stored in basis points (100 = 1%)
- **Token Metadata**: Fetched from Hathor node API for real names/symbols
- **Signed Pools**: Only pools signed by the manager are visible in UI

## Code Patterns and Conventions

### API Layer (tRPC)

- **Router Location**: `packages/api/src/router/`
- **Pool Router**: Fetches pools from DozerPoolManager contract
- **Token Router**: Derives tokens from pool data
- **Profile Router**: User positions and account data

### Frontend Patterns

- **Component Structure**: Organized by feature with index exports
- **State Management**: Zustand for global state (`packages/zustand`)
- **UI Components**: Shared components in `packages/ui`
- **Styling**: Tailwind CSS with shared config

### Contract Integration

- **NanoContract Wrapper**: `packages/nanocontracts/src/liquiditypool/index.ts`
- **Amount Handling**: Contract expects amounts in "cents" (multiply by 100)
- **NamedTuple Parsing**: Custom parsers for contract responses in `packages/api/src/utils/namedTupleParsers.ts`

### URL Patterns

- **Token Pages**: `/tokens/[symbol]` (e.g., `/tokens/HTR`)
- **Pool Pages**: `/[symbolId]` (e.g., `/HTR-DZR-1` for HTR/DZR pool with 1% fee)
- **Add Liquidity**: `/[symbolId]/add`
- **Remove Liquidity**: `/[symbolId]/remove`

## Important Notes

### Migration Status

The codebase is in transition from legacy database-driven architecture to blockchain-first approach. Some components may have "Legacy" versions that should be gradually replaced.

### Decimal Handling

- **Hathor Standard**: 2 decimal places for all tokens
- **Contract Format**: Amounts stored as integers (cents)
- **UI Display**: Always format to 2 decimal places maximum
- **Input Validation**: Restrict user input to 2 decimal places

### Development Workflow

1. **Contract Changes**: Update Python contracts in `contracts/`
2. **Seeding**: Run `pnpm seed_all` to deploy and populate
3. **API Updates**: Modify tRPC routers in `packages/api`
4. **Frontend Updates**: Update React components and pages
5. **Testing**: Verify functionality across all apps

### Package Dependencies

The monorepo uses workspace dependencies extensively. When adding features:
- Check existing packages for reusable components
- Follow the established patterns for imports
- Use the shared UI library for consistency

### Performance Considerations

- **Batch Queries**: Use parallel API calls where possible
- **Contract Calls**: Minimize nano contract state calls
- **Caching**: Implement appropriate caching for token metadata
- **Loading States**: Always provide loading feedback for async operations

## Common Tasks

### Adding a New Token

1. Update seed configuration in `seed_config.ts`
2. Run seeding scripts to deploy
3. Update token metadata fetching if needed

### Adding a New Pool

1. Configure pool parameters in seed scripts
2. Deploy via DozerPoolManager contract
3. Verify pool appears in UI after signing

### Debugging Contract Interactions

1. Check contract state via node API
2. Verify NamedTuple parsing in API layer
3. Validate amount conversions (decimal ↔ cents)
4. Test with single-hop before multi-hop scenarios

### Troubleshooting Build Issues

1. Clear turbo cache: `pnpm clean`
2. Regenerate database client: `pnpm generate`
3. Check environment variables are set
4. Verify all workspace dependencies are installed