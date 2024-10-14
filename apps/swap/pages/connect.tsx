import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NextPage } from 'next'
import { useWalletConnectClient } from '@dozer/higmi' // adjust the import path as needed
import { useAccount } from '@dozer/zustand' // adjust the import path as needed
import { api } from 'utils/api'

const ZealyConnectPage: NextPage = () => {
  const router = useRouter()
  const { accounts } = useWalletConnectClient()
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

  if (isProcessing) {
    return <div>Processing Zealy connection...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return null
}

export default ZealyConnectPage
