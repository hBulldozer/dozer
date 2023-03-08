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
  setMainCurrency: (mainCurrency: Token) => void
  otherCurrency: Token | undefined
  setOtherCurrency: (otherCurrency: Token) => void
  mainCurrencyPrice: number | undefined
  setMainCurrencyPrice: (mainCurrencyPrice: number) => void
  otherCurrencyPrice: number | undefined
  setOtherCurrencyPrice: (otherCurrencyPrice: number) => void
  pool: PoolType | undefined
  setPool: () => Promise<boolean>
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
      setMainCurrency: (mainCurrency: Token) => set((state) => ({ mainCurrency: mainCurrency })),
      otherCurrency: new Token({ chainId: ChainId.HATHOR, uuid: '00', decimals: 2 }),
      setOtherCurrency: (otherCurrency: Token) => set((state) => ({ otherCurrency: otherCurrency })),
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
      setPool: async () => {
        const list_url = `https://raw.githubusercontent.com/Dozer-Protocol/automatic-exchange-service/main/assets/${
          get().chainId
        }/pools_list`
        const list = await fetch(list_url).then((resp) => resp.json())
        const pool = list.list.find((obj: { tokens: (string | undefined)[] }) => {
          return obj.tokens.indexOf(get().mainCurrency?.uuid) > -1 && obj.tokens.indexOf(get().otherCurrency?.uuid) > -1
        })
        if (!pool) return false
        else {
          const url = `https://raw.githubusercontent.com/Dozer-Protocol/automatic-exchange-service/main/assets/${
            get().chainId
          }/pools/${pool.name}`
          const data = await fetch(url).then((resp) => resp.json())
          const result = {
            token1: getTokens(get().chainId).find((obj) => {
              return obj.uuid === data.token1
            }),
            token2: getTokens(get().chainId).find((obj) => {
              return obj.uuid === data.token2
            }),
            token1_balance: Number(data.token1_balance),
            token2_balance: Number(data.token2_balance),
          }
          set({ pool: result })
          return true
        }
      },
      outputAmount: 0,
      setOutputAmount: () => {
        if (
          get().pool &&
          get().pool?.token1 &&
          get().pool?.token2 &&
          get().pool?.token1_balance &&
          get().pool?.token2_balance &&
          get().mainCurrency &&
          get().amountSpecified
        ) {
          const product = get().pool?.token1_balance * get().pool?.token2_balance
          const balance =
            get().pool.token1.uuid === get().mainCurrency.uuid ? get().pool?.token1_balance : get().pool?.token2_balance
          const balance_other =
            get().pool.token1.uuid === get().mainCurrency.uuid ? get().pool?.token2_balance : get().pool?.token1_balance
          const price = balance_other / balance
          const new_balance = balance + get().amountSpecified
          const new_balance_other = product / new_balance
          const amount_received = balance_other - new_balance_other
          set((state) => ({
            outputAmount: amount_received,
          }))
        } else {
          set((state) => ({ outputAmount: 0 }))
        }
      },
      priceImpact: 0,
      setPriceImpact: () => {
        if (
          get().pool &&
          get().pool?.token1 &&
          get().pool?.token2 &&
          get().pool?.token1_balance &&
          get().pool?.token2_balance &&
          get().mainCurrency &&
          get().outputAmount
        ) {
          const balance =
            get().pool.token1.uuid === get().mainCurrency.uuid ? get().pool?.token1_balance : get().pool?.token2_balance
          const balance_other =
            get().pool.token1.uuid === get().mainCurrency.uuid ? get().pool?.token2_balance : get().pool?.token1_balance
          const price = balance_other / balance
          const price_paid = get().outputAmount / get().amountSpecified
          set((state) => ({
            priceImpact: ((price_paid - price) / price) * 100,
          }))
        } else {
          set((state) => ({ priceImpact: 0 }))
        }
      },
    }),
    {
      name: 'trade-storage',
    }
  )
)
