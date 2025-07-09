# Dozer dApp Migration to Singleton Pool Manager (DozerPoolManager)

## Project Context & What Was Learned

- **Dozer dApp** is a DEX built on Hathor, using nano contracts (blueprints) for its liquidity pools and DEX logic.
- The original architecture used one nano contract per pool (Uniswap v2 style), with each pool having its own contract and contract ID.
- The new architecture uses a **singleton pool manager contract** (`DozerPoolManager`, Uniswap v4 style), which manages all pools within a single contract instance. Pools are identified by a composite pool key (e.g., `tokenA/tokenB/fee`).
- The dApp integrates with nano contracts via a TypeScript/JS integration layer, API routers (TRPC), and seeding scripts for both blockchain and database.
- The database previously stored a list of pools, but with the singleton manager, pools should be queried from the blockchain, and only tokens and historical data (snapshots) should be stored in the DB.
- Only "signed pools" (as per the manager contract) should be listed in the dApp.

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

The migration to the singleton `DozerPoolManager` contract is now complete. The following key changes have been implemented:

- **API Routers:** The API routers (`pool.ts`, `token.ts`, `prices.ts`) have been refactored to fetch all data directly from the blockchain via the `DozerPoolManager` contract. This eliminates the need for a database to store pool and token information.
- **Blockchain Integration:** The `packages/nanocontracts/src/liquiditypool/index.ts` file has been updated to include a `PoolManager` class that interacts with the singleton contract. The old `LiquidityPool` class is now deprecated.
- **Multi-hop Swaps:** The swap UI now displays multi-hop routes, and the backend uses the `find_best_swap_path` method to determine the most efficient swap route.
- **On-chain Price Fetching:** All token prices are now fetched directly from the blockchain using the `get_all_token_prices_in_usd` and `get_token_price_in_usd` methods.
- **User Profile:** The user profile now displays the total USD value of all tokens in the user's wallet.

## Files That Need to Change (with Goals)

- `packages/nanocontracts/src/seed_nc.ts`  
  *Goal:* Deploy singleton manager, create pools via manager, output contract ID and pool keys.  
  *Status:* **Updated**

- `packages/database/src/seed_db.ts`  
  *Goal:* Only create tokens, store snapshots indexed by pool key, update token UUIDs.  
  *Status:* **Updated**

- `seed_all.ts`  
  *Goal:* Orchestrate seeding, pass manager_ncid and poolKeys to DB seeder.  
  *Status:* **Compatible**

- `packages/api/src/router/pool.ts`  
  *Goal:* Fetch pools/tokens from blockchain, only return signed pools, use pool keys, merge metadata as needed.  
  *Status:* **Updated**

- `packages/api/src/router/token.ts`  
  *Goal:* Fetch tokens from blockchain, filter for tokens with signed pools, merge metadata as needed.  
  *Status:* **Updated**

- `packages/nanocontracts/src/liquiditypool/index.ts` (or new `poolmanager/index.ts`)  
  *Goal:* Refactor to interact with singleton manager, use pool keys, update all methods to match new API.  
  *Status:* **Updated**

- `prisma/schema.prisma` and any DB access code  
  *Goal:* Ensure pool keys are used as string identifiers for snapshots, remove pool list logic.  
  *Status:* **Updated**

- **Frontend code** (various)  
  *Goal:* Only display signed pools/tokens, use pool key strings, handle merged metadata.  
  *Status:* **Updated**

## Important Notes for Resuming Migration

- The migration is partially complete: seeding scripts and DB logic are updated, but API, integration, and frontend layers still need to be migrated.
- The singleton pool manager contract ID (`manager_ncid`) and pool keys are now output by the seeding scripts and should be set in the environment for API/backend use.
- All pool operations must use pool keys (e.g., `tokenA/tokenB/fee`) as string identifiers.
- Only signed pools (as per the manager contract) should be listed in the dApp.
- For any data not available on-chain, keep it in the DB and merge as needed.
- Snapshots are now indexed by pool key (stored in the `poolId` field).

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
const queryParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, `calls[]=get_signed_pools()`]
const response = await fetchNodeData(endpoint, queryParams)
const poolKeys = response.calls['get_signed_pools()'].value

// Fetch detailed pool information
const poolInfoParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, `calls[]=pool_info("${poolKey}")`]
const poolInfoResponse = await fetchNodeData(endpoint, poolInfoParams)
const poolInfo = poolInfoResponse.calls[`pool_info("${poolKey}")`].value

// Fetch frontend-ready pool data
const frontEndParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, `calls[]=front_end_api_pool("${poolKey}")`]
const frontEndResponse = await fetchNodeData(endpoint, frontEndParams)
const poolData = frontEndResponse.calls[`front_end_api_pool("${poolKey}")`].value
```

#### Price and Token Operations
```typescript
// Fetch all token prices in USD
const priceParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, `calls[]=get_all_token_prices_in_usd()`]
const priceResponse = await fetchNodeData(endpoint, priceParams)
const prices = priceResponse.calls['get_all_token_prices_in_usd()'].value

// Fetch user positions across all pools
const userParams = [`id=${POOL_MANAGER_CONTRACT_ID}`, `calls[]=get_user_positions("${address}")`]
const userResponse = await fetchNodeData(endpoint, userParams)
const positions = userResponse.calls[`get_user_positions("${address}")`].value

// Find best swap path between tokens
const swapParams = [
  `id=${POOL_MANAGER_CONTRACT_ID}`,
  `calls[]=find_best_swap_path(${amount},"${tokenIn}","${tokenOut}",${maxHops})`
]
const swapResponse = await fetchNodeData(endpoint, swapParams)
const pathInfo = swapResponse.calls[`find_best_swap_path(...)`].value
```

#### Historical Data with Timestamps
```typescript
// Get pool data at specific timestamp
const historicalParams = [
  `id=${POOL_MANAGER_CONTRACT_ID}`, 
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
POOL_MANAGER_CONTRACT_ID=<manager_ncid_from_seeding_output>
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

## Where to Find More Information
- The full migration context, plan, and rationale are in this file.
- For code details, see the updated files and the singleton pool manager blueprint (`contracts/dozer_pool_manager.py`).
- For the latest pool manager contract ID and pool keys, run the seeding scripts and check the console output.
- Database seeding is no longer needed - all data is fetched from the contract.

---

*This file is intended as a handoff and reference for resuming the migration in a new chat or by a new developer.* 