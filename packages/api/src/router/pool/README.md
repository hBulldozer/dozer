# Pool Router Structure

This directory contains the split pool router for better organization.

## Files

- **helpers.ts** - Shared helper functions (fetch, calculations, caching)
- **queries.ts** - Query procedures (all, bySymbolId, getUserPositionsDetailed)
- **quotes.ts** - Quote procedures (quote, quoteExactOutput, liquidity quotes)
- **transactions.ts** - Transaction procedures (history, status)
- **index.ts** - Main router that merges all sub-routers

## Usage

The API surface remains exactly the same:
```typescript
api.getPools.all.useQuery()
api.getPools.bySymbolId.useQuery({ symbolId: 'HTR-DZR-3' })
```

No changes needed in consuming code!
