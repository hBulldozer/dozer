import { Layout } from '../../components/Layout'
import { useBridge } from '@dozer/higmi'
import { generateSSGHelper } from '@dozer/api/src/helpers/ssgHelper'
import type { GetStaticProps } from 'next'
import { api } from 'utils/api'
import { Button, Typography, Widget } from '@dozer/ui'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export const getStaticProps: GetStaticProps = async () => {
  const ssg = generateSSGHelper()
  await ssg.getTokens.all.prefetch()
  await ssg.getPrices.all.prefetch()
  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
  }
}

const ClaimsContent = () => {
  const { connection, connectArbitrum, pendingClaims, loadPendingClaims, claimTokenFromArbitrum } = useBridge()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentClaim, setCurrentClaim] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Load claims only once when the component mounts and we're connected
    // Instead of auto-reloading, we'll rely on the manual refresh button
    const loadOnMount = async () => {
      if (connection.arbitrumConnected) {
        // Use silent mode for automatic loading
        await loadPendingClaims({ silent: true })
      }
    }

    // Flag to prevent multiple loads
    let isLoaded = false

    if (!isLoaded && connection.arbitrumConnected) {
      isLoaded = true
      loadOnMount()
    }
  }, [connection.arbitrumConnected]) // Remove loadPendingClaims from the dependency array

  const handleClaim = async (claim: any) => {
    if (isProcessing) return

    setIsProcessing(true)
    setCurrentClaim(claim.transactionHash)

    try {
      await claimTokenFromArbitrum(
        claim.receiver,
        claim.amount,
        claim.transactionHash,
        claim.logIndex,
        claim.originChainId
      )

      // Reload claims with force option to show logs
      await loadPendingClaims({ force: true })
    } catch (error) {
      console.error('Failed to claim token:', error)
    } finally {
      setIsProcessing(false)
      setCurrentClaim(null)
    }
  }

  const navigateToBridge = () => {
    router.push('/bridge')
  }

  if (!connection.arbitrumConnected) {
    return (
      <Widget id="claims" maxWidth={500}>
        <Widget.Content>
          <div className="p-6 text-center">
            <Typography variant="lg" weight={600} className="mb-4">
              Connect MetaMask to View Claims
            </Typography>
            <Typography variant="sm" className="mb-6 text-stone-400">
              You need to connect your MetaMask wallet to view and process pending claims.
            </Typography>
            <Button size="md" color="blue" onClick={connectArbitrum} className="mx-auto">
              Connect MetaMask
            </Button>
          </div>
        </Widget.Content>
      </Widget>
    )
  }

  return (
    <Widget id="claims" maxWidth={500}>
      <Widget.Content>
        <div className="p-3 pb-4 font-medium">
          <div className="flex items-center justify-between">
            <Typography variant="xl" weight={600}>
              Pending Claims
            </Typography>
            <Button
              size="sm"
              variant="outlined"
              color="blue"
              onClick={() => {
                loadPendingClaims({ force: true })
              }}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-3 bg-stone-800">
          {pendingClaims.length === 0 ? (
            <div className="py-8 text-center">
              <Typography variant="lg" weight={500} className="mb-2 text-stone-400">
                No Pending Claims
              </Typography>
              <Typography variant="sm" className="mb-6 text-stone-500">
                You don't have any tokens ready to be claimed.
              </Typography>
              <Button size="sm" color="blue" onClick={navigateToBridge}>
                Go to Bridge
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg border-stone-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography variant="sm" weight={500} className="text-white">
                        {claim.amount} {claim.tokenSymbol || 'Tokens'}
                      </Typography>
                      <Typography variant="xs" className="text-stone-400">
                        From:{' '}
                        {claim.sender
                          ? `${claim.sender.substring(0, 6)}...${claim.sender.substring(claim.sender.length - 4)}`
                          : 'Unknown'}
                      </Typography>
                    </div>
                    <Button
                      size="sm"
                      color="blue"
                      onClick={() => handleClaim(claim)}
                      disabled={isProcessing && currentClaim === claim.transactionHash}
                    >
                      {isProcessing && currentClaim === claim.transactionHash ? 'Processing...' : 'Claim'}
                    </Button>
                  </div>
                </div>
              ))}

              <div className="mt-4 text-center">
                <Typography variant="xs" className="text-stone-500">
                  Tokens will be available in your Hathor wallet after claiming.
                </Typography>
              </div>
            </div>
          )}
        </div>
      </Widget.Content>
    </Widget>
  )
}

const ClaimsPage = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-[500px] mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-2">Token Claims</h1>
          <p className="text-gray-400">Claim your tokens that have been bridged from Arbitrum</p>
        </div>
        <ClaimsContent />
      </div>
    </Layout>
  )
}

export default ClaimsPage
