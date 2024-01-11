import { FC, useEffect, useState } from 'react'
import { useAccount } from '@dozer/zustand'

import { TokensTable } from './Tables'

export const TokensSection: FC = () => {
  const accountAddress = useAccount((state) => state.address)
  const [address, setAddress] = useState('')

  useEffect(() => {
    setAddress(accountAddress)
  }, [accountAddress])

  return <TokensTable />
}
