import { useIsMounted } from '@dozer/hooks'
import { FC } from 'react'
import { useAccount } from '@dozer/zustand'

import { useWalletConnectClient, Wallet } from '../../components'
import { CheckerButton } from './types'

export const Connected: FC<CheckerButton> = ({ children, className, variant, fullWidth, size, name, onBlur, as }) => {
  const isMounted = useIsMounted()
  const { accounts } = useWalletConnectClient()
  const { walletType, hathorAddress } = useAccount()
  
  // Get the appropriate address based on wallet type
  const address = walletType === 'walletconnect' 
    ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') 
    : hathorAddress || ''

  if (isMounted && !address)
    return (
      <Wallet.Button
        appearOnMount={false}
        className={className}
        variant={variant}
        fullWidth={fullWidth}
        size={size}
        name={name}
        as={as}
        onBlur={onBlur}
      >
        Connect Wallet
      </Wallet.Button>
    )

  return <>{children}</>
}
