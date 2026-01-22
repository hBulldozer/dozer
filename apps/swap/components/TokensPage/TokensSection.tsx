import { FC, useEffect, useState } from 'react'
import { Tab } from '@headlessui/react'
import { classNames, Typography } from '@dozer/ui'
import { useWalletConnectClient } from '@dozer/higmi'

import { TokensTable } from './Tables'
import { CustomTokensTable } from '../CustomTokensTable'
import { useRouter } from 'next/router'

export type DisplayCurrency = 'USD' | 'HTR'

export const TokensSection: FC = () => {
  const router = useRouter()
  const params = router.query
  const [tab, setTab] = useState<number>(Number(params.tab == 'custom'))
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('USD')
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  useEffect(() => {
    if (address && params.tab == 'custom') {
      setTab(1)
    }
  }, [address, params])

  const toggleCurrency = () => {
    setDisplayCurrency((prev) => (prev === 'USD' ? 'HTR' : 'USD'))
  }

  return (
    <section className="flex flex-col">
      <Tab.Group selectedIndex={tab} onChange={setTab}>
        <div>
          <div className="flex gap-6 items-center mb-6 justify-between">
            <div className="flex gap-6 items-center">
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

            {/* USD/HTR Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCurrency}
                className={classNames(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200',
                  'bg-stone-800 hover:bg-stone-700 border border-stone-700'
                )}
              >
                <Typography
                  variant="sm"
                  weight={600}
                  className={classNames(
                    'transition-colors',
                    displayCurrency === 'USD' ? 'text-yellow-500' : 'text-stone-400'
                  )}
                >
                  USD
                </Typography>
                <Typography variant="sm" className="text-stone-500">
                  /
                </Typography>
                <Typography
                  variant="sm"
                  weight={600}
                  className={classNames(
                    'transition-colors',
                    displayCurrency === 'HTR' ? 'text-yellow-500' : 'text-stone-400'
                  )}
                >
                  HTR
                </Typography>
              </button>
            </div>
          </div>
          <Tab.Panels>
            <Tab.Panel unmount={false}>
              <TokensTable displayCurrency={displayCurrency} />
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
