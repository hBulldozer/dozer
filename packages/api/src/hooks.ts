import { Amount, Token } from '@dozer/currency'
import { Pair } from './types'
import { useMemo } from 'react'
import { ZERO } from '@dozer/math'

interface Params {
  totalSupply: Amount<Token> | undefined
  reserve0: Amount<Token> | undefined
  reserve1: Amount<Token> | undefined
  balance: Amount<Token> | undefined
}

type UseUnderlyingTokenBalanceFromPairParams = (
  params: Params
) => [Amount<Token> | undefined, Amount<Token> | undefined]

export const useUnderlyingTokenBalanceFromPair: UseUnderlyingTokenBalanceFromPairParams = ({
  balance,
  totalSupply,
  reserve1,
  reserve0,
}) => {
  return useMemo(() => {
    if (!balance || !totalSupply || !reserve0 || !reserve1) {
      return [undefined, undefined]
    }

    if (totalSupply.equalTo(ZERO)) {
      return [
        Amount.fromRawAmount(reserve0.wrapped.currency, '0'),
        Amount.fromRawAmount(reserve1.wrapped.currency, '0'),
      ]
    }

    return [
      reserve0.wrapped.multiply(balance.wrapped.divide(totalSupply)),
      reserve1.wrapped.multiply(balance.wrapped.divide(totalSupply)),
    ]
  }, [balance, reserve0, reserve1, totalSupply])
}

export const useTokensFromPair = (pair: Pair) => {
  return useMemo(() => {
    const { token0, token1, reserve0, reserve1 } = pair
    return {
      token0,
      token1,
      reserve0: Amount.fromFractionalAmount(token0, Math.floor(Number(reserve0) * 100) || 0, 1),
      reserve1: Amount.fromFractionalAmount(token1, Math.floor(Number(reserve1) * 100) || 0, 1),
    }
  }, [pair])
}
