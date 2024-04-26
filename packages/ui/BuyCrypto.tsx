import { FC, ReactNode, useMemo } from 'react'

import { App } from './app'

const TRANSAK_NETWORKS = [
  // 'ethereum',
  // 'arbitrum',
  // 'optimism',
  // 'bsc',
  // 'polygon',
  // 'avaxcchain',
  // 'celo',
  // 'fantom',
  // 'moonriver',
  'hathor',
]

interface BuyCryptoProps {
  address: string | undefined
  children?: (buyUrl: string) => ReactNode
}
export const BuyCrypto: FC<BuyCryptoProps> = ({ address, children }) => {
  const buyUrl = useMemo(() => {
    const params = new URLSearchParams()
    // TODO Activate API key after Company Formation
    // params.append('apiKey', '27633309-e560-41ec-b3de-b32f252c9437')
    // if (address) {
    params.append('walletAddress', 'HJpA7CTpWqL2p2HRtGkGXjbvAzr3sqi1GP')
    // }
    // params.append('networks', TRANSAK_NETWORKS.join(','))
    params.append('redirectURL', 'https://dozer.finance/swap')
    // params.append('isAutoFillUserData', 'true')
    params.append('hideMenu', 'true')
    params.append('isFeeCalculationHidden', 'true')
    // TODO Make HTR work as default
    params.append('defaultCryptoCurrency', 'HTR')
    params.append('themeColor', '#eab308')
    return `https://global.transak.com/?${params.toString()}`
  }, [address])

  if (typeof children === 'function') return <>{children(buyUrl)}</>
  return <App.NavItem href={buyUrl} label="Donate OnRamp" external />
}
