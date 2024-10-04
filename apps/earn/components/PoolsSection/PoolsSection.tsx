import { Tab } from '@headlessui/react'
// import { UserWithFarm } from '@dozer/graph-client'
import { Chip, classNames } from '@dozer/ui'
import { FC, useEffect, useState } from 'react'
import { useAccount } from '@dozer/zustand'

import { PoolsTable, PositionsTable } from './Tables'
import { Pair } from '@dozer/api'
import { useWalletConnectClient } from '@dozer/higmi'
// import { PoolsTable, PositionsTable } from './Tables'
// import { TableFilters } from './Tables/TableFilters'

export const PoolsSection: FC = () => {
  // const accountAddress = useAccount((state) => state.address)
  const [tab, setTab] = useState<number>(0)
  // const [address, setAddress] = useState('')

  // useEffect(() => {
  //   setAddress(accountAddress)
  // }, [accountAddress])

  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  return (
    <section className="flex flex-col">
      <Tab.Group selectedIndex={tab} onChange={setTab}>
        <div>
          <div className="flex items-center gap-6 mb-6">
            <Tab
              className={({ selected }) =>
                classNames(
                  selected ? 'text-stone-200' : 'text-stone-500',
                  'hover:text-stone-50 focus:text-stone-50 font-medium !outline-none'
                )
              }
            >
              All Yields
            </Tab>

            {address && (
              <Tab
                className={({ selected }) =>
                  classNames(
                    selected ? 'text-stone-200' : 'text-stone-500',
                    'hover:text-stone-50 focus:text-stone-50 flex items-center gap-2 font-medium !outline-none'
                  )
                }
              >
                My Positions
              </Tab>
            )}
          </div>
          <Tab.Panels>
            <Tab.Panel unmount={false}>
              <PoolsTable />
            </Tab.Panel>
            <Tab.Panel unmount={!address}>
              {' '}
              <PositionsTable />{' '}
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </section>
  )
}
