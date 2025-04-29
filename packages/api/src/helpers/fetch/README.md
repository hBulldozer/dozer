# Price Service Fetch Client

This module provides a native `fetch`-based client for interacting with the price service API. It replaces the previous axios-based implementation to take advantage of Next.js optimizations for the native fetch API.

## Benefits

- Better integration with Next.js optimizations (automatic deduplication, caching)
- Reduced bundle size by eliminating the axios dependency
- Consistent error handling and timeout management
- Standardized parameter handling

## Usage

```typescript
import { getPriceServiceData } from '../helpers/fetch';

// Basic usage
const data = await getPriceServiceData('/api/v1/prices/current/00');

// With query parameters
const tokenData = await getPriceServiceData(`/api/v1/prices/current/${tokenId}`, {
  params: {
    currency: 'USD'
  }
});

// With timeout
const poolData = await getPriceServiceData(`/api/v1/pools/current/${poolId}`, {
  timeout: 5000
});
```

## Configuration

The client uses the `PRICE_SERVICE_URL` environment variable to determine the base URL for requests, defaulting to `http://localhost:3000` if not set.

## Error Handling

The client will throw errors in the following cases:
- Network failures
- Request timeouts
- Non-OK responses (status outside the 200-299 range)

All errors are logged to the console with appropriate context.
