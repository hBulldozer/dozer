import { ChevronDoubleDownIcon } from '@heroicons/react/outline'
import { AppearOnMount, ButtonProps, Menu, WalletConnectIcon } from '@dozer/ui'
import React, { ReactNode, useState } from 'react'
import { Address } from '@dozer/ui/input/Address'
import { useAccount } from '@dozer/zustand'
import { useBalance } from '@dozer/react-query'
import { useEffect } from 'react'
import { useWeb3Modal } from '@web3modal/react'
// import { useConnect } from 'wagmi'

// import { useAutoConnect, useWalletState } from '../../hooks'

const Icons: Record<string, ReactNode> = {
  Injected: <ChevronDoubleDownIcon width={16} height={16} />,
  //   MetaMask: <MetamaskIcon width={16} height={16} />,
  //   'Trust Wallet': <TrustWalletIcon width={16} height={16} />,
  WalletConnect: <WalletConnectIcon width={16} height={16} />,
  //   'Coinbase Wallet': <CoinbaseWalletIcon width={16} height={16} />,
  //   Safe: <GnosisSafeIcon width={16} height={16} />,
}

export type Props<C extends React.ElementType> = ButtonProps<C> & {
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

  const [connectAddress, setConnectAddress] = useState<string>('')
  const setAddress = useAccount((state) => state.setAddress)
  const setBalance = useAccount((state) => state.setBalance)
  const balance = useBalance(connectAddress)

  const [loadingWC, setLoadingWC] = useState(false)
  const { open } = useWeb3Modal()
  const [isConnected, setIsConnected] = useState(false)

  function connect() {
    setAddress(connectAddress)
  }

  useEffect(() => {
    if (connectAddress && balance) {
      const balance_data = []
      // console.log(balance.isLoading)
      // console.log(balance.data)
      if (balance.data && !balance.isLoading) {
        const data = balance.data.tokens_data
        for (const token in data) {
          balance_data.push({
            token_uuid: token,
            token_symbol: data[token].symbol,
            token_balance: data[token].received - data[token].spent,
          })
        }
      }
      setBalance(balance_data)
    } else {
      // setBalance([])
    }
  }, [balance, connectAddress])

  function onChange(x: string) {
    setConnectAddress(x)
  }

  async function onOpenWC() {
    setLoadingWC(true)
    console.log('antes do open')
    await open()
    console.log('depois do open')

    setLoadingWC(false)
  }

  function disconnectWC() {
    setIsConnected(false)
    console.log('desconectado')
  }

  function onClickWC() {
    if (isConnected) {
      disconnectWC()
    } else {
      onOpenWC()
    }
  }

  return (
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
                value={connectAddress}
                onChange={onChange}
                onKeyDown={() => setConnectAddress('WX2vejKjzdW1ftnLA2q3vmCLh8k5f6bahr')}
                placeholder="WX2vejKjzdW1ftnLA2q3vmCLh8k5f6bahr"
              />
              <div>
                {isMounted && (
                  <Menu.Item key="htr_connector" onClick={() => connect()} className="flex items-center gap-3 group">
                    <div className="-ml-[6px] group-hover:bg-yellow-700 rounded-full group-hover:ring-[1px] group-hover:ring-yellow-100">
                      {Icons['Injected'] && Icons['Injected']}
                    </div>{' '}
                    Hathor Wallet
                  </Menu.Item>
                )}
              </div>
              <div>
                {isMounted && (
                  <Menu.Item
                    key="wallet_connect"
                    onClick={() => onClickWC()}
                    disabled={loadingWC}
                    className="flex items-center gap-3 group"
                  >
                    <div className="-ml-[6px] group-hover:bg-yellow-700 rounded-full group-hover:ring-[1px] group-hover:ring-yellow-100">
                      {Icons['WalletConnect'] && Icons['WalletConnect']}
                    </div>{' '}
                    {loadingWC ? 'Loading...' : 'WalletConnect'}
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Menu>
        )

        // return <UIButton {...rest}>{children || 'Connect Wallet'}</UIButton>
      }}
    </AppearOnMount>
  )
}
