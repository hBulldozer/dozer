import React, { useState } from 'react'
import { Currency, CopyHelper, IconButton, Link, Typography } from '@dozer/ui'
import { Pair, toToken } from '@dozer/api'
import { ArrowTopRightOnSquareIcon, Square2StackIcon } from '@heroicons/react/24/outline'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { api } from '../../utils/api'
import { TwitterIcon, TelegramIcon } from '@dozer/ui'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'
import PriceChart, { TimeRangeOption } from './PriceChart'

interface TokenChartProps {
  pair: Pair
  setIsDialogOpen(isDialogOpen: boolean): void
}

export const TokenChartNew: React.FC<TokenChartProps> = ({ pair, setIsDialogOpen }) => {
  const { token0, token1 } = pair
  const token = pair.id.includes('native') ? token0 : token1
  const { data: socialURLs } = api.getTokens.socialURLs.useQuery({ uuid: token.uuid })
  
  // Use the tokenId based on the pair type
  const tokenId = pair.id.includes('native') ? '00' : token.uuid
  
  // Set initial currency based on pair type
  const initialCurrency = pair.id.includes('native') ? 'USD' : 'HTR'
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between gap-5 mr-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={pair.token1.imageUrl ? 'cursor-pointer' : ''}>
              <Currency.Icon currency={toToken(token)} width={32} height={32} onClick={() => setIsDialogOpen(true)} />
            </div>
            
            {/* Social links and token info */}
            <Typography variant="lg" weight={600}>
              {token.name}
            </Typography>
            <Typography variant="lg" weight={600} className="text-stone-400">
              {token.symbol}
            </Typography>
            <div className="flex flex-row items-center gap-2 ml-2">
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
              <Link.External href={chains[pair.chainId].getTokenUrl(pair.id == 'native' ? token0.uuid : token1.uuid)}>
                <IconButton className="p-1 text-stone-400" description={'View on explorer'}>
                  <ArrowTopRightOnSquareIcon width={20} height={20} color="stone-500" />
                </IconButton>
              </Link.External>
              {socialURLs && socialURLs.twitter && (
                <Link.External href={`https://twitter.com/${socialURLs.twitter}`}>
                  <IconButton className="p-1 text-stone-400" description={'Twitter'}>
                    <TwitterIcon width={20} height={20} className="text-stone-500" />
                  </IconButton>
                </Link.External>
              )}
              {socialURLs && socialURLs.telegram && (
                <Link.External href={`https://t.me/${socialURLs.telegram}`}>
                  <IconButton className="p-1 text-stone-400" description={'Telegram'}>
                    <TelegramIcon width={20} height={20} className="text-stone-500" />
                  </IconButton>
                </Link.External>
              )}
              {socialURLs && socialURLs.website && (
                <Link.External href={`https://${socialURLs.website}`}>
                  <IconButton className="p-1 text-stone-400" description={'Website'}>
                    <GlobeAltIcon width={20} height={20} className="text-stone-500" />
                  </IconButton>
                </Link.External>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Use the new PriceChart component */}
      <PriceChart
        tokenId={tokenId}
        initialCurrency={initialCurrency as 'USD' | 'HTR'}
        symbol={token.symbol}
        name={token.name}
        height={400}
        showControls={true}
        showCurrencyToggle={true}
      />
    </div>
  )
}

export default TokenChartNew
