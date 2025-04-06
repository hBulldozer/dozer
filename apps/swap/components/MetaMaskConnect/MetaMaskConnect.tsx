'use client'

import { FC, useState } from 'react'
import { useSDK } from '@metamask/sdk-react'
import { Button } from '@dozer/ui'
import { WalletIcon } from '@heroicons/react/24/outline'
import { createSuccessToast, createErrorToast } from '@dozer/ui'
import { nanoid } from 'nanoid'

interface MetaMaskConnectProps {
  onConnect?: (accounts: string[]) => void
  onDisconnect?: () => void
}

// Format address for UI display (e.g., 0x1234...5678)
const formatAddress = (addr: string | undefined) => {
  if (!addr) return ''
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
}

export const MetaMaskConnect: FC<MetaMaskConnectProps> = ({ onConnect, onDisconnect }) => {
  const { sdk, connected, connecting, account } = useSDK()
  const [error, setError] = useState<string>('')

  const connect = async () => {
    setError('')
    try {
      const accounts = await sdk?.connect()
      if (accounts && accounts.length > 0 && onConnect) {
        onConnect(accounts)
      }

      // Show success toast
      createSuccessToast({
        type: 'approval',
        summary: {
          pending: 'Connecting to MetaMask',
          completed: 'Connected to MetaMask',
          failed: 'Failed to connect to MetaMask',
        },
        txHash: nanoid(),
        groupTimestamp: Date.now(),
        timestamp: Date.now(),
      })
    } catch (err: any) {
      console.warn(`Failed to connect to MetaMask: `, err)
      const errorMsg = err.message || 'Failed to connect to MetaMask'
      setError(errorMsg)
      createErrorToast(errorMsg, false)
    }
  }

  const disconnect = () => {
    try {
      if (sdk) {
        sdk.terminate()
        if (onDisconnect) {
          onDisconnect()
        }
      }
    } catch (err: any) {
      console.warn(`Error disconnecting from MetaMask: `, err)
    }
  }

  if (connected && account) {
    return (
      <div className="flex flex-col items-end">
        <button
          className="flex items-center bg-green-800/30 px-3 py-1.5 rounded-md border border-green-700 hover:bg-green-700/30 cursor-pointer transition-colors w-full"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            disconnect()
          }}
          title="Click to disconnect"
          type="button"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
          <span className="text-xs text-green-300 font-medium truncate max-w-[100px]">{formatAddress(account)}</span>
        </button>
        <span className="text-xs text-gray-500 mt-1">Connected to Arbitrum</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button
        fullWidth
        size="lg"
        color="blue"
        onClick={connect}
        disabled={connecting}
        className="flex items-center justify-center"
      >
        <div className="w-5 h-5 mr-2 flex-shrink-0">
          <svg viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M32.9582 1L19.8241 10.7183L22.2667 5.09968L32.9582 1Z"
              fill="#E2761B"
              stroke="#E2761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.03311 1L15.052 10.8031L12.7335 5.09968L2.03311 1Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M28.2369 23.5334L24.7456 28.8961L32.2456 30.9307L34.4064 23.6607L28.2369 23.5334Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M0.603516 23.6607L2.75325 30.9307L10.2532 28.8961L6.76198 23.5334L0.603516 23.6607Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.84198 14.5149L7.73853 17.6837L15.179 18.0229L14.9244 10.0149L9.84198 14.5149Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25.1493 14.5149L20.0034 9.93065L19.8213 18.0229L27.2513 17.6837L25.1493 14.5149Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10.2534 28.8961L14.7578 26.7192L10.8598 23.7137L10.2534 28.8961Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.2334 26.7192L24.7471 28.8961L24.1303 23.7137L20.2334 26.7192Z"
              fill="#E4761B"
              stroke="#E4761B"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span>{connecting ? 'Connecting...' : 'Connect MetaMask'}</span>
      </Button>
      <p className="text-center text-xs text-gray-400">Connect your Arbitrum wallet to start bridging tokens</p>
    </div>
  )
}

export default MetaMaskConnect
