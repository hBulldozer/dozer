import { ChevronDoubleDownIcon } from '@heroicons/react/24/outline'
import { AppearOnMount, ButtonProps, Menu, Typography, WalletConnectIcon, Dialog } from '@dozer/ui'
import React, { ReactNode, useMemo, useState } from 'react'
// import { Address } from '@dozer/ui/input/Address'
// import { useAccount } from '@dozer/zustand'
import { useEffect } from 'react'

// import { useConnect } from 'wagmi'

// import { useAutoConnect, useWalletState } from '../../hooks'

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
  //   MetaMask: <MetamaskIcon width={16} height={16} />,
  //   'Trust Wallet': <TrustWalletIcon width={16} height={16} />,
  WalletConnect: <WalletConnectIcon width={16} height={16} />,
  //   'Coinbase Wallet': <CoinbaseWalletIcon width={16} height={16} />,
  //   Safe: <GnosisSafeIcon width={16} height={16} />,
}

type Props<C extends React.ElementType> = ButtonProps<C> & {
  // TODO ramin: remove param when wagmi adds onConnecting callback to useAccount
  //   hack?: ReturnType<typeof useConnect>
  //   supportedNetworks?: ChainId[]
  appearOnMount?: boolean
}

export const Button = <C extends React.ElementType>({
  //   hack,
  children,
  //   supportedNetworks,
  appearOnMount = true,
  ...rest
}: Props<C>) => {
  // TODO ramin: remove param when wagmi adds onConnecting callback to useAccount
  // eslint-disable-next-line react-hooks/rules-of-hooks
  //   const { connectors, connect, pendingConnector } = useConnect()

  //   const { pendingConnection, reconnecting, isConnected, connecting } = useWalletState(!!pendingConnector)

  //   useAutoConnect()

  //   if (connecting && appearOnMount) {
  //     return <></>
  //   }

  // const [input, setInput] = useState('')
  // const setAddress = useAccount((state) => state.setAddress)
  const [modal, setModal] = useState('')

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
    // isFetchingBalances,
    isInitializing,
    setChains,
    setRelayerRegion,
  } = useWalletConnectClient()

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const { hathorRpc, isRpcRequestPending, rpcResult, isTestnet, setIsTestnet } = useJsonRpc()

  // function connectWithAddress() {
  //   setAddress(input)
  // }

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
  return (
    <>
      <Menu
        className={rest.fullWidth ? 'w-full' : ''}
        button={
          <Menu.Button
            {...rest}
            as="div"
            id="wallet_connect"
            // key="wallet_connect"
            onClick={onConnect}
            disabled={isInitializing}
            className="bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-300"
          >
            <div className="flex flex-row items-center gap-3 px-1 py-1 bg-opacity-5 bg-stone-500 rounded-xl">
              {Icons['WalletConnect'] && Icons['WalletConnect']}
            </div>{' '}
            {/* {isInitializing ? 'Loading...' : 'Connect'} */}
            Connect
          </Menu.Button>
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
