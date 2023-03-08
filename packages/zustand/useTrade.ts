import { ChainId } from '@dozer/chain'
import { Token } from '@dozer/currency'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}

interface PoolType {
  token1: Token
  token2: Token
  token1_balance: number
  token2_balance: number
}

interface TradeProps {
  chainId: number | undefined
  setChainId: (chainId: number) => void
  tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT
  setTradeType: (tradeType: TradeType.EXACT_INPUT | TradeType.EXACT_OUTPUT) => void
  amountSpecified: number | undefined
  setAmountSpecified: (amountSpecified: number) => void
  outputAmount: number | undefined
  setOutputAmount: () => void
  mainCurrency: Token | undefined
  setMainCurrency: (mainCurrency: Token) => void
  otherCurrency: Token | undefined
  setOtherCurrency: (otherCurrency: Token) => void
  mainCurrencyPrice: number | undefined
  setMainCurrencyPrice: (mainCurrencyPrice: number) => void
  otherCurrencyPrice: number | undefined
  setOtherCurrencyPrice: (otherCurrencyPrice: number) => void
  pool: PoolType
  setPool: () => void
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
      setMainCurrency: (mainCurrency: Token) => set((state) => ({ mainCurrency: mainCurrency })),
      otherCurrency: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
      setOtherCurrency: (otherCurrency: Token) => set((state) => ({ otherCurrency: otherCurrency })),
      mainCurrencyPrice: 0,
      setMainCurrencyPrice: (mainCurrencyPrice: number) => set((state) => ({ mainCurrencyPrice: mainCurrencyPrice })),
      otherCurrencyPrice: 0,
      setOtherCurrencyPrice: (otherCurrencyPrice: number) =>
        set((state) => ({ otherCurrencyPrice: otherCurrencyPrice })),
      outputAmount: 0,
      pool: {
        token1: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
        token2: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
        token1_balance: 0,
        token2_balance: 0,
      },
      setPool: async () => {
        const response = await fetch(
          `https://raw.githubusercontent.com/Dozer-Protocol/automatic-exchange-service/main/assets/${
            get().chainId
          }/pools/${get().mainCurrency?.uuid}_${get().otherCurrency?.uuid}`
        )
        set({ pool: await response.json() })
      },
      setOutputAmount: () =>
        set((state) => ({
          outputAmount:
            // state.otherCurrencyPrice && state.mainCurrencyPrice && state.amountSpecified
            //   ? state.amountSpecified * (state.otherCurrencyPrice / state.mainCurrencyPrice)
            //   : 0,
            state.pool && state.amountSpecified && state.mainCurrency && state.otherCurrency
              ? state.pool.token1.uuid === state.mainCurrency.uuid
                ? (state.amountSpecified * state.pool.token1_balance) / state.pool.token2_balance
                : (state.amountSpecified * state.pool.token2_balance) / state.pool.token1_balance
              : 0,
        })),
    }),
    {
      name: 'trade-storage',
    }
  )
)
