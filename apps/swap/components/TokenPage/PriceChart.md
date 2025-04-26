# PriceChart Component

The `PriceChart` component is a reusable chart that displays token price data using the new price service API. It supports both line and candlestick charts, multiple time ranges, and can display prices in both USD and HTR currencies.

## Features

- **Multiple Chart Types**: Line and candlestick charts
- **Time Range Selection**: 1H, 24H, 7D, 30D, 90D, ALL
- **Currency Toggle**: USD and HTR
- **Real-time Updates**: Auto-refreshes data
- **Interactive**: Hovering shows specific prices and timestamps
- **Responsive**: Adapts to container width
- **Loading States**: Proper handling of loading, empty and error states

## Usage

```tsx
import PriceChart from 'components/TokenPage/PriceChart';

// Basic usage
<PriceChart tokenId="00" />

// With all options
<PriceChart 
  tokenId="00"
  initialChartType="line"
  initialTimeRange="24H"
  initialCurrency="USD"
  height={400}
  showControls={true}
  showCurrencyToggle={true}
  onPriceChange={(price, change) => {
    console.log('Current price:', price);
    console.log('Price change %:', change);
  }}
  symbol="HTR"
  name="Hathor"
  className="bg-stone-800 p-4 rounded-lg"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tokenId` | `string` | (Required) | Token UUID. Use "00" for HTR. |
| `initialChartType` | `'line' \| 'candlestick'` | `'line'` | Initial chart type to display. |
| `initialTimeRange` | `TimeRangeOption` | `'24H'` | Initial time range to display. |
| `initialCurrency` | `'USD' \| 'HTR'` | `'USD'` | Initial currency to display prices in. |
| `onPriceChange` | `(price: number, change: number) => void` | `undefined` | Callback when price/change updates. |
| `height` | `number` | `400` | Chart height in pixels. |
| `showControls` | `boolean` | `true` | Whether to show chart controls. |
| `showCurrencyToggle` | `boolean` | `true` | Whether to show currency toggle. |
| `className` | `string` | `''` | Additional CSS classes. |
| `symbol` | `string` | `undefined` | Token symbol to display. |
| `name` | `string` | `undefined` | Token name to display. |

## Implementation Notes

- The component uses the lightweight-charts library from TradingView
- It automatically adapts chart interval based on the selected time range
- It uses the following API endpoints:
  - `api.getNewPrices.isAvailable`: Checks if the price service is available
  - `api.getNewPrices.tokenInfo`: Fetches token information
  - `api.getNewPrices.isTokenAvailable`: Checks if a token is available in the price service
  - `api.getNewPrices.tokenPrice`: Gets the current price for a token
  - `api.getNewPrices.lineChart`: Gets line chart data
  - `api.getNewPrices.candlestickChart`: Gets candlestick chart data

## Migration from Old TokenChart

To migrate from the old `TokenChart` component to the new `PriceChart` component:

1. Replace imports:
   ```tsx
   // Old
   import { TokenChart } from 'components/TokenPage/TokenChart';
   
   // New
   import TokenChartNew from 'components/TokenPage/TokenChartNew';
   // or direct usage
   import PriceChart from 'components/TokenPage/PriceChart';
   ```

2. Update component usage:
   ```tsx
   // Old
   <TokenChart pair={pair} setIsDialogOpen={setIsDialogOpen} />
   
   // New (using wrapper)
   <TokenChartNew pair={pair} setIsDialogOpen={setIsDialogOpen} />
   
   // New (direct)
   <PriceChart
     tokenId={tokenId}
     initialCurrency={initialCurrency}
     symbol={token.symbol}
     name={token.name}
     height={400}
     showControls={true}
     showCurrencyToggle={true}
   />
   ```

3. For clean implementation without old pair-based logic, see the example in `/apps/swap/pages/tokens/[chainId]/[uuid]/clean.tsx`

## Example Implementation

```tsx
// Example page with PriceChart component
import PriceChart from 'components/TokenPage/PriceChart';

const TokenPage = () => {
  const { data: token } = api.getTokens.byId.useQuery({ id: uuid });
  
  return (
    <div className="flex flex-col gap-6">
      <h1>{token?.name || 'Token'}</h1>
      
      <PriceChart
        tokenId={uuid}
        initialCurrency="USD" 
        symbol={token?.symbol}
        name={token?.name}
      />
      
      {/* Other token information */}
    </div>
  );
};
```

## Troubleshooting

- If you see no data for a token, check if it's available in the price service using `api.getNewPrices.isTokenAvailable`
- For HTR token (uuid "00"), always use "USD" as the currency
- The component has built-in error states for unavailable tokens and empty data
