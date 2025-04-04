import React, { FC } from 'react'
import { Token } from '@dozer/currency'
import { useBridge } from '@dozer/higmi'
import { Button } from '@dozer/ui'
import { useRouter } from 'next/router'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

interface SwapSideBridgeSuggestionProps {
  token: Token | undefined
  hasLowBalance: boolean
}

export const SwapSideBridgeSuggestion: FC<SwapSideBridgeSuggestionProps> = ({ token, hasLowBalance }) => {
  const router = useRouter()
  const { connection } = useBridge()
  
  // Only show for bridged tokens
  if (!token?.bridged) {
    return null
  }
  
  const navigateToBridge = () => {
    // Navigate to bridge page with token pre-selected
    router.push({
      pathname: '/bridge',
      query: { token: token.uuid }
    })
  }
  
  return (
    <div className="hidden md:block ml-4" style={{ maxWidth: '260px' }}>
      <div className="p-4 border rounded-lg border-yellow-600 bg-stone-800/80">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-base font-medium text-white">
              {hasLowBalance ? `Not enough ${token.symbol}?` : `Get ${token.symbol}`}
            </div>
          </div>
          <p className="text-sm text-stone-300">
            {hasLowBalance
              ? `Bridge more ${token.symbol} from Arbitrum to complete your swap.`
              : `This token is available through the Arbitrum bridge.`}
          </p>
          
          <Button 
            size="sm" 
            color="yellow"
            onClick={navigateToBridge}
            className="w-full"
          >
            <div className="flex items-center justify-center gap-2">
              <span>Bridge {token.symbol}</span>
              <ArrowRightIcon width={16} height={16} />
            </div>
          </Button>
          
          {!connection.arbitrumConnected && (
            <p className="text-xs text-stone-400 text-center mt-1">
              Connect MetaMask on bridge page
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
