import { ChevronDoubleDownIcon } from '@heroicons/react/24/outline'
import { AppearOnMount, ButtonProps, Menu, Typography, WalletConnectIcon, Dialog } from '@dozer/ui'
import React, { ReactNode, useMemo, useState } from 'react'
import { useEffect } from 'react'
import { useSDK } from '@metamask/sdk-react'
import Image from 'next/image'

import SignClient from '@walletconnect/sign-client'
import { Web3Modal } from '@web3modal/standalone'
import { useJsonRpc, useWalletConnectClient } from '../contexts'
import PairingModal from '../modals/PairingModal'
import RequestModal from '../modals/RequestModal'

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
  const { connected, connecting, account, sdk } = useSDK()

  const closeModal = () => setModal('')
  const openPairingModal = () => setModal('pairing')
  const openRequestModal = () => setModal('request')

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

  const onConnect = () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized')
    }
    // Suggest existing pairings (if any).
    if (pairings.length) {
      openPairingModal()
    } else {
      // If no existing pairings are available, trigger `WalletConnectClient.connect`.
      connect()
    }
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

  // Show both WalletConnect and MetaMask options
  return (
    <>
      <Menu
        className={rest.fullWidth ? 'w-full' : ''}
        button={
          showMetaMask ? (
            <div className="flex gap-2">
              {/* WalletConnect Button */}
              <Menu.Button
                {...rest}
                as="div"
                id="wallet_connect"
                onClick={onConnect}
                disabled={isInitializing}
                className="bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-300"
              >
                <div className="flex flex-row items-center gap-1 px-1 py-1 bg-opacity-5 bg-stone-500 rounded-xl">
                  {Icons['WalletConnect']}
                  <span className="text-xs">Hathor</span>
                </div>
              </Menu.Button>

              {/* MetaMask Button */}
              {connected ? (
                <button
                  onClick={disconnectMetaMask}
                  className="flex items-center gap-1 px-2 py-1 transition-colors border border-green-700 bg-green-800/30 hover:bg-green-700/30 rounded-xl"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {Icons['MetaMask']}
                  <span className="text-xs text-green-300">
                    {account ? `${account.substring(0, 4)}...${account.substring(account.length - 4)}` : 'Connected'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={connectMetaMask}
                  disabled={connecting}
                  className="flex items-center gap-1 px-2 py-1 transition-colors border bg-stone-800/50 border-stone-700 hover:bg-stone-700/30 rounded-xl"
                >
                  {Icons['MetaMask']}
                  <span className="text-xs text-stone-300">{connecting ? 'Connecting...' : 'MetaMask'}</span>
                </button>
              )}
            </div>
          ) : (
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
              Connect
            </Menu.Button>
          )
        }
      >
        <div key="menu"></div>
      </Menu>
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
    </>
  )
}
