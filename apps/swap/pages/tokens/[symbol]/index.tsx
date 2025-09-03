import { AppearOnMount, BreadcrumbLink, Button, Dialog, LoadingOverlay, Typography, Currency, Chip } from '@dozer/ui'
import { formatUSD } from '@dozer/format'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { Layout } from 'components/Layout'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../utils/api'
import { SwapWidget } from 'pages'
import { TokenStats } from 'components/TokenPage/TokenStats'
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
            {aggregatedPair && <>{/* <TokenChart pair={aggregatedPair} setIsDialogOpen={setIsDialogOpen} /> */}</>}
            {aggregatedPair && <TokenHeader pair={aggregatedPair} prices={prices} />}
            <div className="flex flex-col gap-4">
              <Typography weight={500} variant="h1">
                Stats
              </Typography>
              {aggregatedPair && <TokenStats pair={aggregatedPair} prices={prices} />}
              {(() => {
                const customAbout = customAbouts[tokenData.symbol.toUpperCase()]
                const poolText = tokenData.poolCount === 1 ? 'pool' : 'pools';
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
            {tokenData.pools.length > 0 && (
              <div className="flex flex-col gap-4">
                <Typography weight={500} variant="h2">
                  Available Pools
                </Typography>
                <div className="space-y-3">
                  {tokenData.pools.map((pool) => {
                    // Get the paired token (not the current token)
                    const pairedToken = pool.token0.uuid === tokenData.uuid ? pool.token1 : pool.token0
                    const currentTokenPool = pool.token0.uuid === tokenData.uuid ? pool.token0 : pool.token1

                    return (
                      <div
                        key={pool.id}
                        className="flex justify-between items-center p-4 rounded-lg shadow-md bg-stone-800 shadow-black/20"
                      >
                        <div className="flex items-center gap-3">
                          <Currency.IconList iconWidth={26} iconHeight={26}>
                            <Currency.Icon currency={toToken(currentTokenPool)} />
                            <Currency.Icon currency={toToken(pairedToken)} />
                          </Currency.IconList>
                          <div className="flex flex-col">
                            <Typography variant="sm" weight={500} className="flex items-center gap-1 text-stone-50">
                              {currentTokenPool.symbol} <span className="text-stone-500">/</span> {pairedToken.symbol}
                              <Chip color="gray" size="sm" label={`${pool.swapFee.toFixed(2)}%`} className="ml-1" />
                            </Typography>
                          </div>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="text-center">
                            <Typography weight={500} className="text-stone-50">
                              {formatUSD(pool.liquidityUSD)}
                            </Typography>
                          </div>
                          <Button as="a" href={`/pool/${pool.symbolId}`} size="sm" variant="outlined">
                            View Pool
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
