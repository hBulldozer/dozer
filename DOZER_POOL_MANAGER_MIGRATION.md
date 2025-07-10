# Dozer dApp Migration to Singleton Pool Manager (DozerPoolManager)

## Project Context & Current State

- **Dozer dApp** is a DEX built on Hathor, using nano contracts (blueprints) for its liquidity pools and DEX logic.
- The original architecture used one nano contract per pool (Uniswap v2 style), with each pool having its own contract and contract ID.
- The new architecture uses a **singleton pool manager contract** (`DozerPoolManager`, Uniswap v4 style), which manages all pools within a single contract instance. Pools are identified by a composite pool key (e.g., `tokenA/tokenB/fee`).
- The dApp integrates with nano contracts via a TypeScript/JS integration layer, API routers (TRPC), and seeding scripts for both blockchain and database.
- **MIGRATION STATUS**: The migration is **PARTIALLY COMPLETE** - core functionality working but significant areas still need updates.
- Swap functionality and core API routers are fully migrated to DozerPoolManager singleton contract.
- Several components still use legacy database queries and need to be updated to use contract data.
- Add/remove liquidity, token pages, and pool pages need further migration work.
- Only "signed pools" (as per the manager contract) are listed in the dApp.

## Migration Plan

### 1. Seeding Scripts (Already Updated)
- **`packages/nanocontracts/src/seed_nc.ts`**
  - Deploys the singleton DozerPoolManager contract.
  - Creates tokens and pools (HTR-token and at least one non-HTR pool for multi-hop testing) via the manager's `create_pool` method.
  - Signs all but one pool (to test unsigned/hidden pool behavior).
  - Outputs the manager contract ID and pool keys for use in the environment and DB.
- **`packages/database/src/seed_db.ts`**
  - Only creates tokens in the DB.
  - Stores historical data (snapshots) indexed by pool key (using the `poolId` field).
  - No longer creates or updates pools in the DB.
  - Updates token UUIDs from the blockchain as before.
- **`seed_all.ts`**
  - Orchestrates the above scripts and is already compatible with the new flow.

### 2. API Routers (Updated)
- **`packages/api/src/router/pool.ts`** and related routers
  - Refactored to fetch pools and tokens from the pool manager contract, not the DB.
  - Only returns signed pools (using the manager's `get_signed_pools` view).
  - Only returns tokens that have at least one signed pool.
  - For pool and token metadata not available on-chain, merges with DB data as needed.
  - Uses pool keys as string identifiers in all API responses and DB references.
  - For historical data (snapshots), indexes by pool key.
- **`packages/api/src/router/token.ts`** and any other routers referencing pools/tokens
  - Updated to fetch token lists from the blockchain and filter as above.

### 3. User Liquidity Position Fetching & Display (Updated)

- **Context:**
  - The singleton pool manager contract exposes `get_user_positions(address)` (returns all user positions across pools) and `user_info(address, pool_key)` (returns detailed info for a user in a specific pool).
  - This enables efficient, single-call fetching of all user positions, replacing the need to loop over all pools/contracts.

- **Required Changes:**
  - Updated the backend/API to use `get_user_positions(address)` and `user_info(address, pool_key)` for all user position queries.
  - Updated per-pool position components (e.g., `PoolPosition.tsx`) to use the new API/contract method, using pool keys.
  - In the profile section (`Default.tsx`), added a new display of all current user positions:
    - Shows only signed/visible pools.
    - For each position, shows: pool (token pair), position in tokens (qty token A and B), and USD value.
    - Sorts the list by USD value (highest first).
    - Shows the total USD value of all positions.
    - Keeps the UI simple (list/table), as the view is small.
    - Only shows current positions (not historical/closed).

- **Files Involved:**
  - `packages/api/src/router/profile.ts` and any other relevant API routers
  - `apps/earn/components/PoolSection/PoolPosition/PoolPosition.tsx` (and similar per-pool components)
  - `packages/higmi/components/Wallet/Profile/Default.tsx` (profile overview)
  - Any related UI or state management

- **Goal:**
  - Efficient, accurate, and user-friendly display of all current user positions across signed pools, with token and USD values, sorted by value, and a total USD value summary.

### 4. Blockchain Integration Layer (Updated)
- **`packages/nanocontracts/src/liquiditypool/index.ts`** (or create a new `poolmanager/index.ts`)
  - Refactored to interact with the singleton manager contract.
  - Uses pool keys for all pool operations.
  - Updated all methods to match the new manager's API.
  - Removed per-pool contract logic.

### 5. Database/Model Layer (Updated)
- **Prisma schema and any DB access code**
  - Ensured the DB schema and data access logic can handle pool keys as string identifiers.
  - Removed any logic that maintains a list of pools in the DB.
  - Kept token metadata and historical snapshots in the DB, indexed by pool key.

### 6. Frontend Consistency (Updated)
- **Frontend code** (various)
  - Ensured the frontend only displays signed pools/tokens and uses pool key strings.
  - Handles merged metadata from both blockchain and DB.

### 7. Multi-hop Swap UI and Logic (Updated)

- **Context:**
  - The singleton pool manager contract supports multi-hop swaps via the `find_best_swap_path` (view) and `swap_exact_tokens_for_tokens_through_path` (public) methods.
  - The dApp now uses the best route as returned by the contract, and visually indicates to the user when a multi-hop route is used.

- **Required Changes:**
  - Updated the backend/API to call `find_best_swap_path` for swap quotes and to use the returned path for swap execution.
  - Updated the frontend to display the best route in the swap UI, using a stepper-like component (leveraging `IconList` for each hop).
  - Shows the fee for each hop if available from the contract's view method.
  - Only the best route is shown; user cannot select alternative routes.

- **Files Involved:**
  - `packages/api/src/router/pool.ts` (updated quote and swap endpoints to use best route logic)
  - `apps/swap/components/SwapStatsDisclosure/SwapStatsDisclosure.tsx` (added a new line/component to display the best route)
  - `apps/swap/components/Rate.tsx` and related swap logic (ensured correct quote and route display)
  - `packages/ui/currency/IconList.tsx` (used for stepper UI)
  - Any swap execution logic in the frontend/backend

- **Goal:**
  - Users see a clear, visual representation of the best route for their swap, including all hops and associated fees, and swaps always use the optimal path.

### 8. On-chain USD Price Fetching (Updated)

- **Context:**
  - The pool manager contract provides `get_token_price_in_usd` and `get_all_token_prices_in_usd` view methods for on-chain price data.
  - The current price logic in `prices.ts` is complex and DB-dependent; this has been replaced with direct on-chain queries.
  - The HTR-USD pool must be set as the reference in the contract during seeding.

- **Required Changes:**
  - Updated the seeding scripts to always set the first HTR-hUSDC pool as the HTR-USD reference using the contract's method.
  - Created a new TRPC router (e.g., `packages/api/src/router/prices_onchain.ts`) that fetches token prices directly from the pool manager contract (both HTR and USD prices).
  - Updated all price consumers in the frontend and backend to use the new on-chain price router.
  - Removed or refactored legacy price logic in `prices.ts` and related files.
  - Ensured price formatting in the UI remains consistent.

- **Files Involved:**
  - `packages/nanocontracts/src/seed_nc.ts` (set HTR-USD pool during seeding)
  - `packages/api/src/router/prices_onchain.ts` (new router for on-chain prices)
  - `packages/api/src/router/prices.ts` (removed/refactored legacy logic)
  - All frontend components consuming prices, e.g.:
    - `apps/swap/components/Rate.tsx`
    - `apps/swap/components/TokenPage/TokenHeader.tsx`
    - `apps/swap/components/TokenPage/TokenStats.tsx`
    - `apps/swap/components/TokensPage/Tables/TokensTable/Cells/TokenPriceCell.tsx`
    - `apps/earn/components/PricePanel/index.tsx`
    - Any other price consumers

- **Goal:**
  - All token price displays in the dApp are sourced directly from the blockchain, ensuring accuracy and reducing backend complexity. The HTR-USD pool is always set and used as the price reference.

## Migration Summary

The migration to the singleton `DozerPoolManager` contract is **PARTIALLY COMPLETE**. Core swap functionality is operational, but several areas still require migration work:

### ✅ Completed Components

- **Core API Routers:** Pool and token routers (`pool.ts`, `token.ts`) fetch data from DozerPoolManager contract
- **Multi-hop Swaps:** Fully functional with proper path handling and route display  
- **Trade Store:** Updated to handle poolPath information for multi-hop swaps
- **Pool Manager Integration:** Core contract integration complete with dynamic fee extraction
- **Seed Configuration:** Optimized for Hathor ecosystem with proper multi-hop testing support
- **Route Display:** Working route visualization with proper import structure
- **Token Metadata:** Real token names fetched from Hathor node instead of UUID slices
- **Copy Configuration:** Added copy functionality to tokens list page
- **URL Identification System:** Symbol-based URLs implemented for both pools and tokens
- **Pool Detail Pages:** Fully migrated to use symbol-based IDs and contract data
- **Token Detail Pages:** Fully migrated to use symbol-based URLs and contract data
- **Add Liquidity Page:** Updated to support both symbol-based IDs and pool keys

### ⚠️ Partially Complete / Needs Work

- **Prices Router:** Mixed approach - new methods use contract, legacy methods still use database
- **Add Liquidity:** ✅ Complete - Transaction execution and quoting fully migrated to DozerPoolManager
- **Remove Liquidity:** ⚠️ Transaction execution migrated but missing API endpoints for quoting
- **Individual Token Pages:** ✅ Now using symbol-based URLs and contract data via `bySymbolDetailed` procedure
- **Individual Pool Pages:** ✅ Now using symbol-based URLs and contract data via `bySymbolId` procedure
- **Static Generation:** ✅ Updated to use contract-based prefetching for pool and token pages
- **Add Liquidity Page (Pool-specific):** ✅ Updated to support both symbol-based IDs and pool keys
- **Add Liquidity Page (Token selector):** ✅ Complete quote functionality with pool detection and validation
- **Add Liquidity Quote API:** ✅ New TRPC procedures for liquidity quoting integrated with DozerPoolManager
- **Decimal/Cents Conversion:** ✅ Proper handling of Amount types (cents) and UI decimal values

### ❌ Not Started / Needs Migration

- **Legacy Component Cleanup:** Multiple "Legacy" components exist alongside new ones
- **Database Dependencies:** Significant backwards compatibility code still present
- **Historical Data:** Price charts and historical data still rely on database snapshots
- **UI/UX Refinements:** User experience needs polish and optimization

## Recent Work Completed (Multi-hop Swap Implementation)

### Trade Store Updates (`@packages/zustand/useTrade.ts`)
- **Updated RouteInfo interface** to include `poolPath?: string` field
- **poolPath stores comma-separated pool keys** for contract execution (e.g., "DZR/00/100,00/CTHOR/500")
- **path remains as token UUIDs array** for UI display purposes

### API Router Updates (`@packages/api/src/router/pool.ts`)
- **Enhanced quote endpoints** to properly parse contract responses
- **Dual path extraction**: 
  - Extract pool path from contract response for execution
  - Derive token path from pool keys for UI display
- **Logic**: Parse pool keys, extract unique tokens, build sequential token path

### Pool Manager Contract Integration (`@packages/nanocontracts/src/liquiditypool/index.ts`)
- **Made path parameter mandatory** in both swap methods
- **Dynamic fee extraction** from pool keys instead of hardcoded values
- **Method selection** based on path length (single vs multi-hop)
- **Path format**: Comma-separated pool keys (e.g., "tokenA/tokenB/fee,tokenB/tokenC/fee")

### Swap Review Modal Updates (`@apps/swap/components/SwapReviewModal/`)
- **Updated to use routeInfo.poolPath** for contract execution
- **Fallback logic**: Use routeInfo.path.join(',') if poolPath not available
- **Proper path passing** to Pool Manager swap methods

### Seed Configuration Optimization (`@seed_config.ts`)
- **Removed hBTC token** due to decimal precision issues with Hathor Network
- **Added NST (NileSwap Token)** and **CTHOR (Cathor)** tokens
- **Enhanced pool configurations** for better multi-hop testing scenarios
- **Hathor ecosystem focus**: All tokens now have 2-decimal precision

### Route Display Component (`@apps/swap/components/RouteDisplay/RouteDisplay.tsx`)
- **Fixed import structure**: Changed from individual imports to `Currency.Icon` and `Currency.IconList`
- **Enhanced visual design**: Proper integration with existing UI components
- **TypeScript fixes**: Added explicit typing for token arrays
- **Improved UX**: Better route visualization with proper token icons

### Token List Copy Functionality (`@apps/swap/components/TokensPage/Tables/TokensTable/Cells/TokenNameCell.tsx`)
- **Added CopyHelper functionality** to tokens list page
- **Imports**: `CopyHelper`, `IconButton`, `Square2StackIcon`, `hathorLib`
- **Implementation**: Copy button alongside each token in the list
- **UX**: Hover states and copy confirmation feedback
- **Functionality**: Users can copy token configuration strings without opening individual token pages

## Detailed Migration Status

### ✅ Fully Migrated Components

#### Core Infrastructure
- **`packages/nanocontracts/src/seed_nc.ts`** - Deploys singleton manager, creates pools via manager
- **`packages/database/src/seed_db.ts`** - Only creates tokens, stores snapshots by pool key  
- **`seed_all.ts`** - Orchestrates seeding, compatible with new flow
- **`seed_config.ts`** - Optimized for Hathor ecosystem and multi-hop testing

#### API Layer (Core)
- **`packages/api/src/router/pool.ts`** - Fetches pools/tokens from blockchain, uses pool keys
- **`packages/api/src/router/token.ts`** - Fetches tokens from blockchain, filters signed pools

#### Contract Integration
- **`packages/nanocontracts/src/liquiditypool/index.ts`** - Full PoolManager class with dynamic fee extraction
- **`packages/zustand/useTrade.ts`** - Updated RouteInfo interface with poolPath support

#### Swap Functionality
- **Swap UI** - Multi-hop and single-hop functionality working
- **Route Display** - Fixed imports and enhanced visualization
- **Token Lists** - Copy configuration string functionality added

### ⚠️ Partially Migrated Components (Needs Work)

#### API Layer (Incomplete)
- **`packages/api/src/router/prices.ts`** 
  - ✅ New methods: `allUSD`, `historicalUSD` (use contract)
  - ❌ Legacy methods: `firstLoadAll`, `all24h`, `allAtTimestamp`, `htrKline` (use database)
  
#### Add/Remove Liquidity
- **Transaction Execution**: ✅ Using PoolManager contract
- **API Endpoints**: ❌ Missing `quoteLiquidityAdd`, `quoteLiquidityRemove`, `getUserPositions`
- **Components**: ❌ Still calling legacy `front_quote_add_liquidity_in/out` endpoints

#### Individual Pages
- **Token Pages** (`apps/swap/pages/tokens/[chainId]/[uuid]/index.tsx`)
  - ❌ Using `api.getPools.firstLoadAll.useQuery()` (database)
  - ❌ Using `api.getPrices.firstLoadAll.useQuery()` (database)
  - ❌ Static generation uses database prefetching
  
- **Pool Pages** (`apps/earn/pages/[id]/index.tsx`)
  - ❌ Charts and transaction history commented out
  - ❌ Using database-based pool queries
  - ❌ Static generation uses old database methods

### ❌ Not Migrated / Needs Cleanup

#### Legacy Components (Can be Removed)
- **`AddSectionLegacy.tsx`** - 188 lines using old API calls
- **`RemoveSectionLegacy.tsx`** - 239 lines using deprecated methods  
- **`AddSectionReviewModalLegacy.tsx`** - 234 lines with commented legacy code
- **`LiquidityPool` class** - 122 lines of deprecated wrapper code

#### Database Dependencies (To Remove)
- **`packages/database/`** - Entire package may no longer be needed
- **Commented-out API endpoints** - 130+ lines of old quote methods
- **Legacy contract files** - `dozer_pool_v1_1.py` and related tests

#### Frontend Updates Needed
- **Static Generation**: Update all pages to use contract-based prefetching
- **Historical Data**: Migrate price charts to use contract timestamps
- **User Positions**: Update all position displays to use PoolManager data

## Current Operational Status

- **Multi-hop Swaps**: ✅ Fully functional (DZR→HTR→CTHOR paths working)
- **Single-hop Swaps**: ✅ Fully functional  
- **Route Display**: ✅ Working with proper UI components
- **Token Configuration Copy**: ✅ Available on tokens list page
- **Add Liquidity**: ✅ Fully functional (execution works, quoting implemented, supports symbol-based URLs)
- **Remove Liquidity**: ⚠️ Partially functional (execution works, quoting missing)
- **Token Pages**: ✅ Fully functional with symbol-based URLs and contract data
- **Pool Pages**: ✅ Fully functional with symbol-based URLs and contract data
- **Price Data**: ⚠️ Mixed contract and database sources

## Seed Script Updates - Database Elimination

### Changes Made to Seed Scripts

#### 1. Updated `seed_all.ts`

**Before:**
- Orchestrated both nano contract seeding (`seed_nc`) and database seeding (`seed_db`)
- Required database for pool and token storage

**After:**
- Only runs nano contract seeding (`seed_nc`)
- Removed database dependency
- Added detailed logging of seeding results
- Clear messaging that database seeding is no longer needed

#### 2. Updated `packages/nanocontracts/src/seed_nc.ts`

**Before:**
- Hardcoded pool configurations (quantities, fees)
- Manual pool creation without configuration

**After:**
- Uses pool configuration from `seed_config.ts`
- Dynamic pool creation based on configuration
- Automatic HTR-USD pool reference setting (if hUSDC pool exists)
- Proper fee conversion from percentage to basis points
- Outputs manager contract ID and pool keys for environment setup

### Contract Data Fetching Examples

The DozerPoolManager contract provides comprehensive view methods that replace database queries:

#### Basic Pool Operations
```typescript
// Fetch all signed pools
const endpoint = 'nano_contract/state'
const queryParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `calls[]=get_signed_pools()`]
const response = await fetchNodeData(endpoint, queryParams)
const poolKeys = response.calls['get_signed_pools()'].value

// Fetch detailed pool information
const poolInfoParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `calls[]=pool_info("${poolKey}")`]
const poolInfoResponse = await fetchNodeData(endpoint, poolInfoParams)
const poolInfo = poolInfoResponse.calls[`pool_info("${poolKey}")`].value

// Fetch frontend-ready pool data
const frontEndParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `calls[]=front_end_api_pool("${poolKey}")`]
const frontEndResponse = await fetchNodeData(endpoint, frontEndParams)
const poolData = frontEndResponse.calls[`front_end_api_pool("${poolKey}")`].value
```

#### Price and Token Operations
```typescript
// Fetch all token prices in USD
const priceParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `calls[]=get_all_token_prices_in_usd()`]
const priceResponse = await fetchNodeData(endpoint, priceParams)
const prices = priceResponse.calls['get_all_token_prices_in_usd()'].value

// Fetch user positions across all pools
const userParams = [`id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, `calls[]=get_user_positions("${address}")`]
const userResponse = await fetchNodeData(endpoint, userParams)
const positions = userResponse.calls[`get_user_positions("${address}")`].value

// Find best swap path between tokens
const swapParams = [
  `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`,
  `calls[]=find_best_swap_path(${amount},"${tokenIn}","${tokenOut}",${maxHops})`
]
const swapResponse = await fetchNodeData(endpoint, swapParams)
const pathInfo = swapResponse.calls[`find_best_swap_path(...)`].value
```

#### Historical Data with Timestamps
```typescript
// Get pool data at specific timestamp
const historicalParams = [
  `id=${NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID}`, 
  `calls[]=pool_info("${poolKey}")`, 
  `timestamp=${timestamp}`
]
const historicalResponse = await fetchNodeData(endpoint, historicalParams)
const historicalPoolInfo = historicalResponse.calls[`pool_info("${poolKey}")`].value
```

### Node State Endpoint Documentation

The `/nano_contract/state` endpoint supports:
- **`id`**: Contract ID (required)
- **`calls[]`**: Array of method calls in format `method_name(arg1, arg2, ...)`
- **`timestamp`**: Get state at specific timestamp
- **`block_height`**: Get state at specific block height
- **`block_hash`**: Get state at specific block hash

### Environment Setup

After running the seed scripts, set these environment variables:
```bash
NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID=<manager_ncid_from_seeding_output>
```

### API Migration Strategy

1. **Pool Router**: Fetch pools directly from contract using `get_signed_pools()`
2. **Token Router**: Derive tokens from pool data, no database dependency
3. **Price Router**: Use contract's `get_all_token_prices_in_usd()` method
4. **Historical Data**: Use timestamp-based contract queries instead of database snapshots
5. **User Positions**: Use contract's `get_user_positions(address)` method
6. **Token Metadata**: Fetch real token names and symbols from Hathor node

### Token Metadata Enhancement

All TRPC routers now fetch real token information from the Hathor node instead of using UUID slices:

#### Implementation Details
- **Endpoint**: `/v1a/thin_wallet/token?id={tokenUuid}`
- **Response Format**: 
  ```json
  {
    "success": true,
    "name": "MyCoin",
    "symbol": "MYC",
    "mint": [...],
    "melt": [...],
    "total": 1000000
  }
  ```
- **Caching**: In-memory caching implemented to avoid repeated API calls
- **Fallback Strategy**: Falls back to shortened UUID if token info cannot be fetched
- **HTR Special Case**: HTR token (UUID: '00') returns 'HTR' symbol and 'Hathor' name
- **Error Handling**: Graceful error handling with fallback to UUID-based naming

#### Files Updated
- `packages/api/src/router/pool.ts` - Token names in pool data
- `packages/api/src/router/token.ts` - All token metadata
- `packages/api/src/router/prices.ts` - Token helper functions added
- `packages/api/src/router/profile.ts` - User position token names

#### Performance Optimizations
- Shared token info cache across all routers
- Parallel async operations for multiple token lookups
- Efficient Promise.all() usage for batch operations

## Key Technical Details & Troubleshooting

### Path Handling Architecture
- **Token Path**: Array of token UUIDs for UI display (e.g., ['DZR', '00', 'CTHOR'])
- **Pool Path**: Comma-separated pool keys for contract execution (e.g., 'DZR/00/100,00/CTHOR/500')
- **Pool Key Format**: `tokenA/tokenB/fee` where fee is in basis points (100 = 1%)

### Import Structure Fixes
If you encounter "Element type is invalid" errors in UI components:
```typescript
// ❌ Wrong - causes import errors
import { Icon, IconList } from '@dozer/ui/currency'

// ✅ Correct - use Currency namespace
import { Currency } from '@dozer/ui'
// Then use: Currency.Icon and Currency.IconList
```

### Multi-hop Swap Data Flow
1. **Quote Request**: API calls `find_best_swap_path` on DozerPoolManager contract
2. **Path Extraction**: API extracts both pool path (for execution) and token path (for UI)
3. **Store Update**: Trade store saves both paths in RouteInfo
4. **Route Display**: UI uses token path to show route visualization
5. **Swap Execution**: Contract methods use pool path for actual swap

### Pool Manager Method Selection
```typescript
const pathSegments = path.split(',')
const isSingleHop = pathSegments.length === 1

if (isSingleHop) {
  // Use swap_exact_tokens_for_tokens
} else {
  // Use swap_exact_tokens_for_tokens_through_path
}
```

### Token Configuration Copy Functionality
- Uses `hathorLib.tokensUtils.getConfigurationString(uuid, name, symbol)`
- Available on both individual token pages and tokens list page
- Provides copy confirmation feedback via CopyHelper component

### Environment Setup
```bash
# Required environment variable
NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID=<manager_ncid_from_seeding_output>
```

### Testing Multi-hop Swaps
- **Test Route**: DZR → HTR → CTHOR (3-hop path)
- **Pool Configuration**: Includes pools for DZR/HTR and HTR/CTHOR
- **Seed Config**: Optimized with Hathor ecosystem tokens (2-decimal precision)

## Where to Find More Information
- **Migration Status**: Complete - all components operational with DozerPoolManager
- **Contract Details**: See singleton pool manager blueprint (`contracts/dozer_pool_manager.py`)
- **Pool Manager Contract ID**: Run seeding scripts for latest contract ID and pool keys
- **Data Source**: All data fetched directly from blockchain - no database dependency

## Remaining Migration Tasks (Priority Order)

### 🚨 High Priority - Liquidity Management
1. **Complete Add/Remove Liquidity API Migration**
   - Create `quoteLiquidityAdd` endpoint in pool router
   - Create `quoteLiquidityRemove` endpoint in pool router  
   - Create `getUserPositions` endpoint using PoolManager contract
   - Update `AddSectionLegacy` and `RemoveSectionLegacy` components to use new endpoints
   - Test end-to-end liquidity operations

### 🔴 High Priority - Frontend Page Updates
2. **Migrate Individual Token Pages**
   - Replace `api.getPools.firstLoadAll.useQuery()` with `api.getPools.all.useQuery()`
   - Replace `api.getPrices.firstLoadAll.useQuery()` with `api.getPrices.allUSD.useQuery()`
   - Update static generation to use contract-based prefetching
   - Test token page functionality and charts

3. **Migrate Individual Pool Pages**
   - Update to use contract-based pool queries
   - Re-enable charts and transaction history with contract data
   - Update static generation methods
   - Test pool page functionality

### 🟡 Medium Priority - API Cleanup
4. **Complete Prices Router Migration**
   - Replace `firstLoadAll` method with contract equivalent
   - Replace `all24h` method with contract-based 24h calculations
   - Replace `allAtTimestamp` with contract timestamp queries
   - Replace `htrKline` with contract-based historical data
   - Remove database dependencies from prices router

5. **UI/UX Refinements**
   - Review and polish user experience across all migrated components
   - Ensure consistent loading states and error handling
   - Optimize performance for contract-based data fetching
   - Improve route display and multi-hop swap UX

### 🟢 Low Priority - Code Cleanup
6. **Remove Legacy Components and Code**
   - Delete `AddSectionLegacy.tsx`, `RemoveSectionLegacy.tsx`, `AddSectionReviewModalLegacy.tsx`
   - Remove deprecated `LiquidityPool` class (122 lines)
   - Delete commented-out API endpoints (130+ lines)
   - Remove `dozer_pool_v1_1.py` contract and related test files
   - Clean up TODO/FIXME comments throughout codebase

7. **Database Dependency Cleanup**
   - Evaluate if `packages/database/` can be completely removed
   - Remove unused database imports across the codebase
   - Simplify or remove `seed_db.ts` if no longer needed
   - Clean up any remaining database-related code

### 🔵 Future Enhancements
8. **Testing and Validation**
   - Comprehensive testing of all migrated functionality
   - Performance testing of contract-based data fetching
   - User acceptance testing for UI/UX improvements
   - Documentation updates for new architecture

## Next Steps for New Chat Sessions
1. **Focus areas**: Liquidity management API completion and frontend page migrations
2. **Current status**: Core swap functionality working, substantial migration work remains
3. **Priority**: Complete add/remove liquidity before UI/UX refinements
4. **Context**: This document provides complete understanding of remaining migration tasks

---

*This document serves as the complete migration reference and current progress status for Dozer dApp migration to DozerPoolManager singleton contract. Core swap functionality is operational, but significant work remains for liquidity management, individual pages, and code cleanup.* 