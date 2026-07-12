import {
  AppearOnMount,
  BreadcrumbLink,
  Button,
  Dialog,
  LoadingOverlay,
  Typography,
  Currency,
  Chip,
  TokenTradingHistorySection,
  AvailablePoolsWidget,
} from '@dozer/ui'
import { formatUSD } from '@dozer/format'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useState } from 'react'
import { Layout } from 'components/Layout'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../utils/api'
import { SwapWidget } from 'pages'
import { TokenStats } from 'components/TokenPage/TokenStats'
import ReadMore from '@dozer/ui/readmore/ReadMore'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import { toToken } from '@dozer/api'
import { TokenChart } from 'components/TokenPage/TokenChart'
import Image from 'next/image'
import { customAbouts } from '../../../data/tokens'

export const config = {
  maxDuration: 60,
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  try {
    const tokens = await ssg.getTokens.all.fetch()
    if (!tokens) return { paths: [], fallback: 'blocking' }
    const paths = tokens
      ?.filter((token) => !token.custom)
      .map((token) => ({
        params: { symbol: token.symbol.toLowerCase() },
      }))
    return { paths, fallback: 'blocking' }
  } catch (error) {
    console.error('Error generating static paths for tokens:', error)
    return { paths: [], fallback: 'blocking' }
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const symbol = params?.symbol as string
  if (!symbol) return { notFound: true }
  const ssg = generateSSGHelper()
  try {
    await ssg.getTokens.bySymbolDetailed.prefetch({ symbol: symbol.toUpperCase() })
    await ssg.getTokens.prices.prefetch()
    return {
      props: {
        trpcState: ssg.dehydrate(),
      },
      revalidate: 60,
    }
  } catch (error) {
    console.error(`Error fetching data for token ${symbol}:`, error)
    return { notFound: true }
  }
}

const LINKS = ({ symbol, name }: { symbol: string; name: string }): BreadcrumbLink[] => [
  {
    href: `/tokens`,
    label: 'Tokens',
  },
  {
    href: `/tokens/${symbol.toLowerCase()}`,
    label: name,
  },
]

const Token = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const symbol = router.query.symbol as string

  const { data: tokenData, isLoading: isLoadingToken } = api.getTokens.bySymbolDetailed.useQuery(
    { symbol: symbol?.toUpperCase() || '' },
    {
      enabled: !!symbol,
      // Prevent client-side refetch when ISR/SSG dehydrated state is fresh.
      // Without this, staleTime=0 (default) causes an immediate background refetch that
      // joins Batch A and adds 18s to the chart batch on tokens without a warm ISR cache.
      staleTime: 30000,
    }
  )
  const { data: prices = {}, isLoading: isLoadingPrices } = api.getPrices.allUSD.useQuery()

  // historyReady: fires 1.5s AFTER tokenData arrives — not after mount.
  //
  // Why not after mount? TokenChart only renders when aggregatedPair is non-null, which
  // requires tokenData. So TokenChart's own chartReady fires the same millisecond tokenData
  // arrives, enabling getTokenChartData. If historyReady depended on mount time, it would
  // already be true when tokenData arrives → both chart + history enable simultaneously →
  // same tRPC batch → 52s timeout.
  //
  // With this approach:
  //   T=0:       bySymbolDetailed fires (initial batch, or served from ISR cache)
  //   T=X:       tokenData arrives → TokenChart mounts → chart fires (Batch A)
  //   T=X+1500ms: historyReady fires → history fires (Batch B, separate HTTP request)
  //
  // Each batch has its own 60s Vercel limit. Neither should exceed it.
  const [historyReady, setHistoryReady] = useState(false)
  useEffect(() => {
    if (!tokenData?.uuid) return
    const t = setTimeout(() => setHistoryReady(true), 1500)
    return () => clearTimeout(t)
  }, [tokenData?.uuid])

  // Fetch transaction history for trading history (filter client-side)
  const {
    data: transactionData,
    isLoading: isLoadingTransactions,
    error: transactionError,
  } = api.getPools.getAllTransactionHistory.useQuery(
    {
      count: 50,                          // was 200 — fewer records = faster node scan
      tokenFilter: tokenData?.uuid,       // server-side filter so node only returns relevant txs
    },
    {
      enabled: historyReady, // tokenData.uuid is guaranteed present when historyReady fires
      staleTime: 30000,
      refetchOnWindowFocus: false,
    }
  )

  const isLoading = isLoadingToken || isLoadingPrices

  if (!symbol) return <div>Invalid token symbol</div>

  if (isLoading || !tokenData) {
    return (
      <Layout breadcrumbs={[]}>
        <LoadingOverlay show={true} />
      </Layout>
    )
  }

  const primaryPool = tokenData.pools.length > 0 ? tokenData.pools[0] : null
  const aggregatedPair = primaryPool
    ? {
        id: tokenData.symbol === 'HTR' ? 'native' : `${tokenData.symbol.toLowerCase()}-aggregated`,
        symbolId: tokenData.symbol === 'HTR' ? 'native' : `${tokenData.symbol.toLowerCase()}-aggregated`,
        name: tokenData.name,
        liquidityUSD: tokenData.totalLiquidityUSD,
        volumeUSD: tokenData.totalVolumeUSD,
        feeUSD: tokenData.totalFeesUSD,
        swapFee: primaryPool.swapFee,
        apy:
          tokenData.pools.length > 0
            ? tokenData.pools.reduce((sum, pool) => sum + pool.apy, 0) / tokenData.pools.length
            : 0,
        token0:
          tokenData.symbol === 'HTR'
            ? toToken({ uuid: '00', symbol: 'HTR', name: 'Hathor' })
            : toToken({ uuid: '00', symbol: 'HTR', name: 'Hathor' }),
        token1:
          tokenData.symbol === 'HTR'
            ? toToken(primaryPool.token0.uuid === '00' ? primaryPool.token1 : primaryPool.token0)
            : toToken(tokenData),
        reserve0:
          tokenData.symbol === 'HTR'
            ? primaryPool.token0.uuid === '00'
              ? primaryPool.reserve0
              : primaryPool.reserve1
            : primaryPool.reserve0,
        reserve1:
          tokenData.symbol === 'HTR'
            ? primaryPool.token0.uuid === '00'
              ? primaryPool.reserve1
              : primaryPool.reserve0
            : primaryPool.reserve1,
        chainId: primaryPool.chainId,
        liquidity: tokenData.totalLiquidityUSD, // Use API aggregated value instead of re-calculating
        volume1d: tokenData.totalVolumeUSD,
        fees1d: tokenData.totalFeesUSD,
        hourSnapshots: [],
        daySnapshots: [],
      }
    : null

  const currentToken = aggregatedPair?.token1
  const primaryPoolForSwap = primaryPool || null
  const totalLiquidityUSD = tokenData.pools.reduce((sum, pool) => sum + pool.liquidityUSD, 0)

  return (
    <>
      <Layout breadcrumbs={LINKS({ symbol: tokenData.symbol, name: tokenData.name })}>
        <LoadingOverlay show={isLoading} />
        <BlockTracker client={api} />
        <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
          <div className="flex flex-col order-1 gap-6">
            {aggregatedPair && <TokenChart pair={aggregatedPair} setIsDialogOpen={setIsDialogOpen} />}
            <div className="flex flex-col gap-4">
              <Typography weight={500} variant="h1">
                Stats
              </Typography>
              <TokenStats
                totalLiquidityUSD={totalLiquidityUSD}
                totalVolumeUSD={tokenData.totalVolumeUSD}
                totalFeesUSD={tokenData.totalFeesUSD}
                marketCap={tokenData.marketCap}
              />
              {(() => {
                const customAbout = customAbouts[tokenData.symbol.toUpperCase()]
                const poolText = tokenData.poolCount === 1 ? 'pool' : 'pools'
                const tradingLine = `It can be traded in ${tokenData.poolCount} liquidity ${poolText}.`

                const isCommunityToken =
                  tokenData.metadataSource === 'dozer-tools' || tokenData.metadataSource === 'khensu'

                let aboutText: string
                if (customAbout) {
                  // Manually curated description for known tokens — always takes priority
                  aboutText = `${customAbout} ${tradingLine}`
                } else if (tokenData.about && isCommunityToken) {
                  // Community token: use the description stored on-chain
                  aboutText = `${tokenData.about} ${tradingLine}`
                } else if (isCommunityToken) {
                  // Community token without an on-chain description — generic, source-aware fallback
                  const source = tokenData.metadataSource === 'khensu' ? 'launched on Khensu' : 'created with Dozer Tools'
                  aboutText = `${tokenData.symbol} is a community token ${source} on the Hathor network. ${tradingLine}`
                } else if (tokenData.bridged) {
                  aboutText = `${tokenData.symbol} is a token on the Hathor network with a total supply of ${tokenData.totalSupply.toLocaleString()} tokens. It is available for trading in ${tokenData.poolCount} liquidity ${poolText}.`
                } else if (tokenData.symbol === 'HTR') {
                  aboutText = `${tokenData.symbol} is the native token of the Hathor network. It can be staked, used for transaction fees, and traded in ${tokenData.poolCount} liquidity ${poolText}.`
                } else {
                  aboutText = `${tokenData.symbol} is a token on the Hathor network. ${tradingLine}`
                }

                return (
                  <>
                    <Typography weight={500} className="flex flex-col" variant="h2">
                      About
                    </Typography>
                    <ReadMore text={aboutText} />
                  </>
                )
              })()}
            </div>
            <TokenTradingHistorySection
              tokenUuid={tokenData.uuid}
              tokenSymbol={tokenData.symbol}
              transactions={transactionData?.transactions || []}
              pricesUSD={prices}
              loading={isLoadingTransactions}
              error={transactionError?.message}
            />
          </div>
          <div className="flex-col order-2 hidden gap-4 lg:flex">
            <AppearOnMount>
              {primaryPoolForSwap ? (
                <SwapWidget
                  token0_idx={
                    tokenData.symbol === 'HTR'
                      ? (() => {
                          // Find hUSDC token dynamically by symbol
                          const husdcToken = tokenData.pools
                            .flatMap((pool) => [pool.token0, pool.token1])
                            .find((token) => token.symbol === 'hUSDC')
                          return husdcToken?.uuid || '00'
                        })()
                      : '00' // HTR for other tokens
                  }
                  token1_idx={tokenData.uuid}
                />
              ) : (
                <div className="p-6 text-center rounded-lg shadow-md bg-stone-800 shadow-black/20">
                  <Typography className="text-stone-400">No pools available for swapping</Typography>
                </div>
              )}
            </AppearOnMount>
            <AvailablePoolsWidget pools={tokenData.pools} currentToken={tokenData} />
          </div>
        </div>
        {currentToken && (
          <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
            <Dialog.Content>
              <Dialog.Header title="Community Token Image" onClose={() => setIsDialogOpen(false)} />
              {toToken(currentToken).imageUrl && (
                <div className="flex justify-center items-center w-full max-h-[80vh] overflow-hidden">
                  <Image
                    src={toToken(currentToken).imageUrl || ''}
                    alt="Community Token Image"
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
              )}
            </Dialog.Content>
          </Dialog>
        )}
      </Layout>
      <AppearOnMount as={Fragment}>
        <div className="fixed left-0 right-0 flex justify-center bottom-6 lg:hidden">
          <div>
            <div className="divide-x rounded-xl min-w-[95vw] shadow-md shadow-black/50 bg-yellow divide-stone-800">
              <Button
                size="md"
                as="a"
                href={
                  primaryPoolForSwap
                    ? `/swap?token0=${
                        tokenData.symbol === 'HTR'
                          ? (() => {
                              // Find hUSDC token dynamically by symbol
                              const husdcToken = tokenData.pools
                                .flatMap((pool) => [pool.token0, pool.token1])
                                .find((token) => token.symbol === 'hUSDC')
                              return husdcToken?.uuid || '00'
                            })()
                          : '00' // HTR for other tokens
                      }&token1=${tokenData.uuid}&chainId=${primaryPoolForSwap.chainId}`
                    : undefined
                }
                className={!primaryPoolForSwap ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {primaryPoolForSwap ? 'Swap' : 'No Pools Available'}
              </Button>
            </div>
          </div>
        </div>
      </AppearOnMount>
    </>
  )
}

export default Token
