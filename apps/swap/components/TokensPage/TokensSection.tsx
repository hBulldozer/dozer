import { Tab } from '@headlessui/react'
// import { UserWithFarm } from '@dozer/graph-client'
import { Chip, classNames } from '@dozer/ui'
import { FC, useEffect, useState } from 'react'
import { useAccount } from '@dozer/zustand'

import { TokensTable } from './Tables'
import { Pair } from '@dozer/api'
// import { PoolsTable, PositionsTable } from './Tables'
// import { TableFilters } from './Tables/TableFilters'

export const TokensSection: FC = () => {
  const accountAddress = useAccount((state) => state.address)
  const [tab, setTab] = useState<number>(0)
  const [address, setAddress] = useState('')

  useEffect(() => {
    setAddress(accountAddress)
  }, [accountAddress])

  return <TokensTable />
}
