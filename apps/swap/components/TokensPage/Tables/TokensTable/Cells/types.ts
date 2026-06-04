import { Pair } from '@dozer/api'
import { ExtendedPair } from '../TokensTable'
import { DisplayCurrency } from '../../../TokensSection'

export interface PriceChangeData {
  currentPrice: number
  historicalPrice: number
  change: number
  timeRange: string
}

export interface SparklinePoint {
  timestamp: number
  price: number
  date: string
}

export interface CellProps {
  row: ExtendedPair
  displayCurrency?: DisplayCurrency
  preloadedPriceChanges?: Record<string, PriceChangeData>
  preloadedSparklines?: Record<string, SparklinePoint[]>
}
