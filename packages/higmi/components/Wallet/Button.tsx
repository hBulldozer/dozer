import { ChevronDoubleDownIcon } from '@heroicons/react/24/outline'
import { AppearOnMount, ButtonProps, Menu, Typography, WalletConnectIcon, Dialog } from '@dozer/ui'
import React, { ReactNode, useMemo, useState } from 'react'
import { Address } from '@dozer/ui/input/Address'
import { useAccount } from '@dozer/zustand'
import { useEffect } from 'react'

// import { useConnect } from 'wagmi'

// import { useAutoConnect, useWalletState } from '../../hooks'

import SignClient from '@walletconnect/sign-client'
import { Web3Modal } from '@web3modal/standalone'
import { DEFAULT_HATHOR_METHODS, useChainData, useJsonRpc, useWalletConnectClient } from '../contexts'
import PairingModal from '../modals/PairingModal'
import RequestModal from '../modals/RequestModal'

export interface AccountAction {
  method: string
  callback: (chainId: string, address: string) => Promise<void>
}

// 1. Get projectID at https://cloud.walletconnect.com
if (!process.env.NEXT_PUBLIC_PROJECT_ID) {
  throw new Error('You need to provide NEXT_PUBLIC_PROJECT_ID env variable')
}

// 2. Configure web3Modal
const web3Modal = new Web3Modal({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  walletConnectVersion: 2,
})

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

  const [input, setInput] = useState('')
  const setAddress = useAccount((state) => state.setAddress)
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
    disconnect,
    chains,
    relayerRegion,
    accounts,
    isFetchingBalances,
    isInitializing,
    setChains,
    setRelayerRegion,
  } = useWalletConnectClient()

  // Use `JsonRpcContext` to provide us with relevant RPC methods and states.
  const { hathorRpc, isRpcRequestPending, rpcResult, isTestnet, setIsTestnet } = useJsonRpc()

  const { chainData } = useChainData()

  function connectWithAddress() {
    setAddress(input)
  }

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
    console.log('pairings', pairings, 'session', session)
    if (pairings.length) {
      openPairingModal()
    } else {
      // If no existing pairings are available, trigger `WalletConnectClient.connect`.
      connect()
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key == 'Enter') {
      if (input.length == 34) connectWithAddress()
      else event.preventDefault()
    }
  }

  function onChange(x: string) {
    if (x.length > 34) {
      setInput(x.slice(0, 34))
    } else {
      setInput(x)
    }
  }

  const getHathorActions = (): AccountAction[] => {
    const onSignMessage = async (chainId: string, address: string) => {
      openRequestModal()
      await hathorRpc.testSignMessage(chainId, address)
    }
    const onSendNanoTx = async (chainId: string, address: string) => {
      openRequestModal()
      await hathorRpc.testSendNanoContractTx(chainId, address)
    }
    const onSignOracleData = async (chainId: string, address: string) => {
      openRequestModal()
      await hathorRpc.testSignOracleData(chainId, address)
    }
    return [
      {
        method: DEFAULT_HATHOR_METHODS.HATHOR_SIGN_MESSAGE,
        callback: onSignMessage,
      },
      {
        method: DEFAULT_HATHOR_METHODS.HATHOR_SEND_NANO_TX,
        callback: onSendNanoTx,
      },
      {
        method: DEFAULT_HATHOR_METHODS.HATHOR_SIGN_ORACLE_DATA,
        callback: onSignOracleData,
      },
    ]
  }

  useEffect(() => {
    if (accounts.length > 0) {
      const [namespace, reference, address] = accounts[0].split(':')
      console.log(accounts[0])
      setAddress(address)
    }
  }, [accounts])

  const renderModal = () => {
    switch (modal) {
      case 'pairing':
        if (typeof client === 'undefined') {
          throw new Error('WalletConnect is not initialized')
        }
        return <PairingModal pairings={pairings} connect={connect} />
      case 'request':
        return <RequestModal pending={isRpcRequestPending} result={rpcResult} />
      default:
        return null
    }
  }
  return (
    <>
      <AppearOnMount enabled={appearOnMount}>
        {(isMounted) => {
          // Pending confirmation state
          // Awaiting wallet confirmation
          // if (pendingConnection) {
          //   return (
          //     <UIButton endIcon={<Loader />} variant="filled" color="amber" disabled {...rest}>
          //       Authorize Wallet
          //     </UIButton>
          //   )
          // }

          // Disconnected state
          // We are mounted on the client, but we're not connected, and we're not reconnecting (address is not available)
          // if (!isConnected && !reconnecting && isMounted) {
          return (
            <Menu
              className={rest.fullWidth ? 'w-full' : ''}
              button={
                <Menu.Button {...rest} as="div">
                  {children || 'Connect Wallet'}
                </Menu.Button>
              }
            >
              <Menu.Items className="z-[100]">
                <Address
                  id="connect_address"
                  value={input}
                  error={input.length != 34}
                  onChange={onChange}
                  onKeyDown={handleKeyDown}
                  // onKeyDown={() => setInput('WX2vejKjzdW1ftnLA2q3vmCLh8k5f6bahr')}
                  // placeholder="WX2vejKjzdW1ftnLA2q3vmCLh8k5f6bahr"
                />
                <div>
                  {isMounted && (
                    <>
                      {input.length == 34 ? (
                        <Menu.Item
                          key="htr_connector"
                          onClick={() => connectWithAddress()}
                          className="flex items-center gap-3 group"
                        >
                          <div className="-ml-[6px] group-hover:bg-yellow-700 rounded-full group-hover:ring-[1px] group-hover:ring-yellow-100">
                            {Icons['Injected'] && Icons['Injected']}
                          </div>{' '}
                          {input.length != 34 ? 'Wrong address' : 'Connect'}
                        </Menu.Item>
                      ) : (
                        <Typography variant="sm" className="my-2 text-center text-stone-200">
                          Wrong address
                        </Typography>
                      )}
                    </>
                  )}
                </div>
                <div>
                  {isMounted && (
                    <Menu.Item key="wallet_connect" onClick={onConnect} className="flex items-center gap-3 group">
                      <div className="-ml-[6px] group-hover:bg-yellow-700 rounded-full group-hover:ring-[1px] group-hover:ring-yellow-100">
                        {Icons['WalletConnect'] && Icons['WalletConnect']}
                      </div>{' '}
                      {isInitializing ? 'Loading...' : 'WalletConnect'}
                    </Menu.Item>
                  )}
                </div>
              </Menu.Items>
            </Menu>
          )

          // return <UIButton {...rest}>{children || 'Connect Wallet'}</UIButton>
        }}
      </AppearOnMount>
      {/* <Dialog show={!!modal} onClose={closeModal}>
        <Dialog.Content>
          <Dialog.Header border={false} title="Wallet Connect" onClose={() => setModal('')} /> */}
      {renderModal()}
      {/* </Dialog.Content>
      </Dialog> */}
    </>
  )
}
