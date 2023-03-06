import { ChainId } from '@dozer/chain'
import { Token } from '@dozer/currency'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

export const useTrade = create<TradeProps>()(
  persist(
    (set) => ({
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
      setOutputAmount: () =>
        set((state) => ({
          outputAmount:
            state.otherCurrencyPrice && state.mainCurrencyPrice && state.amountSpecified
              ? state.amountSpecified * (state.otherCurrencyPrice / state.mainCurrencyPrice)
              : 0,
        })),
    }),
    {
      name: 'trade-storage',
    }
  )
)
