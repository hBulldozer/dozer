import { FC, useEffect, useState } from 'react'
import { Tab } from '@headlessui/react'
import { classNames } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'

import { TokensTable } from './Tables'
import { CustomTokensTable } from '../CustomTokensTable'
import { useRouter } from 'next/router'

export const TokensSection: FC = () => {
  const router = useRouter()
  const params = router.query
  const [tab, setTab] = useState<number>(Number(params.tab == 'custom'))
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  useEffect(() => {
    if (address && params.tab == 'custom') {
      setTab(1)
    }
  }, [address, params])

  return (
    <section className="flex flex-col">
      <Tab.Group selectedIndex={tab} onChange={setTab}>
        <div>
          <div className="flex gap-6 items-center mb-6">
            <Tab
              className={({ selected }) =>
                classNames(
                  selected ? 'text-stone-200' : 'text-stone-500',
                  'hover:text-stone-50 focus:text-stone-50 font-medium !outline-none'
                )
              }
            >
              All Tokens
            </Tab>

            {/* {address && (
              <Tab
                className={({ selected }) =>
                  classNames(
                    selected ? 'text-stone-200' : 'text-stone-500',
                    'hover:text-stone-50 focus:text-stone-50 flex items-center gap-2 font-medium !outline-none'
                  )
                }
              >
                My Custom Tokens
              </Tab>
            )} */}
          </div>
          <Tab.Panels>
            <Tab.Panel unmount={false}>
              <TokensTable />
            </Tab.Panel>
            <Tab.Panel unmount={!address}>
              <CustomTokensTable address={address} />
            </Tab.Panel>
          </Tab.Panels>
        </div>
      </Tab.Group>
    </section>
  )
}
