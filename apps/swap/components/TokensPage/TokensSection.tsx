import { FC, useEffect, useState } from 'react'
import { useAccount } from '@dozer/zustand'

import { TokensTable } from './Tables'
import { useWalletConnectClient } from '@dozer/higmi'

export const TokensSection: FC = () => {
  // const accountAddress = useAccount((state) => state.address)
  // const [address, setAddress] = useState('')

  // useEffect(() => {
  //   setAddress(accountAddress)
  // }, [accountAddress])

  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  return <TokensTable />
}
