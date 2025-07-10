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
} from '@dozer/ui'
import { FC, useMemo } from 'react'
import { ArrowTopRightOnSquareIcon, Square2StackIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'

interface TokenHeader {
  pair: Pair
}

export const TokenHeader: FC<TokenHeader> = ({ pair }) => {
  const token0 = pair.token0
  const token1 = pair.token1
  const token = pair.id.includes('native') ? token0 : token1
  const price = Number(pair.reserve0) / Number(pair.reserve1)

  return (
    <div className="flex flex-col gap-4">
      <AppearOnMount>
        <div className="flex flex-col gap-4 justify-between md:flex-row">
          <div className="flex gap-4 items-center">
            <div className="flex gap-2 items-center">
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
        <div className="flex flex-col gap-4 justify-between md:flex-row">
          <div className="flex flex-col">
            <Typography variant="xl" weight={600} className="text-white">
              {formatUSD(price)}
            </Typography>
            <div className="flex gap-2 items-center">
              <Typography variant="sm" className="text-green-400">
                {formatPercent(0.05)}
              </Typography>
              <Typography variant="sm" className="text-stone-400">
                24H
              </Typography>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 justify-between items-center md:justify-end">
              <div className="flex gap-4 items-center">
                <IconButton className="p-1 text-stone-400" description={token.uuid}>
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
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </AppearOnMount>
    </div>
  )
}
