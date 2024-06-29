import { Amount, Token, Type } from '@dozer/currency'
import { FundSource } from '@dozer/hooks'
import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { Pair, toToken } from '@dozer/api'
import { useTokensFromPair } from '@dozer/api'
import { useUnderlyingTokenBalanceFromPair } from '@dozer/api'
import { useTotalSupply } from '@dozer/react-query'
import { isError, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../utils/api'
import { max } from 'date-fns'
import { MAX_SAFE_INTEGER } from '@dozer/math'

interface PoolPositionContext {
  value0: number
  value1: number
  max_withdraw_a: Amount<Type> | undefined
  max_withdraw_b: Amount<Type> | undefined
  isLoading: boolean
  isError: boolean
}

const Context = createContext<PoolPositionContext | undefined>(undefined)

export const PoolPositionProvider: FC<{
  pair: Pair
  prices: { [key: string]: number }
  children: ReactNode
  watch?: boolean
}> = ({ pair, prices, children, watch = true }) => {
  const token0 = toToken(pair.token0)
  const token1 = toToken(pair.token1)

  const { address } = useAccount()

  const {
    data: poolInfo,
    isLoading,
    isError,
  } = api.getProfile.poolInfo.useQuery({ address: address, contractId: pair.id })

  console.log('poolInfo', poolInfo)

  const { liquidity, max_withdraw_a, max_withdraw_b } = poolInfo || {
    liquidity: undefined,
    max_withdraw_a: undefined,
    max_withdraw_b: undefined,
  }

  const _max_withdraw_a: Amount<Type> | undefined = max_withdraw_a
    ? Amount.fromRawAmount(token0, max_withdraw_a)
    : undefined
  const _max_withdraw_b: Amount<Type> | undefined = max_withdraw_b
    ? Amount.fromRawAmount(token1, max_withdraw_b)
    : undefined

  const value0 = useMemo(() => {
    return prices[token0.uuid] * Number(_max_withdraw_a?.toFixed(2))
  }, [prices, token0, max_withdraw_a])
  const value1 = useMemo(() => {
    return prices[token1.uuid] * Number(_max_withdraw_b?.toFixed(2))
  }, [prices, token1, max_withdraw_b])

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          value0,
          value1,
          max_withdraw_a: _max_withdraw_a,
          max_withdraw_b: _max_withdraw_b,
          isLoading,
          isError,
        }),
        [isError, isLoading, _max_withdraw_a, _max_withdraw_b, value0, value1]
      )}
    >
      {children}
    </Context.Provider>
  )
}

export const usePoolPosition = () => {
  const context = useContext(Context)
  if (!context) {
    throw new Error('Hook can only be used inside Pool Position Context')
  }

  return context
}
