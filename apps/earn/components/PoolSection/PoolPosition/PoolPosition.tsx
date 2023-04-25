import { formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair, pairFromPool } from '../../../utils/Pair'
import { useBreakpoint } from '@dozer/hooks'
import { Typography } from '@dozer/ui'
import { FC, useMemo } from 'react'

// import { usePoolPosition } from '../../PoolPositionProvider'
// import { usePoolPositionStaked } from '../../PoolPositionStakedProvider'
import { PoolPositionDesktop } from './PoolPositionDesktop'
import { useAccount, useNetwork } from '@dozer/zustand'
import { Amount } from '@dozer/currency'
import toToken from '../../../utils/toToken'
import { useUnderlyingTokenBalanceFromPair } from '../../../utils/useUnderlyingTokenBalanceFromPair'
import { usePoolPosition } from '../../../utils/usePoolPosition'
// import { PoolPositionStakedDesktop } from './PoolPositionStakedDesktop'

// interface usePoolPositionProps {
//   pair: Pair
// }

// const usePoolPosition = ({ pair }: usePoolPositionProps) => {
//   const liquidityToken = pair.tokenLP
//   const BalanceLPToken = balance.find((token) => {
//     return token.token_uuid == liquidityToken.uuid
//   })
//   const BalanceLPAmount = Amount.fromRawAmount(toToken(pool.tokenLP), BalanceLPToken ? BalanceLPToken.token_balance : 0)
// }

interface PoolPositionProps {
  pair: Pair
  prices: { [key: string]: number }
}

export const PoolPosition: FC<PoolPositionProps> = ({ pair, prices }) => {
  const isLg = useBreakpoint('lg')

  const [underlying0, underlying1, BalanceLPAmount, value0, value1] = usePoolPosition({
    pair: pair,
    prices: prices,
  })

  const underlying = [underlying0, underlying1]

  if (!isLg) return <></>

  return (
    <div className="flex flex-col shadow-md bg-stone-800 rounded-2xl shadow-black/30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/5">
        <Typography weight={600} className="text-stone-50">
          My Position
        </Typography>
        <div className="flex flex-col">
          <Typography variant="sm" weight={600} className="text-right text-stone-50">
            {formatUSD(value0 + value1)}
          </Typography>
        </div>
      </div>
      <PoolPositionDesktop pair={pair} prices={prices} />
      {/* <PoolPositionStakedDesktop pair={pair} /> */}
    </div>
  )
}
