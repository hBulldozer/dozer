import { FC, useState } from 'react'
import { Pair } from '@dozer/api'
import { RemoveSectionLegacy } from './RemoveSectionLegacy'
import { RemoveSectionSingleToken } from './RemoveSectionSingleToken'
import { Typography, classNames } from '@dozer/ui'
import { ChainId } from '@dozer/chain'
import { toToken } from '@dozer/api'
import { useWalletConnectClient } from '@dozer/higmi'
import { Switch } from '@headlessui/react'

interface RemoveSectionCombinedProps {
  pair: Pair
  prices?: { [key: string]: number }
}

export const RemoveSectionCombined: FC<RemoveSectionCombinedProps> = ({ pair, prices = {} }) => {
  const [useSingleToken, setUseSingleToken] = useState(false)
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''

  const token0 = toToken(pair.token0)
  const token1 = toToken(pair.token1)

  const ModeToggle = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200/5">
      <Typography variant="sm" weight={500} className="text-stone-400">
        Single Token Mode
      </Typography>
      <Switch
        checked={useSingleToken}
        onChange={setUseSingleToken}
        className={classNames(
          useSingleToken ? 'bg-blue-600' : 'bg-stone-700',
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-stone-900'
        )}
      >
        <span className="sr-only">Use single token mode</span>
        <span
          className={classNames(
            useSingleToken ? 'translate-x-4' : 'translate-x-0',
            'pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
          )}
        />
      </Switch>
    </div>
  )

  if (useSingleToken) {
    return (
      <div className="space-y-0">
        <ModeToggle />
        <RemoveSectionSingleToken
          chainId={ChainId.HATHOR}
          token0={token0}
          token1={token1}
          userAddress={address}
          fee={pair.swapFee}
          prices={prices}
        />
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <ModeToggle />
      <RemoveSectionLegacy pair={pair} prices={prices} />
    </div>
  )
}