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

### 3. User Liquidity Position Fetching & Display (✅ Complete)

- **Context:**
  - The singleton pool manager contract exposes `get_user_positions(address)` (returns all user positions across pools) and `user_info(address, pool_key)` (returns detailed info for a user in a specific pool).
  - This enables efficient, single-call fetching of all user positions, replacing the need to loop over all pools/contracts.

- **✅ Completed Changes:**
  - **Backend/API Migration:** Updated `packages/api/src/router/profile.ts` with new DozerPoolManager procedures:
    - `userPositions` - Fetches all user positions using `get_user_positions(address)`
    - `userPositionsSummary` - Provides aggregated position data with USD values
    - `userPositionByPool` - Fetches individual pool position using `user_info(address, pool_key)`
  - **Decimal/Cents Conversion:** Fixed proper conversion from contract cents to UI decimals (÷100) across all procedures
  - **PositionsTable Component:** Updated `apps/earn/components/PoolsSection/Tables/PositionsTable/PositionsTable.tsx` to use new `userPositions` procedure
  - **PoolPositionProvider:** Updated `apps/earn/components/PoolPositionProvider.tsx` to use new `userPositionByPool` procedure
  - **Code Cleanup:** Removed unused imports and legacy code from migrated components

- **Files Updated:**
  - `packages/api/src/router/profile.ts` - New DozerPoolManager procedures with proper decimal conversion
  - `apps/earn/components/PoolsSection/Tables/PositionsTable/PositionsTable.tsx` - Uses new userPositions API
  - `apps/earn/components/PoolPositionProvider.tsx` - Uses new userPositionByPool API
  - Removed unused imports and pagination code from components

- **✅ Goal Achieved:**
  - All user position fetching now uses DozerPoolManager contract methods
  - Proper decimal/cents conversion handling throughout the stack
  - Efficient, accurate display of user positions with correct token amounts and USD values
  - Clean, optimized code without legacy database dependencies

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
- **Remove Liquidity:** ✅ Complete - Transaction execution and symbol-based URL support fully migrated to DozerPoolManager
- **User Position Fetching:** ✅ Complete - All components migrated to use DozerPoolManager procedures
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
- **User Positions**: ✅ Complete - All position displays now use PoolManager data

## Current Operational Status

- **Multi-hop Swaps**: ✅ Fully functional (DZR→HTR→CTHOR paths working)
- **Single-hop Swaps**: ✅ Fully functional  
- **Route Display**: ✅ Working with proper UI components
- **Token Configuration Copy**: ✅ Available on tokens list page
- **Add Liquidity**: ✅ Fully functional (execution works, quoting implemented, supports symbol-based URLs)
- **Remove Liquidity**: ✅ Fully functional (execution works, symbol-based URLs supported)
- **Token Pages**: ✅ Fully functional with symbol-based URLs and contract data
- **Pool Pages**: ✅ Fully functional with symbol-based URLs and contract data
- **User Positions**: ✅ Fully functional with DozerPoolManager integration and proper decimal conversion
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

### ✅ Completed - Liquidity Management
1. **Remove Liquidity Migration Complete**
   - ✅ Symbol-based URL support implemented
   - ✅ Fee extraction from pool keys (no more hardcoded values)
   - ✅ Static generation for both symbol IDs and pool keys
   - ✅ Transaction execution works with proper DozerPoolManager integration
   - ✅ `quoteLiquidityAdd` endpoints complete
   - ✅ `getUserPositions` endpoints complete (userPositions, userPositionByPool procedures)
   - ✅ `AddSectionLegacy` component migration complete
   - ✅ `RemoveSectionLegacy` component migration complete

### 🔴 High Priority - Frontend Page Updates
1. **Migrate Individual Token Pages**
   - Replace `api.getPools.firstLoadAll.useQuery()` with `api.getPools.all.useQuery()`
   - Replace `api.getPrices.firstLoadAll.useQuery()` with `api.getPrices.allUSD.useQuery()`
   - Update static generation to use contract-based prefetching
   - Test token page functionality and charts

2. **Migrate Individual Pool Pages**
   - Update to use contract-based pool queries
   - Re-enable charts and transaction history with contract data
   - Update static generation methods
   - Test pool page functionality

### 🟡 Medium Priority - API Cleanup
3. **Complete Prices Router Migration**
   - Replace `firstLoadAll` method with contract equivalent
   - Replace `all24h` method with contract-based 24h calculations
   - Replace `allAtTimestamp` with contract timestamp queries
   - Replace `htrKline` with contract-based historical data
   - Remove database dependencies from prices router

4. **UI/UX Refinements**
   - Review and polish user experience across all migrated components
   - Ensure consistent loading states and error handling
   - Optimize performance for contract-based data fetching
   - Improve route display and multi-hop swap UX

### 🟢 Low Priority - Code Cleanup
5. **Remove Legacy Components and Code**
   - Delete `AddSectionLegacy.tsx`, `RemoveSectionLegacy.tsx`, `AddSectionReviewModalLegacy.tsx`
   - Remove deprecated `LiquidityPool` class (122 lines)
   - Delete commented-out API endpoints (130+ lines)
   - Remove `dozer_pool_v1_1.py` contract and related test files
   - Clean up TODO/FIXME comments throughout codebase

6. **Database Dependency Cleanup**
   - Evaluate if `packages/database/` can be completely removed
   - Remove unused database imports across the codebase
   - Simplify or remove `seed_db.ts` if no longer needed
   - Clean up any remaining database-related code

### 🔵 Future Enhancements
7. **Testing and Validation**
   - Comprehensive testing of all migrated functionality
   - Performance testing of contract-based data fetching
   - User acceptance testing for UI/UX improvements
   - Documentation updates for new architecture

## Recently Completed Work

### ✅ Contract JSON Dependency Removal & NamedTuple Parser Implementation (Complete)

**Context:** Successfully removed JSON library dependency from the DozerPoolManager contract and implemented proper NamedTuple parsing in the API layer.

**Problem Identified:**
- NamedTuples from nano contracts return as arrays, not objects with named properties
- Example: `['path', [1000, 39], 39, 2]` instead of `{path: 'path', amounts: [1000, 39], amount_out: 39, price_impact: 2}`
- The `_str` methods using `json.dumps()` were no longer needed and created dependency issues

**Key Changes Made:**

1. **Contract Updates (`contracts/dozer_pool_manager.py`):**
   - **Removed JSON import**: Eliminated `import json` dependency
   - **Created 6 new NamedTuple classes**:
     - `PoolApiInfo` - for frontend API pool information
     - `PoolInfo` - for detailed pool information  
     - `UserInfo` - for user position information
     - `UserPosition` - for user position collections
     - `SwapPathInfo` - for swap path information
     - `SwapPathExactOutputInfo` - for exact output swap paths
   - **Updated 6 view methods** to return NamedTuples instead of dictionaries:
     - `front_end_api_pool()` → returns `PoolApiInfo`
     - `pool_info()` → returns `PoolInfo`
     - `user_info()` → returns `UserInfo`
     - `get_user_positions()` → returns `dict[str, UserPosition]`
     - `find_best_swap_path()` → returns `SwapPathInfo`
     - `find_best_swap_path_exact_output()` → returns `SwapPathExactOutputInfo`
   - **Removed 6 "_str" methods** that used `json.dumps()`:
     - `front_end_api_pool_str()`, `pool_info_str()`, `get_user_positions_str()`, etc.

2. **NamedTuple Parser Utility (`packages/api/src/utils/namedTupleParsers.ts`):**
   - **6 TypeScript interfaces** matching the NamedTuple structures
   - **6 parser functions** to convert arrays to objects with proper property names
   - **Error handling** for invalid array formats
   - **Special parser** for user positions object: `parseUserPositions()`

3. **Router Updates:**
   - **`pool.ts`**: Updated 8 locations where NamedTuple arrays are accessed
   - **`profile.ts`**: Updated 3 locations for user position and info methods
   - **`token.ts`**: Updated 1 location for pool API info
   - **Removed unused** `parseJsonResponse()` functions
   - **Fixed field name access** (e.g., `token_a_amount` → `token0Amount`)

**Files Modified:**
- `contracts/dozer_pool_manager.py` - Removed JSON dependency and updated method signatures
- `packages/api/src/utils/namedTupleParsers.ts` - New parser utility functions
- `packages/api/src/router/pool.ts` - Updated to use parser functions
- `packages/api/src/router/profile.ts` - Updated to use parser functions
- `packages/api/src/router/token.ts` - Updated to use parser functions

**Testing Results:**
- ✅ All NamedTuple arrays now properly parsed to objects with named properties
- ✅ Type safety improved with TypeScript interfaces
- ✅ No more JSON dependency in the contract
- ✅ API responses maintain same structure for frontend compatibility
- ✅ Error handling for malformed contract responses

**Technical Benefits:**
- **No JSON dependency**: Contract no longer depends on the `json` library
- **Type safety**: NamedTuples provide better type checking than dictionaries
- **Performance**: NamedTuples are more efficient than JSON parsing
- **Compatibility**: NamedTuple is a supported return type for nano contracts
- **Maintainability**: Centralized parsing logic in utility functions

### ✅ User Position Fetching & Display Migration (Complete)

**Context:** Successfully migrated all user position fetching from legacy database queries to DozerPoolManager contract methods.

**Key Changes Made:**
1. **Backend API Migration (`packages/api/src/router/profile.ts`):**
   - Added `userPositions` procedure using `get_user_positions(address)` contract method
   - Added `userPositionsSummary` procedure for aggregated position data
   - Added `userPositionByPool` procedure using `user_info(address, pool_key)` contract method
   - Fixed decimal/cents conversion throughout all procedures (contract returns cents, UI expects decimals)

2. **Frontend Component Updates:**
   - **PositionsTable** (`apps/earn/components/PoolsSection/Tables/PositionsTable/PositionsTable.tsx`):
     - Updated to use new `userPositions` procedure instead of legacy database queries
     - Removed unused imports and pagination code
     - Component now correctly displays user positions with proper amounts
   - **PoolPositionProvider** (`apps/earn/components/PoolPositionProvider.tsx`):
     - Updated to use new `userPositionByPool` procedure
     - Fixed field mappings from legacy `max_withdraw_a/b` to new `token0Amount/token1Amount`
     - Simplified value calculations (amounts already in decimal format from API)
     - Removed timestamp-related dependencies not available in DozerPoolManager

3. **Decimal/Cents Conversion:**
   - **Contract Level:** DozerPoolManager returns amounts in cents (integers)
   - **API Level:** Procedures convert cents to decimals (÷100) for UI consumption
   - **Frontend:** Components receive decimal values ready for display
   - **Validation:** Added proper error handling for amount conversions

4. **Code Cleanup:**
   - Removed unused imports across all migrated components
   - Cleaned up legacy pagination and sorting code
   - Removed references to timestamp-based price queries not supported by DozerPoolManager

**Files Modified:**
- `packages/api/src/router/profile.ts` - New DozerPoolManager procedures
- `apps/earn/components/PoolsSection/Tables/PositionsTable/PositionsTable.tsx` - Updated API usage
- `apps/earn/components/PoolPositionProvider.tsx` - Updated API usage and field mappings

**Testing Results:**
- ✅ PositionsTable now correctly displays user positions with accurate amounts
- ✅ Decimal conversion working properly (no more zero amounts for valid positions)
- ✅ DozerPoolManager integration functioning as expected
- ✅ Clean, optimized code without legacy database dependencies

**Impact:**
- All user position data now sourced directly from blockchain via DozerPoolManager
- Improved performance with single contract calls instead of multiple database queries
- Enhanced accuracy with real-time blockchain data
- Reduced complexity by eliminating database layer for position data

### ✅ Remove Liquidity Flow Migration & TVL/Volume Display Fix (Complete)

**Context:** Successfully completed remove liquidity migration and fixed critical TVL/volume display issues showing inflated values.

**Problem Identified:**
- Remove liquidity page didn't support symbol-based URLs (e.g., "HTR-DZR-3")
- RemoveSectionLegacy component had hardcoded fee value of `5`
- TVL and volume values were showing as trillions/billions instead of expected thousands/millions
- Token prices in pool router were not converted from contract units (micro-dollars) to USD

**Key Changes Made:**

1. **Remove Liquidity Page Migration (`apps/earn/pages/[id]/remove.tsx`):**
   - **Symbol-based URL Detection:** Added logic to detect symbol IDs vs pool keys
   - **Dual Query Pattern:** Uses `bySymbolId` query for symbol-based URLs and `all` query for pool keys
   - **Static Generation:** Updated both `getStaticPaths` and `getStaticProps` to support both URL formats
   - **Breadcrumb Fix:** Updated LINKS function to use pool object directly

2. **RemoveSectionLegacy Component Fix (`apps/earn/components/RemoveSection/RemoveSectionLegacy.tsx`):**
   - **Fee Extraction:** Added proper fee extraction from pool keys using `pair.id.split('/')` pattern
   - **Removed Hardcoded Values:** Replaced hardcoded fee value of `5` with dynamically extracted fee
   - **Added Fallback:** Includes fallback to fee value of `5` if extraction fails

3. **TVL/Volume Display Fix (`packages/api/src/router/pool.ts`):**
   - **Token Price Conversion:** Fixed token prices conversion from contract units to USD
   - **Root Cause:** Contract returns prices in micro-dollars (1,000,000 = $1.00), but pool router was using them directly
   - **Solution:** Added division by 1,000,000 to convert to actual USD values in both `all` and `bySymbolId` procedures

**Files Modified:**
- `apps/earn/pages/[id]/remove.tsx` - Symbol-based URL support and static generation
- `apps/earn/components/RemoveSection/RemoveSectionLegacy.tsx` - Fee extraction and hardcoded value fix
- `packages/api/src/router/pool.ts` - Token price conversion fix for TVL/volume calculations

**Testing Results:**
- ✅ Remove liquidity flow now works with both symbol-based URLs and pool keys
- ✅ Fee extraction works correctly for all pool types
- ✅ TVL values now show realistic amounts (e.g., $1M instead of $1.00t)
- ✅ Volume calculations display correct USD values
- ✅ Pool table displays match seed configuration expectations

**Technical Benefits:**
- **URL Consistency:** Remove liquidity page now matches add liquidity page URL patterns
- **Dynamic Fee Handling:** No more hardcoded fee values, extracted from pool keys
- **Accurate Financial Data:** TVL and volume displays now show realistic values
- **Performance:** Single contract calls with proper data conversion
- **Maintainability:** Consistent patterns across all liquidity management pages

## Next Steps for New Chat Sessions
1. **Focus areas**: Frontend page migrations and legacy code cleanup
2. **Current status**: Core swap functionality working, user positions complete, remove liquidity complete, TVL/volume displays fixed
3. **Priority**: Migrate individual token/pool pages before final code cleanup
4. **Context**: This document provides complete understanding of remaining migration tasks

**Recent Progress:** 
- ✅ **Contract JSON Dependency Removal**: Successfully removed JSON library dependency from DozerPoolManager contract and implemented proper NamedTuple parsing in API layer
- ✅ **User Position Migration**: All user position fetching migrated to DozerPoolManager contract methods with proper decimal conversion
- ✅ **NamedTuple Parser Implementation**: Created utility functions to parse contract NamedTuple arrays into properly typed objects
- ✅ **Router Updates**: Updated all affected API routers to use new parser functions
- ✅ **Remove Liquidity Migration**: Complete symbol-based URL support and fee extraction implementation
- ✅ **TVL/Volume Display Fix**: Fixed inflated values by properly converting token prices from contract units to USD

**Current Technical Status:**
- **Contract**: Clean, no external dependencies, proper NamedTuple return types
- **API Layer**: NamedTuple arrays properly parsed to objects with named properties, token prices properly converted
- **Type Safety**: Full TypeScript typing for all contract interactions
- **Performance**: Efficient parsing without JSON serialization overhead
- **Liquidity Management**: Both add and remove liquidity flows fully functional with symbol-based URLs
- **Financial Data**: TVL and volume displays show accurate values matching seed configuration

---

*This document serves as the complete migration reference and current progress status for Dozer dApp migration to DozerPoolManager singleton contract. Core swap functionality and liquidity management are now fully operational, with primary remaining work focused on individual page migrations and legacy code cleanup.* 