import { ChevronDoubleDownIcon } from '@heroicons/react/24/outline'
import { AppearOnMount, ButtonProps, Menu, Typography, WalletConnectIcon, Dialog } from '@dozer/ui'
import React, { ReactNode, useMemo, useState } from 'react'
import { useEffect } from 'react'
import { useSDK } from '@metamask/sdk-react'
import Image from 'next/image'
import { useAccount } from '@dozer/zustand'

import SignClient from '@walletconnect/sign-client'
import { Web3Modal } from '@web3modal/standalone'
import { useJsonRpc, useWalletConnectClient } from '../contexts'
import PairingModal from '../modals/PairingModal'
import RequestModal from '../modals/RequestModal'
import { WalletSelectionModal } from '../modals/WalletSelectionModal'
import { WalletConnectionService } from '../../services/walletConnectionService'

export interface AccountAction {
  method: string
  callback: (chainId: string, address: string) => Promise<void>
}

const Icons: Record<string, ReactNode> = {
  Injected: <ChevronDoubleDownIcon width={16} height={16} />,
  MetaMask: (
    <div className="flex-shrink-0 w-4 h-4">
      <Image src="/images/MetaMask-icon-fox.svg" width={16} height={16} alt="MetaMask" />
    </div>
  ),
  WalletConnect: <WalletConnectIcon width={16} height={16} />,
}

type Props<C extends React.ElementType> = ButtonProps<C> & {
  appearOnMount?: boolean
  showMetaMask?: boolean
}

export const Button = <C extends React.ElementType>({
  children,
  appearOnMount = true,
  showMetaMask = false,
  ...rest
}: Props<C>) => {
  const [modal, setModal] = useState('')
  const [showWalletSelection, setShowWalletSelection] = useState(false)
  const { connected, connecting, account, sdk } = useSDK()
  const { walletType, hathorAddress } = useAccount()
  const walletService = WalletConnectionService.getInstance()

  const closeModal = () => setModal('')
  const openPairingModal = () => setModal('pairing')
  const openRequestModal = () => setModal('request')
  const openWalletSelection = () => setShowWalletSelection(true)
  const closeWalletSelection = () => setShowWalletSelection(false)

  // Initialize the WalletConnect client.
  const {
    client,
    pairings,
    session,
    connect,
    isWaitingApproval,
    disconnect,
    chains,
    relayerRegion,
    accounts,
    isInitializing,
    setChains,
    setRelayerRegion,
  } = useWalletConnectClient()

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const { hathorRpc, isRpcRequestPending, rpcResult, isTestnet, setIsTestnet } = useJsonRpc()

  // Close the pairing modal after a session is established.
  useEffect(() => {
    if (session && modal === 'pairing') {
      closeModal()
    }
  }, [session, modal])

  // Handle WalletConnect connection via modal
  const handleWalletConnectConnection = async () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }

    try {
      // Suggest existing pairings (if any).
      if (pairings.length) {
        openPairingModal()
      } else {
        // If no existing pairings are available, trigger `WalletConnectClient.connect`.
        await connect()
      }

      // Note: The actual connection success will be handled by existing WalletConnect logic
      // and will update the useAccount state via the Profile component
    } catch (error) {
      console.error('WalletConnect connection failed:', error)
    }
  }

  // Handle MetaMask Snap connection via modal
  const handleMetaMaskConnection = async (hathorAddress: string) => {
    // Update the unified wallet state in Zustand store
    try {
      await walletService.setWalletConnection({
        walletType: 'metamask-snap',
        address: hathorAddress,
        hathorAddress: hathorAddress,
        isSnapInstalled: true,
        snapId: 'local:http://localhost:8089',
        selectedNetwork: 'testnet',
      })
    } catch (error) {
      console.error('Failed to update wallet state after MetaMask connection:', error)
    }
  }

  const onConnect = () => {
    // Always show wallet selection modal for better UX
    // Users can choose between Hathor Wallet (WalletConnect) and MetaMask Snap
    openWalletSelection()
  }

  const connectMetaMask = async () => {
    if (!sdk) return
    try {
      await sdk.connect()
    } catch (err) {
      console.error('Failed to connect to MetaMask:', err)
    }
  }

  const disconnectMetaMask = () => {
    if (!sdk) return
    try {
      sdk.terminate()
    } catch (err) {
      console.error('Error disconnecting from MetaMask:', err)
    }
  }

  const renderModal = () => {
    switch (modal) {
      case 'pairing':
        if (typeof client === 'undefined') {
          throw new Error('WalletConnect is not initialized')
        }
        return (
          <PairingModal pairings={pairings} connect={connect} client={client} isWaitingApproval={isWaitingApproval} />
        )
      case 'request':
        return <RequestModal pending={isRpcRequestPending} result={rpcResult} />
      default:
        return null
    }
  }

  // Check if any wallet is connected
  const isWalletConnected =
    walletType === 'walletconnect' ? accounts.length > 0 : walletType === 'metamask-snap' && hathorAddress

  // Show unified connect button (always show connect button, regardless of connection state)
  return (
    <>
      <Menu
        className={rest.fullWidth ? 'w-full' : ''}
        button={
          <Menu.Button
            {...rest}
            as="div"
            id="wallet_connect"
            onClick={onConnect}
            disabled={isInitializing}
            className="bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-300"
          >
            <div className="flex flex-row items-center gap-3 px-1 py-1 bg-opacity-5 bg-stone-500 rounded-xl">
              {Icons['WalletConnect'] && Icons['WalletConnect']}
            </div>{' '}
            Connect Wallet
          </Menu.Button>
        }
      >
        <div key="menu"></div>
      </Menu>

      {/* WalletConnect modals */}
      <Dialog open={!!modal} onClose={closeModal}>
        <Dialog.Content className="max-w-sm !pb-4">
          <Dialog.Header
            border={false}
            title={modal === 'pairing' ? 'Pairing' : 'Request Modal'}
            onClose={closeModal}
          />
          {renderModal()}
        </Dialog.Content>
      </Dialog>

      {/* Wallet Selection Modal */}
      <WalletSelectionModal
        isOpen={showWalletSelection}
        onClose={closeWalletSelection}
        onWalletConnect={handleWalletConnectConnection}
        onMetaMaskConnect={handleMetaMaskConnection}
      />
    </>
  )
}
