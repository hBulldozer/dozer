import { formatUSD } from '@dozer/format'
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
  prices?: Record<string, number>
  priceData?: {
    price: number
    change: number
    currency: 'USD' | 'HTR'
  }
}

export const TokenHeader: FC<TokenHeader> = ({ pair, prices = {}, priceData }) => {
  const token0 = pair.token0
  const token1 = pair.token1
  const token = pair.id.includes('native') ? token0 : token1

  // Format price change percentage
  const formatPriceChange = (change: number) => {
    const percentage = (change * 100).toFixed(2)
    return `${change >= 0 ? '+' : ''}${percentage}%`
  }

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
              <div className="flex gap-4 items-center">
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
      <AppearOnMount>
        <div className="flex flex-col gap-4 justify-between md:flex-row md:items-center">
          {/* Price and Change Display from Price Service */}
          {priceData && (
            <div className="flex items-center gap-4">
              <Typography variant="xl" weight={700} className="text-white text-3xl">
                {priceData.currency === 'USD'
                  ? formatUSD(priceData.price)
                  : `${priceData.price.toFixed(8)} HTR`}
              </Typography>
              {priceData.change !== undefined && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-semibold ${
                    priceData.change >= 0
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}
                >
                  <span>{formatPriceChange(priceData.change)}</span>
                  <svg
                    className={`w-4 h-4 ${priceData.change >= 0 ? 'rotate-0' : 'rotate-180'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 justify-between items-center md:justify-end"></div>
          </div>
        </div>
      </AppearOnMount>
    </div>
  )
}
