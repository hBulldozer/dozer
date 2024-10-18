import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NextPage } from 'next'
import { useWalletConnectClient } from '@dozer/higmi' // adjust the import path as needed
import { useAccount } from '@dozer/zustand' // adjust the import path as needed
import { api } from 'utils/api'
import { Typography } from '@dozer/ui'
import { Button } from '@dozer/higmi/components/Wallet/Button'

const ZealyConnectPage: NextPage = () => {
  const router = useRouter()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const setZealyIdentity = useAccount((state) => state.setZealyIdentity)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const zealyConnect = api.getRewards.zealyConnect.useMutation()

  useEffect(() => {
    const { zealyUserId, signature, callbackUrl } = router.query

    if (
      !zealyUserId ||
      !signature ||
      !callbackUrl ||
      typeof zealyUserId !== 'string' ||
      typeof signature !== 'string' ||
      typeof callbackUrl !== 'string'
    ) {
      setIsProcessing(false)
      setError('Invalid Zealy Connect parameters')
      return
    }

    const processZealyConnect = async () => {
      // Check if user is connected
      if (accounts.length === 0) {
        setIsProcessing(false)
        setError('Please connect your wallet first')
        return
      }

      try {
        const fullUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
        const result = await zealyConnect.mutateAsync({
          address,
          zealyUserId,
          signature,
          callbackUrl,
          fullUrl,
        })

        // Save Zealy User ID
        setZealyIdentity(result.zealyUserId)

        // Redirect back to Zealy
        router.push(result.redirectUrl)
      } catch (err) {
        setIsProcessing(false)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    }

    processZealyConnect()
  }, [router, accounts, setZealyIdentity, zealyConnect])

  if (isProcessing || error) {
    return (
      <div className="flex flex-col items-center justify-center w-full mt-9">
        <Typography variant="h1" weight={600} className="mb-5 text-center ">
          {isProcessing ? 'Processing Zealy connection...' : error ? error : ''}
        </Typography>
        {error?.includes('Please connect your wallet first') && <Button size="lg" />}
      </div>
    )
  }

  return null
}

export default ZealyConnectPage
