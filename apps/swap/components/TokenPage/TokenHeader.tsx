import { formatPercent, formatUSD } from '@dozer/format'
import { Pair, toToken } from '@dozer/api'
import {
  AppearOnMount,
  CopyHelper,
  Currency,
  IconButton,
  Link,
  NetworkIcon,
  Typography,
  Button,
  TwitterIcon,
  TelegramIcon,
  ArrowIcon,
} from '@dozer/ui'
import { FC, useMemo } from 'react'
import { ArrowTopRightOnSquareIcon, Square2StackIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'
import { formatPercentChange } from '@dozer/format'
import { api } from '../../utils/api'

interface TokenHeader {
  pair: Pair
  prices?: Record<string, number>
}

export const TokenHeader: FC<TokenHeader> = ({ pair, prices = {} }) => {
  const token0 = pair.token0
  const token1 = pair.token1
  const token = pair.id.includes('native') ? token0 : token1
  // Get price from getPrices router - prices are already formatted by API
  const price = prices[token.uuid] || 0

  // Fetch 24h price change
  const { data: priceChangeData } = api.getPrices.priceChange.useQuery(
    { tokenUid: token.uuid },
    {
      enabled: !!token.uuid,
      staleTime: 60000, // Cache for 1 minute
      refetchInterval: 60000, // Refresh every minute
    }
  )

  const change = priceChangeData?.change ?? 0

  return (
    <div className="flex flex-col gap-4">
      <AppearOnMount>
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={pair.token1.imageUrl ? 'cursor-pointer' : ''}>
                <Currency.Icon currency={toToken(token)} width={32} height={32} />
              </div>
              <Typography variant="lg" weight={600}>
                {token.name}
              </Typography>
            </div>
          </div>
        </div>
      </AppearOnMount>
      <AppearOnMount>
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div className="flex flex-col">
            <Typography variant="xl" weight={600} className="text-white">
              {formatUSD(price)}
            </Typography>
            <div className="flex items-center gap-2">
              <ArrowIcon type={change < 0 ? 'down' : 'up'} className={change < 0 ? 'text-red-400' : 'text-green-400'} />
              <Typography variant="sm" className={change < 0 ? 'text-red-400' : 'text-green-400'}>
                {formatPercentChange(change)}
              </Typography>
              <Typography variant="sm" className="text-stone-400">
                24H
              </Typography>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <div className="flex items-center gap-4">
                <CopyHelper
                  toCopy={
                    pair.id == 'native'
                      ? hathorLib.tokensUtils.getConfigurationString(
                          pair.token0.uuid,
                          pair.token0.name || '',
                          pair.token0.symbol || ''
                        )
                      : hathorLib.tokensUtils.getConfigurationString(
                          pair.token1.uuid,
                          pair.token1.name || '',
                          pair.token1.symbol || ''
                        )
                  }
                  hideIcon={true}
                >
                  {(isCopied) => (
                    <IconButton
                      className="p-1 text-stone-400"
                      description={isCopied ? 'Copied!' : 'Configuration String'}
                    >
                      <Square2StackIcon width={20} height={20} color="stone-500" />
                    </IconButton>
                  )}
                </CopyHelper>
              </div>
            </div>
          </div>
        </div>
      </AppearOnMount>
    </div>
  )
}
