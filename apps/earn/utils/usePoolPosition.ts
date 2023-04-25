import { Amount, Token } from '@dozer/currency'
import { useBreakpoint } from '@dozer/hooks'
import { useAccount } from '@dozer/zustand'
import { useEffect, useMemo, useState } from 'react'
import toToken from './toToken'
import { useUnderlyingTokenBalanceFromPair } from './useUnderlyingTokenBalanceFromPair'
import { Pair } from './Pair'
import { useTotalSupply } from '@dozer/react-query'

interface Params {
  pair: Pair
  prices: { [key: string]: number }
}

type UsePoolPositionParams = (params: Params) => {
  underlying0: Amount<Token> | undefined
  underlying1: Amount<Token> | undefined
  BalanceLPAmount: Amount<Token>
  value0: number
  value1: number
  isLoading: boolean
  isError: boolean
}

export const usePoolPosition: UsePoolPositionParams = ({ pair, prices }) => {
  const token0 = pair.token0
  const token1 = pair.token1
  const liquidityToken = pair.tokenLP
  const { balance } = useAccount()

  const [totalSupply, setTotalSupply] = useState<Amount<Token>>()

  const data = useTotalSupply(liquidityToken.uuid, pair.chainId)

  useEffect(() => {
    if (data) {
      if (data.data && !data.isLoading) {
        setTotalSupply(Amount.fromRawAmount(liquidityToken, data.data['total']))
      }
    } else {
      // setBalance([])
    }
  }, [balance])

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

  return {
    underlying0: underlying0,
    underlying1: underlying1,
    BalanceLPAmount: BalanceLPAmount,
    value0: value0,
    value1: value1,
    isLoading: data.isLoading,
    isError: data.isError,
  }
}
