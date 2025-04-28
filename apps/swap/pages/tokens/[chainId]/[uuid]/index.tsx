import { AppearOnMount, BreadcrumbLink, Button, Dialog, Container, Typography, LoadingOverlay } from '@dozer/ui'
import { formatUSD, formatHTR } from '@dozer/format'
import { GetStaticPaths, GetStaticProps } from 'next'
import { useRouter } from 'next/router'
import { AllTokensDBOutput, toToken } from '@dozer/api'
import { Layout } from 'components/Layout'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import { api } from '../../../../utils/api'
import PriceChart from '../../../../components/TokenPage/PriceChart'
import { SwapWidget } from 'pages'
import { Fragment, useState } from 'react'
import { ChainId } from '@dozer/chain'
import { Currency, CopyHelper, IconButton, Link } from '@dozer/ui'
import { ArrowTopRightOnSquareIcon, Square2StackIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { TwitterIcon, TelegramIcon } from '@dozer/ui'
import chains from '@dozer/chain'
import { hathorLib } from '@dozer/nanocontracts'
import ReadMore from '@dozer/ui/readmore/ReadMore'
import { TokenStats } from 'components/TokenPage/TokenStats'

export const config = {
  maxDuration: 60,
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ssg = generateSSGHelper()
  const tokens = await ssg.getTokens.all.fetch()

  if (!tokens) {
    throw new Error(`Failed to fetch tokens`)
  }

  // Get the paths we want to pre-render based on tokens
  const paths = tokens
    ?.filter((token) => !token.custom)
    .map((token: AllTokensDBOutput) => ({
      params: { chainId: `${token.chainId}`, uuid: `${token.uuid}` },
    }))

  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const uuid = params?.uuid as string
  const chainId = Number(params?.chainId as string)

  const ssg = generateSSGHelper()

  // Fetch token info
  const token = await ssg.getTokens.byUuid.fetch({ uuid: uuid })

  if (!token) {
    return {
      notFound: true,
    }
  }

  // Prefetch data for the new price service
  await ssg.getNewPrices.isAvailable.prefetch()
  await ssg.getNewPrices.tokenInfo.prefetch()
  await ssg.getNewPrices.isTokenAvailable.prefetch({ token: uuid })

  // Prefetch token data
  await ssg.getTokens.socialURLs.prefetch({ uuid })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      tokenInfo: token,
    },
    revalidate: 3600, // Revalidate every hour
  }
}

const LINKS = ({ tokenName, chainId }: { tokenName: string; chainId: number }): BreadcrumbLink[] => [
  {
    href: `/tokens`,
    label: 'Tokens',
  },
  {
    href: `/tokens/${chainId}/${tokenName}`,
    label: tokenName,
  },
]

// Clean token page component using only the new price chart
const TokenPage = ({ tokenInfo }: { tokenInfo: AllTokensDBOutput }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const router = useRouter()
  const uuid = router.query.uuid as string
  const chainId = Number(router.query.chainId)

  // Get social URLs
  const { data: socialURLs } = api.getTokens.socialURLs.useQuery({ uuid })

  // Get token details
  const { data: token } = api.getTokens.byUuid.useQuery({ uuid: uuid })

  // Check if token is Hathor
  const isHtr = uuid === '00'
  const isHusdc = token?.symbol === 'hUSDC'

  // Set initial currency based on token type
  const initialCurrency = !isHusdc ? 'USD' : 'HTR'

  return (
    <>
      <Layout breadcrumbs={LINKS({ tokenName: token?.name || uuid, chainId })}>
        <LoadingOverlay show={false} />
        <div className="flex flex-col lg:grid lg:grid-cols-[568px_auto] gap-12">
          <div className="flex flex-col order-1 gap-6">
            {/* Token Icon and Info */}
            <div className="flex justify-between gap-5 mr-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className={token?.imageUrl ? 'cursor-pointer' : ''}>
                    <Currency.Icon
                      currency={toToken(token)}
                      width={32}
                      height={32}
                      onClick={() => token?.imageUrl && setIsDialogOpen(true)}
                    />
                  </div>

                  <Typography variant="lg" weight={600}>
                    {token?.name || uuid}
                  </Typography>
                  <Typography variant="lg" weight={600} className="text-stone-400">
                    {token?.symbol || ''}
                  </Typography>

                  {/* Token actions and social links */}
                  <div className="flex flex-row items-center gap-2 ml-2">
                    {token && (
                      <CopyHelper
                        toCopy={hathorLib.tokensUtils.getConfigurationString(
                          token.uuid,
                          token.name || '',
                          token.symbol || ''
                        )}
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
                    )}

                    <Link.External href={chains[chainId].getTokenUrl(uuid)}>
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

            {/* Price Chart component */}
            <PriceChart
              tokenId={uuid}
              initialCurrency={initialCurrency as 'USD' | 'HTR'}
              symbol={token?.symbol}
              name={token?.name}
              height={400}
              showControls={true}
              showCurrencyToggle={true}
            />

            {/* Stats section */}
            <div className="flex flex-col gap-4">
              <Typography weight={500} variant="h1">
                Stats
              </Typography>
              <TokenStats uuid={token.uuid} client={api} />
            </div>

            {/* About section */}
            {token?.about && (
              <div className="flex flex-col gap-4">
                <Typography weight={500} className="flex flex-col " variant="h2">
                  About
                </Typography>
                <ReadMore text={token.about} />
              </div>
            )}
          </div>

          {/* Swap Widget */}
          <div className="flex-col order-2 hidden gap-4 lg:flex">
            <AppearOnMount>
              <SwapWidget token0_idx={'0'} token1_idx={token?.id || '1'} />
            </AppearOnMount>
          </div>
        </div>
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <Dialog.Content>
            <Dialog.Header title="Token Image" onClose={() => setIsDialogOpen(false)} />
            {token?.imageUrl && (
              <div className="w-full max-h-[80vh] flex items-center justify-center overflow-hidden">
                <img
                  src={token.imageUrl}
                  alt={`${token.name} Token Image`}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            )}
          </Dialog.Content>
        </Dialog>
      </Layout>

      {/* Mobile swap button */}
      <AppearOnMount as={Fragment}>
        <div className="fixed left-0 right-0 flex justify-center lg:hidden bottom-6">
          <div>
            <div className="divide-x rounded-xl min-w-[95vw] shadow-md shadow-black/50 bg-yellow divide-stone-800">
              <Button size="md" as="a" href={`../../?token0=00&token1=${uuid}&chainId=${chainId}`}>
                Swap
              </Button>
            </div>
          </div>
        </div>
      </AppearOnMount>
    </>
  )
}

export default TokenPage
