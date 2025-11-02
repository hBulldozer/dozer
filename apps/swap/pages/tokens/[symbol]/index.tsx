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
import { Fragment, useState } from 'react'
import { Layout } from 'components/Layout'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../utils/api'
import { SwapWidget } from 'pages'
import { TokenStats } from 'components/TokenPage/TokenStats'
import { TokenChart } from 'components/TokenPage/TokenChart'
import ReadMore from '@dozer/ui/readmore/ReadMore'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import { toToken } from '@dozer/api'
import { TokenHeader } from 'components/TokenPage/TokenHeader'
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
      revalidate: 3600,
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
    { enabled: !!symbol }
  )
  const { data: prices = {}, isLoading: isLoadingPrices } = api.getPrices.allUSD.useQuery()

  // Fetch transaction history for trading history (filter client-side)
  const {
    data: transactionData,
    isLoading: isLoadingTransactions,
    error: transactionError,
  } = api.getPools.getAllTransactionHistory.useQuery(
    {
      count: 200, // Get more to filter client-side
      // Remove tokenFilter - we'll filter client-side for better results
    },
    {
      enabled: !!tokenData?.uuid,
      staleTime: 30000, // Cache for 30 seconds
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
        id: primaryPool.id, // Use real pool ID for history API
        symbolId: tokenData.symbol === 'HTR' ? 'native' : `${tokenData.symbol.toLowerCase()}-aggregated`,
        name: tokenData.name,
        liquidityUSD: tokenData.totalLiquidityUSD,
        volumeUSD: tokenData.totalVolumeUSD,
        feeUSD: tokenData.totalFeesUSD,
        swapFee: primaryPool.swapFee,
        apr:
          tokenData.pools.length > 0
            ? tokenData.pools.reduce((sum, pool) => sum + pool.apr, 0) / tokenData.pools.length
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

  return (
    <>
      <Layout breadcrumbs={LINKS({ symbol: tokenData.symbol, name: tokenData.name })}>
        <LoadingOverlay show={isLoading} />
        <BlockTracker client={api} />
        <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
          <div className="flex flex-col order-1 gap-6">
            {aggregatedPair && <TokenChart pair={aggregatedPair} />}
            <div className="flex flex-col gap-4">
              <Typography weight={500} variant="h1">
                Stats
              </Typography>
              {aggregatedPair && <TokenStats pair={aggregatedPair} prices={prices} />}
              {(() => {
                const customAbout = customAbouts[tokenData.symbol.toUpperCase()]
                const poolText = tokenData.poolCount === 1 ? 'pool' : 'pools'
                const aboutText = customAbout
                  ? `${customAbout} It can be traded in ${tokenData.poolCount} liquidity ${poolText}.`
                  : tokenData.bridged
                  ? `${
                      tokenData.symbol
                    } is a token on the Hathor network with a total supply of ${tokenData.totalSupply.toLocaleString()} tokens. It is available for trading in ${
                      tokenData.poolCount
                    } liquidity ${poolText}.`
                  : `${tokenData.symbol} is the native token of the Hathor network. It can be staked, used for transaction fees, and traded in ${tokenData.poolCount} liquidity ${poolText}.`

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
          <div className="hidden flex-col order-2 gap-4 lg:flex">
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
        <div className="flex fixed right-0 left-0 bottom-6 justify-center lg:hidden">
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
