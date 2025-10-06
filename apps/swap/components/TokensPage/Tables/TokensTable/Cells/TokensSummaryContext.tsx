import { createContext } from 'react'

export interface TokenSummaryData {
  current_price: number
  change_24h: number
  mini_chart: Array<{ timestamp: string; price: number }>
}

export type TokensSummaryContextType = Record<string, TokenSummaryData> | null

export const TokensSummaryContext = createContext<TokensSummaryContextType>(null)
