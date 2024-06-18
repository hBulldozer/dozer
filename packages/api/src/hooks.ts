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
    const _token0 = new Token({
      uuid: pair.token0.uuid,
      name: pair.token0.name,
      decimals: pair.token0.decimals,
      symbol: pair.token0.symbol,
      chainId: pair.chainId,
    })

    const _token1 = new Token({
      uuid: pair.token1.uuid,
      name: pair.token1.name,
      decimals: pair.token1.decimals,
      symbol: pair.token1.symbol,
      chainId: pair.chainId,
    })

    const [token0, token1] = [_token0, _token1]

    return {
      token0,
      token1,

      reserve0: Amount.fromFractionalAmount(token0, Number(pair.reserve0)*100,100 || 0),
      reserve1: Amount.fromFractionalAmount(token1, Number(pair.reserve1)*100,100 || 0),
    }
  }, [
    pair.chainId,
    pair.id,
    pair.reserve0,
    pair.reserve1,
    pair.token0.decimals,
    pair.token0.uuid,
    pair.token0.name,
    pair.token0.symbol,
    pair.token1.decimals,
    pair.token1.uuid,
    pair.token1.name,
    pair.token1.symbol,
    pair.liquidity,
  ])
}
