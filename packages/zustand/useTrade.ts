import { ChainId } from '@dozer/chain'
import { Token, getTokens } from '@dozer/currency'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}

interface PoolType {
  token1: Token | undefined
  token2: Token | undefined
  token1_balance: number | undefined
  token2_balance: number | undefined
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
  pool: PoolType | undefined
  setPool: (pool: PoolType) => void
  outputAmount: number | undefined
  setOutputAmount: () => void
  priceImpact: number
  setPriceImpact: () => void
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
      pool: {
        token1: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
        token2: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
        token1_balance: 0,
        token2_balance: 0,
      },
      setPool: (pool: PoolType) => set((state) => ({ pool: pool })),
      outputAmount: 0,
      setOutputAmount: () =>
        set((state) => ({
          outputAmount:
            state.pool?.token1 &&
            state.pool.token2 &&
            state.pool.token1_balance &&
            state.pool.token2_balance &&
            state.mainCurrency &&
            state.amountSpecified
              ? state.pool.token1.uuid === state.mainCurrency.uuid
                ? (state.amountSpecified * state.pool.token2_balance) /
                  (state.pool.token1_balance + state.amountSpecified)
                : (state.amountSpecified * state.pool.token1_balance) /
                  (state.pool.token2_balance + state.amountSpecified)
              : 0,
        })),
      priceImpact: 0,
      setPriceImpact: () =>
        set((state) => ({
          priceImpact:
            state.pool?.token1 &&
            state.pool.token2 &&
            state.pool.token1_balance &&
            state.pool.token2_balance &&
            state.mainCurrency &&
            state.amountSpecified
              ? state.pool.token1.uuid === state.mainCurrency.uuid
                ? (state.amountSpecified / (state.pool.token1_balance + state.amountSpecified)) * 100
                : (state.amountSpecified / (state.pool.token2_balance + state.amountSpecified)) * 100
              : 0,
        })),
    }),
    {
      name: 'trade-storage',
    }
  )
)
