import React, { FC } from 'react'
import { Token } from '@dozer/currency'
import { useBridge } from '@dozer/higmi'
import { Button } from '@dozer/ui'
import { useRouter } from 'next/router'
import { useSDK } from '@metamask/sdk-react'

interface SwapLowBalanceBridgeProps {
  token: Token | undefined
  hasLowBalance: boolean
}

export const SwapLowBalanceBridge: FC<SwapLowBalanceBridgeProps> = ({ token, hasLowBalance }) => {
  const router = useRouter()
  const { connected: metaMaskConnected } = useSDK()

  // Only show for bridged tokens with low balance
  if (!token?.bridged) {
    return null
  }

  const navigateToBridge = () => {
    // Navigate to bridge page with token pre-selected
    router.push({
      pathname: '/bridge',
      query: { token: token.uuid },
    })
  }

  return (
    <div className="p-3 mt-2 border rounded-lg border-yellow-600 bg-yellow-900/20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-yellow-500">
            {hasLowBalance ? `Not enough ${token.symbol}` : `Get ${token.symbol} from Arbitrum`}
          </div>
        </div>
        <p className="text-xs text-yellow-300">
          {hasLowBalance
            ? `You don't have enough ${token.symbol} to complete this swap. You can bridge more from Arbitrum.`
            : `This token is available through the Arbitrum bridge. Click below to get started.`}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <Button size="xs" color="yellow" onClick={navigateToBridge} className="py-1">
            Bridge {token.symbol}
          </Button>

          {!metaMaskConnected && <span className="text-xs text-yellow-200">Connect MetaMask on bridge page</span>}
        </div>
      </div>
    </div>
  )
}
