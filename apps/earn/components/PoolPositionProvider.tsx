import { Amount, Type } from '@dozer/currency'
import { createContext, FC, ReactNode, useContext, useMemo } from 'react'
import { Pair, toToken } from '@dozer/api'
import { api } from '../utils/api'
import { useWalletConnectClient } from '@dozer/higmi'

interface PoolPositionContext {
  value0: number
  value1: number
  max_withdraw_a: Amount<Type> | undefined
  max_withdraw_b: Amount<Type> | undefined
  // user_deposited_a: Amount<Type> | undefined
  // user_deposited_b: Amount<Type> | undefined
  // depositedUSD0: number
  // depositedUSD1: number
  last_tx: number
  // changeUSD0: number
  // changeUSD1: number
  liquidity: number | undefined
  isLoading: boolean
  isError: boolean
}

const Context = createContext<PoolPositionContext | undefined>(undefined)

export const PoolPositionProvider: FC<{
  pair: Pair
  prices: { [key: string]: number }
  children: ReactNode
}> = ({ pair, prices, children }) => {
  const token0 = toToken(pair.token0)
  const token1 = toToken(pair.token1)

  // const { address } = useAccount()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  const {
    data: poolInfo,
    isLoading: isLoadingPoolInfo,
    isError,
  } = api.getProfile.userPositionByPool.useQuery({ address: address, poolKey: pair.id })

  const {
    liquidity,
    token0Amount,
    token1Amount,
    // user_deposited_a, user_deposited_b,
  } = poolInfo || {
    liquidity: undefined,
    token0Amount: undefined,
    token1Amount: undefined,
    // user_deposited_a: undefined,
    // user_deposited_b: undefined,
  }

  const isLoading = useMemo(() => {
    return isLoadingPoolInfo
  }, [isLoadingPoolInfo])

  const _max_withdraw_a: Amount<Type> | undefined = token0Amount
    ? Amount.fromRawAmount(token0, token0Amount)
    : undefined
  const _max_withdraw_b: Amount<Type> | undefined = token1Amount
    ? Amount.fromRawAmount(token1, token1Amount)
    : undefined

  // const _user_deposited_a: Amount<Type> | undefined = user_deposited_a
  //   ? Amount.fromFractionalAmount(token0, user_deposited_a * 100, 100)
  //   : undefined
  // const _user_deposited_b: Amount<Type> | undefined = user_deposited_b
  //   ? Amount.fromFractionalAmount(token1, user_deposited_b * 100, 100)
  //   : undefined

  const value0 = useMemo(() => {
    return (prices[token0.uuid] * ((token0Amount || 0) / 100))
  }, [prices, token0, token0Amount])
  const value1 = useMemo(() => {
    return (prices[token1.uuid] * ((token1Amount || 0) / 100))
  }, [prices, token1, token1Amount])

  // const depositedUSD0 = useMemo(() => {
  //   return ((pricesAtTimestamp ? pricesAtTimestamp[token0.uuid] : 0) * Number(user_deposited_a?.toFixed(2))) / 100
  // }, [pricesAtTimestamp, token0, _user_deposited_a])

  // const depositedUSD1 = useMemo(() => {
  //   return ((pricesAtTimestamp ? pricesAtTimestamp[token1.uuid] : 0) * Number(user_deposited_b?.toFixed(2))) / 100
  // }, [pricesAtTimestamp, token1, _user_deposited_b])

  // const changeUSD0 = useMemo(() => {
  //   return value0 - depositedUSD0
  // }, [value0, depositedUSD0])

  // const changeUSD1 = useMemo(() => {
  //   return value1 - depositedUSD1
  // }, [value1, depositedUSD1])

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          liquidity,
          value0,
          value1,
          max_withdraw_a: _max_withdraw_a,
          max_withdraw_b: _max_withdraw_b,
          // user_deposited_a: _user_deposited_a,
          // user_deposited_b: _user_deposited_b,
          last_tx: 0,
          // changeUSD0,
          // changeUSD1,
          // depositedUSD0,
          // depositedUSD1,
          isLoading,
          isError,
        }),
        [
          liquidity,
          isError,
          isLoading,
          _max_withdraw_a,
          _max_withdraw_b,
          // _user_deposited_a,
          // _user_deposited_b,
          // depositedUSD0,
          // depositedUSD1,
          // changeUSD0,
          // changeUSD1,
          value0,
          value1,
          token0Amount,
          token1Amount,
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
