import React from 'react'

interface BridgeIndicatorProps {
  className?: string
}

export const BridgeIndicator: React.FC<BridgeIndicatorProps> = ({ className }) => {
  return (
    <div 
      className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-blue-500/20 text-blue-400 ${className || ''}`}
      title="This token can be bridged between Hathor and Arbitrum"
    >
      BRIDGED
    </div>
  )
}
