import { ChainId } from '@dozer/chain'
import { Token, getTokens } from '@dozer/currency'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Pair } from '@dozer/api'

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}

interface TradeProps {
  chainId: number | undefined
  setChainId: (chainId: number) => void
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT
  setTradeType: (tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT) => void
  amountSpecified: number | undefined
  setAmountSpecified: (amountSpecified: number) => void
  mainCurrency: Token | undefined
  setMainCurrency: (mainCurrency: Token | undefined) => void
  otherCurrency: Token | undefined
  setOtherCurrency: (otherCurrency: Token | undefined) => void
  mainCurrencyPrice: number | undefined
  setMainCurrencyPrice: (mainCurrencyPrice: number) => void
  otherCurrencyPrice: number | undefined
  setOtherCurrencyPrice: (otherCurrencyPrice: number) => void
  pool: Pair | undefined
  setPool: (pool: Pair) => void
  outputAmount: number
  setOutputAmount: (outputAmount: number) => void
  priceImpact: number
  setPriceImpact: (priceImpact: number) => void
}

export const useTrade = create<TradeProps>()(
  persist(
    (set, get) => ({
      chainId: ChainId.HATHOR,
      setChainId: (chainId: number) => set((state) => ({ chainId: chainId })),
      tradeType: TradeType.EXACT_INPUT,
      setTradeType: (tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT) =>
        set((state) => ({ tradeType: tradeType })),
      amountSpecified: 0,
      setAmountSpecified: (amountSpecified: number) => set((state) => ({ amountSpecified: amountSpecified })),
      mainCurrency: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
      setMainCurrency: (mainCurrency: Token | undefined) => set((state) => ({ mainCurrency: mainCurrency })),
      otherCurrency: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
      setOtherCurrency: (otherCurrency: Token | undefined) => set((state) => ({ otherCurrency: otherCurrency })),
      mainCurrencyPrice: 0,
      setMainCurrencyPrice: (mainCurrencyPrice: number) => set((state) => ({ mainCurrencyPrice: mainCurrencyPrice })),
      otherCurrencyPrice: 0,
      setOtherCurrencyPrice: (otherCurrencyPrice: number) =>
        set((state) => ({ otherCurrencyPrice: otherCurrencyPrice })),
      pool: undefined,
      setPool: (pool: Pair) => set((state) => ({ pool: pool })),
      outputAmount: 0,
      setOutputAmount: (outputAmount: number) => set((state) => ({ outputAmount: outputAmount })),
      priceImpact: 0,
      setPriceImpact: (priceImpact: number) => set((state) => ({ priceImpact: priceImpact })),
    }),
    {
      name: 'trade-storage',
    }
  )
)
