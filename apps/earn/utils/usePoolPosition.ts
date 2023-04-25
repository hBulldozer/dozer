import { Amount, Token } from '@dozer/currency'
import { useBreakpoint } from '@dozer/hooks'
import { useAccount } from '@dozer/zustand'
import { useMemo } from 'react'
import toToken from './toToken'
import { useUnderlyingTokenBalanceFromPair } from './useUnderlyingTokenBalanceFromPair'
import { Pair } from './Pair'

interface Params {
  pair: Pair
  prices: { [key: string]: number }
}

type UsePoolPositionParams = (
  params: Params
) => [Amount<Token> | undefined, Amount<Token> | undefined, Amount<Token>, number, number]

export const usePoolPosition: UsePoolPositionParams = ({ pair, prices }) => {
  const token0 = toToken(pair.token0)
  const token1 = toToken(pair.token1)
  const liquidityToken = toToken(pair.tokenLP)
  const { balance } = useAccount()

  const totalSupply = Amount.fromRawAmount(liquidityToken, Number(pair.tokenLP.totalSupply))

  const [reserve0, reserve1] = useMemo(() => {
    return [Amount.fromRawAmount(token0, Number(pair?.reserve0)), Amount.fromRawAmount(token1, Number(pair?.reserve1))]
  }, [pair?.reserve0, pair?.reserve1])

  const BalanceLPToken = balance.find((token) => {
    return token.token_uuid == liquidityToken.uuid
  })
  const BalanceLPAmount = Amount.fromRawAmount(liquidityToken, BalanceLPToken ? BalanceLPToken.token_balance : 0)

  const underlying = useUnderlyingTokenBalanceFromPair({
    reserve0,
    reserve1,
    totalSupply,
    balance: BalanceLPAmount,
  })

  const [underlying0, underlying1] = underlying

  const value0 = prices[token0.uuid] * Number(underlying0?.toFixed(2))
  const value1 = prices[token1.uuid] * Number(underlying1?.toFixed(2))

  return [underlying0, underlying1, BalanceLPAmount, value0, value1]
}
