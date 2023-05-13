import { Amount, Token, Type } from '@dozer/currency'
import { FundSource } from '@dozer/hooks'
import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { useAccount } from '@dozer/zustand'
import { Pair } from '../utils/Pair'
import { useTokensFromPair } from '../utils/useTokensFromPair'
import { useUnderlyingTokenBalanceFromPair } from '../utils/useUnderlyingTokenBalanceFromPair'
import { useTotalSupply } from '@dozer/react-query'
import { isError } from '@tanstack/react-query'

interface PoolPositionContext {
  BalanceLPAmount: Amount<Type> | undefined
  value0: number
  value1: number
  underlying0: Amount<Type> | undefined
  underlying1: Amount<Type> | undefined
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
  const token0 = pair.token0
  const token1 = pair.token1
  const liquidityToken = pair.tokenLP
  const { balance, address } = useAccount()

  const [totalSupply, setTotalSupply] = useState<Amount<Token>>()

  const [BalanceLPAmount, setBalanceLPAmount] = useState<Amount<Token> | undefined>(undefined)

  const { data, isLoading, isError } = useTotalSupply(liquidityToken.uuid, pair.chainId)
  const [reserve0, reserve1] = useMemo(() => {
    return [Amount.fromRawAmount(token0, Number(pair?.reserve0)), Amount.fromRawAmount(token1, Number(pair?.reserve1))]
  }, [pair?.reserve0, pair?.reserve1])

  useEffect(() => {
    if (data && !isLoading && !isError && data['total']) {
      setTotalSupply(Amount.fromRawAmount(liquidityToken, data['total']))

      const BalanceLPToken = balance.find((token) => {
        return token.token_uuid == liquidityToken.uuid
      })
      setBalanceLPAmount(Amount.fromRawAmount(liquidityToken, BalanceLPToken ? BalanceLPToken.token_balance : 0))
    }
  }, [balance, pair, prices, data, isLoading, isError, address])

  const [underlying0, underlying1] = useUnderlyingTokenBalanceFromPair({
    reserve0,
    reserve1,
    totalSupply,
    balance: BalanceLPAmount,
  })

  const value0 = useMemo(() => {
    return prices[token0.uuid] * Number(underlying0?.toFixed(2))
  }, [prices, token0, underlying0])
  const value1 = useMemo(() => {
    return prices[token1.uuid] * Number(underlying1?.toFixed(2))
  }, [prices, token1, underlying1])

  return (
    <Context.Provider
      value={useMemo(
        () => ({
          BalanceLPAmount,
          value0,
          value1,
          underlying0,
          underlying1,
          isLoading,
          isError,
        }),
        [BalanceLPAmount, isError, isLoading, underlying0, underlying1, value0, value1]
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
