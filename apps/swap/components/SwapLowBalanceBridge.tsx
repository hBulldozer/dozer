import React, { FC } from 'react'
import { Token } from '@dozer/currency'
import { useBridge } from '@dozer/higmi'
import { Button } from '@dozer/ui'
import { useRouter } from 'next/router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { useSDK } from '@metamask/sdk-react'

interface SwapLowBalanceBridgeProps {
  token: Token | undefined
  hasLowBalance: boolean
}

export const SwapLowBalanceBridge: FC<SwapLowBalanceBridgeProps> = ({ token, hasLowBalance }) => {
  const router = useRouter()
  const { connected: metaMaskConnected } = useSDK()

  // Only show for bridged tokens
  // Bridged = true means this is a Hathor token that has an EVM counterpart
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
    <div className="mx-3 mb-3 border rounded-lg border-yellow-600 bg-yellow-900/20">
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div className="text-base font-medium text-yellow-500">
            {hasLowBalance
              ? `Not enough ${token.symbol}`
              : `Get ${token.symbol} from ${token.sourceChain || 'Arbitrum'}`}
          </div>
        </div>
        <p className="text-sm text-yellow-300">
          {hasLowBalance
            ? `You don't have enough ${token.symbol} to complete this swap. You can bridge more from ${
                token.sourceChain || 'Arbitrum'
              }.`
            : `This token is available through the ${
                token.sourceChain || 'Arbitrum'
              } bridge. Click below to get started.`}
        </p>

        <div className="flex flex-col gap-2 mt-1">
          <Button size="sm" color="yellow" onClick={navigateToBridge} className="w-full">
            <div className="flex items-center justify-center gap-2">
              <span>Bridge {token.symbol}</span>
              <ArrowRightIcon width={16} height={16} />
            </div>
          </Button>

          {!metaMaskConnected && <p className="text-xs text-yellow-200 text-center">Connect MetaMask on bridge page</p>}
        </div>
      </div>
    </div>
  )
}
