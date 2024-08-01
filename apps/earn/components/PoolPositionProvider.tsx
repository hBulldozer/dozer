import { Amount, Token, Type } from '@dozer/currency'
import { FundSource } from '@dozer/hooks'
import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { Pair, toToken } from '@dozer/api'
import { useTokensFromPair } from '@dozer/api'
import { useUnderlyingTokenBalanceFromPair } from '@dozer/api'
import { api } from '../utils/api'
import { max } from 'date-fns'
import { MAX_SAFE_INTEGER } from '@dozer/math'

interface PoolPositionContext {
  value0: number
  value1: number
  max_withdraw_a: Amount<Type> | undefined
  max_withdraw_b: Amount<Type> | undefined
  user_deposited_a: Amount<Type> | undefined
  user_deposited_b: Amount<Type> | undefined
  changeUSD0: number
  changeUSD1: number
  liquidity: number | undefined
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

  const { liquidity, max_withdraw_a, max_withdraw_b, user_deposited_a, user_deposited_b } = poolInfo || {
    liquidity: undefined,
    max_withdraw_a: undefined,
    max_withdraw_b: undefined,
    user_deposited_a: undefined,
    user_deposited_b: undefined,
  }

  const _max_withdraw_a: Amount<Type> | undefined = max_withdraw_a
    ? Amount.fromFractionalAmount(token0, max_withdraw_a * 100, 100)
    : undefined
  const _max_withdraw_b: Amount<Type> | undefined = max_withdraw_b
    ? Amount.fromFractionalAmount(token1, max_withdraw_b * 100, 100)
    : undefined

  const _user_deposited_a: Amount<Type> | undefined = user_deposited_a
    ? Amount.fromFractionalAmount(token0, user_deposited_a * 100, 100)
    : undefined
  const _user_deposited_b: Amount<Type> | undefined = user_deposited_b
    ? Amount.fromFractionalAmount(token1, user_deposited_b * 100, 100)
    : undefined

  const value0 = useMemo(() => {
    return prices[token0.uuid] * Number(_max_withdraw_a?.toFixed(2))
  }, [prices, token0, max_withdraw_a])
  const value1 = useMemo(() => {
    return prices[token1.uuid] * Number(_max_withdraw_b?.toFixed(2))
  }, [prices, token1, max_withdraw_b])

  const changeUSD0 = useMemo(() => {
    return (Number(max_withdraw_a?.toFixed(2)) - Number(user_deposited_a?.toFixed(2))) * prices[token0.uuid]
  }, [prices, token0, max_withdraw_a, user_deposited_a])

  const changeUSD1 = useMemo(() => {
    return (Number(max_withdraw_b?.toFixed(2)) - Number(user_deposited_b?.toFixed(2))) * prices[token1.uuid]
  }, [prices, token1, max_withdraw_b, user_deposited_b])

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          liquidity,
          value0,
          value1,
          max_withdraw_a: _max_withdraw_a,
          max_withdraw_b: _max_withdraw_b,
          user_deposited_a: _user_deposited_a,
          user_deposited_b: _user_deposited_b,
          changeUSD0,
          changeUSD1,
          isLoading,
          isError,
        }),
        [
          liquidity,
          isError,
          isLoading,
          _max_withdraw_a,
          _max_withdraw_b,
          _user_deposited_a,
          _user_deposited_b,
          changeUSD0,
          changeUSD1,
          value0,
          value1,
        ]
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
