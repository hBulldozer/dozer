import { FC, useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Pair } from '@dozer/api'
import { AddSectionLegacy } from './AddSectionLegacy'
import { AddSectionSingleToken } from './AddSectionSingleToken'
import { Typography, classNames } from '@dozer/ui'
import { ChainId } from '@dozer/chain'
import { toToken } from '@dozer/api'
import { Switch } from '@headlessui/react'
import { Type } from '@dozer/currency'

interface AddSectionCombinedProps {
  pool: Pair
  prices: { [key: string]: number }
}

export const AddSectionCombined: FC<AddSectionCombinedProps> = ({ pool, prices }) => {
  const router = useRouter()
  const [useSingleToken, setUseSingleToken] = useState(false)
  const [input, setInput] = useState('')

  // Memoize tokens to prevent infinite re-renders
  const token0 = useMemo(() => toToken(pool.token0), [pool.token0])
  const token1 = useMemo(() => toToken(pool.token1), [pool.token1])

  const [selectedToken, setSelectedToken] = useState<Type | null>(null)

  // Initialize selectedToken
  useEffect(() => {
    if (!selectedToken && token0) {
      setSelectedToken(token0)
    }
  }, [token0, selectedToken])

  // Handle singleToken query parameter
  useEffect(() => {
    const singleToken = router.query.singleToken
    if (singleToken && typeof singleToken === 'string') {
      setUseSingleToken(true)

      // Find token by symbol
      const targetToken = [token0, token1].find((token) => token.symbol?.toLowerCase() === singleToken.toLowerCase())

      if (targetToken) {
        setSelectedToken(targetToken)
      }
    }
  }, [router.query.singleToken, token0, token1])

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

  if (useSingleToken && selectedToken) {
    return (
      <div className="space-y-0">
        <ModeToggle />
        <AddSectionSingleToken
          chainId={ChainId.HATHOR}
          input={input}
          token={selectedToken}
          otherToken={selectedToken.uuid === token0.uuid ? token1 : token0}
          isLoading={false}
          onSelectToken={setSelectedToken}
          onInput={setInput}
          prices={prices}
          fee={pool.swapFee}
        />
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <ModeToggle />
      <AddSectionLegacy pool={pool} prices={prices} />
    </div>
  )
}
