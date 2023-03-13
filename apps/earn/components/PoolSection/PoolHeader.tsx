import { ExternalLinkIcon } from '@heroicons/react/solid'
import chains from '@dozer/chain'
import { Price } from '@dozer/currency'
import { formatPercent, formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '../../utils/Pair'
import { AppearOnMount, Currency, Link, NetworkIcon, Typography } from '@dozer/ui'
// import { usePrices } from '@dozer/wagmi'
import { usePrices } from '@dozer/react-query'
import { FC, useMemo } from 'react'

// import { useTokensFromPair } from '../../lib/hooks'
import { useTokensFromPair } from '../../utils/useTokensFromPair'
import { FarmRewardsAvailableTooltip } from '../FarmRewardsAvailableTooltip'

interface PoolHeader {
  pair: Pair
}

export const PoolHeader: FC<PoolHeader> = ({ pair }) => {
  const { data: prices } = usePrices(pair.chainId)
  // console.log({ pair })
  const { token0, token1, reserve1, reserve0, liquidityToken } = useTokensFromPair(pair)
  const price = useMemo(() => new Price({ baseAmount: reserve0, quoteAmount: reserve1 }), [reserve0, reserve1])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex gap-1">
          <NetworkIcon type="naked" chainId={pair.chainId} width={16} height={16} />
          <Typography variant="xs" className="text-stone-500">
            {/* {chains[pair.chainId].name} */}
            HATHOR
          </Typography>
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex">
            <Currency.IconList iconWidth={44} iconHeight={44}>
              <Currency.Icon currency={token0} />
              <Currency.Icon currency={token1} />
            </Currency.IconList>
            <Link.External
              className="flex flex-col !no-underline group"
              // href={chains[pair.chainId].getTokenUrl(liquidityToken.uuid)}
            >
              <div className="flex items-center gap-2">
                <Typography
                  variant="lg"
                  className="flex items-center gap-1 text-stone-50 group-hover:text-yellow-400"
                  weight={600}
                >
                  {token0.symbol}/{token1.symbol}
                  <ExternalLinkIcon width={20} height={20} className="text-stone-400 group-hover:text-yellow-400" />
                </Typography>
              </div>
              <Typography variant="xs" className="text-stone-300">
                Fee: 1%
                {/* {pair.swapFee / 100}% */}
              </Typography>
            </Link.External>
          </div>
          <div className="flex flex-col gap-1">
            <Typography weight={400} as="span" className="text-stone-400 sm:text-right">
              APR: <span className="font-semibold text-stone-50">{formatPercent(pair.apr)}</span>
              {/* {pair.incentiveApr > 0 ? <FarmRewardsAvailableTooltip /> : ''} */}
            </Typography>
            <div className="flex gap-2">
              {/* {pair.incentiveApr > 0 && (
                <Typography variant="sm" weight={400} as="span" className="text-stone-400">
                  Rewards: {formatPercent(pair.incentiveApr)}
                </Typography>
              )} */}
              <Typography variant="sm" weight={400} as="span" className="text-stone-400">
                Fees: {formatPercent(1)}
              </Typography>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex gap-3 p-3 rounded-lg shadow-md bg-stone-800 shadow-black/10">
          <Currency.Icon currency={token0} width={20} height={20} />
          <Typography variant="sm" weight={600} className="text-stone-300">
            <AppearOnMount>
              {token0.symbol} ={' '}
              {prices?.[token1.uuid]
                ? // ? formatUSD(Number(price.toFixed(6)) * Number(prices[token1.uuid].toSignificant(6)))
                  formatUSD(100)
                : `$0.00`}
            </AppearOnMount>
          </Typography>
        </div>
        <div className="flex gap-3 p-3 rounded-lg shadow-md bg-stone-800 shadow-black/10">
          <Currency.Icon currency={token1} width={20} height={20} />
          <Typography variant="sm" weight={600} className="text-stone-300">
            <AppearOnMount>
              {token1.symbol} ={' '}
              {prices?.[token0.uuid]
                ? // ? formatUSD(Number(prices[token0.uuid].toSignificant(6)) / Number(price.toSignificant(6)))
                  formatUSD(100)
                : '$0.00'}{' '}
            </AppearOnMount>
          </Typography>
        </div>
      </div>
    </div>
  )
}
