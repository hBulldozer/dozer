import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { NextPage } from 'next'
import { useWalletConnectClient } from '@dozer/higmi' // adjust the import path as needed
import { useAccount } from '@dozer/zustand' // adjust the import path as needed
import { api } from 'utils/api'
import { createErrorToast, createInfoToast, createSuccessToast, NotificationData, Typography } from '@dozer/ui'
import { Button } from '@dozer/higmi/components/Wallet/Button'
import { ConnectHero } from 'components/ConnectHero'
import { isError } from 'lodash'

const ZealyConnectPage: NextPage = () => {
  const router = useRouter()
  const { accounts, isInitializing } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const setZealyIdentity = useAccount((state) => state.setZealyIdentity)
  const zealyIdentity = useAccount((state) => state.zealyIdentity)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const zealyConnect = api.getRewards.zealyConnect.useMutation()

  const notificationData: NotificationData = {
    type: 'approval',
    summary: {
      pending: 'Zealy Identity Connecting',
      completed: 'Zealy Identity Connected',
      failed: 'Zealy Identity Connection Failed',
      info: 'Zealy Identity Connected',
    },
    status: 'pending',
    txHash: '0x000',
    groupTimestamp: Math.floor(Date.now() / 1000),
    timestamp: Math.floor(Date.now() / 1000),
    promise: new Promise((resolve) => {
      setTimeout(resolve, 500)
    }),
    account: address,
    title: 'Zealy Identity Connected',
  }

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
      if (isInitializing) {
        setIsProcessing(false)
        setError('Please wait for the WalletConnect integration to finish')
        return
      }

      // Check if user is connected
      if (!isInitializing && accounts.length === 0) {
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
  }, [router, accounts, setZealyIdentity, isInitializing])

  useEffect(() => {
    if (error) {
      const message = error ? error : 'Could not continue in Zealy Connection'
      createErrorToast(message, true)
    }
    if (isProcessing)
      createInfoToast({
        ...notificationData,
        summary: {
          pending: 'Zealy Identity Connecting...',
          completed: 'Zealy Identity Connecting...',
          failed: 'Zealy Identity Connecting...',
          info: 'Zealy Identity Connecting...',
        },
      })
    if (zealyIdentity) {
      createSuccessToast(notificationData)
    }
  }, [isProcessing, error, zealyIdentity])

  return <ConnectHero />
}

export default ZealyConnectPage
