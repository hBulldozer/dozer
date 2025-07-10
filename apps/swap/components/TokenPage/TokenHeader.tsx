import { ArrowTopRightOnSquareIcon, Square2StackIcon } from '@heroicons/react/24/solid'
import chains from '@dozer/chain'
import { Price } from '@dozer/currency'
import { formatPercent, formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair, toToken } from '@dozer/api'
import { AppearOnMount, CopyHelper, Currency, IconButton, Link, NetworkIcon, Typography } from '@dozer/ui'
import { FC, useMemo } from 'react'

// import { useTokensFromPair } from '../../lib/hooks'
import { useTokensFromPair } from '@dozer/api'
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
    <div className="flex gap-2 items-center">
      <div className={pair.token1.imageUrl ? 'cursor-pointer' : ''}>
        <Currency.Icon currency={toToken(token)} width={32} height={32} />
      </div>
      <Typography variant="lg" weight={600}>
        {token.name}
      </Typography>
      <Typography variant="lg" weight={600} className="text-stone-400">
        {token.symbol}
      </Typography>
      <div className="flex flex-row gap-2 items-center ml-2">
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
            <IconButton className="p-1 text-stone-400" description={isCopied ? 'Copied!' : 'Configuration String'}>
              <Square2StackIcon width={20} height={20} color="stone-500" />
            </IconButton>
          )}
        </CopyHelper>
        <Link.External href={chains[pair.chainId].getTokenUrl(pair.id == 'native' ? token0.uuid : token1.uuid)}>
          <IconButton className="p-1 text-stone-400" description={'View on explorer'}>
            <ArrowTopRightOnSquareIcon width={20} height={20} color="stone-500" />
          </IconButton>
        </Link.External>
      </div>
    </div>
  )
}
