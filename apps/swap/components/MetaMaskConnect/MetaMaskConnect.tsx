'use client'

import { FC, useState } from 'react'
import { useSDK } from '@metamask/sdk-react'
import { Button, ButtonProps } from '@dozer/ui'
import Image from 'next/image'
import { createSuccessToast, createErrorToast } from '@dozer/ui'
import { nanoid } from 'nanoid'

interface MetaMaskConnectProps {
  onConnect?: (accounts: string[]) => void
  onDisconnect?: () => void
  buttonProps?: Partial<ButtonProps<'button'>>
  hideText?: boolean
}

// Format address for UI display (e.g., 0x1234...5678)
const formatAddress = (addr: string | undefined) => {
  if (!addr) return ''
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
}

export const MetaMaskConnect: FC<MetaMaskConnectProps> = ({
  onConnect,
  onDisconnect,
  buttonProps = {},
  hideText = false,
}) => {
  const { sdk, connected, connecting, account } = useSDK()
  const [error, setError] = useState<string>('')

  const connect = async () => {
    setError('')
    
    // Track user action for deep link handling
    if (typeof window !== 'undefined') {
      (window as any).lastUserAction = Date.now()
    }
    
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

  // Default button props - use blue as default color to match app style
  const defaultButtonProps: Partial<ButtonProps<'button'>> = {
    fullWidth: true,
    size: 'lg',
    color: 'blue',
    disabled: connecting,
  }

  // Merge default with custom button props
  const mergedButtonProps = {
    ...defaultButtonProps,
    ...buttonProps,
    onClick: connect,
    className: `flex items-center justify-center ${buttonProps.className || ''}`,
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
        {!hideText && <span className="text-xs text-gray-500 mt-1">Connected to Arbitrum</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-3">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button {...mergedButtonProps}>
        <div className="w-5 h-5 mr-2 flex-shrink-0">
          <Image src="/images/MetaMask-icon-fox.svg" width={20} height={20} alt="MetaMask" />
        </div>
        <span>{connecting ? 'Connecting...' : 'Connect MetaMask'}</span>
      </Button>
      {!hideText && (
        <p className="text-center text-xs text-gray-400">Connect your Arbitrum wallet to start bridging tokens</p>
      )}
    </div>
  )
}

export default MetaMaskConnect
