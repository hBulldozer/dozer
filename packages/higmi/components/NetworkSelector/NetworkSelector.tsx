import { Popover } from '@headlessui/react'
import { ChevronDownIcon, SearchIcon } from '@heroicons/react/solid'
import { ChainId, chainName } from '@dozer/chain'
import { classNames, DEFAULT_INPUT_UNSTYLED, NetworkIcon, Typography } from '@dozer/ui'
import React, { FC, useEffect, useState } from 'react'
import { useNetwork } from '@dozer/zustand'
// import { useNetwork, useSwitchNetwork } from 'wagmi'

interface NetworkSelectorNewProps {
  supportedNetworks?: ChainId[]
}

export const NetworkSelector: FC<NetworkSelectorNewProps> = ({ supportedNetworks = [] }) => {
  // const [query, setQuery] = useState('')
  // const { chain } = useNetwork()
  // const { switchNetwork } = useSwitchNetwork()
  const { network, setNetwork } = useNetwork()

  const [rendNetwork, setRendNetwork] = useState<number>(ChainId.HATHOR)

  useEffect(() => {
    setRendNetwork(network)
  }, [network])

  if (!network) return <></>

  // const chainId = chain.id

  const panel = (
    <Popover.Panel className="flex flex-col w-full sm:w-[320px] fixed bottom-0 left-0 right-0 sm:absolute sm:bottom-[unset] sm:left-[unset] mt-4 sm:rounded-xl rounded-b-none shadow-md shadow-black/[0.3] bg-stone-900 border border-stone-200/20">
      {/* <div className="flex items-center gap-2 p-4 pb-3">
        <SearchIcon width={20} height={20} className="text-stone-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={classNames(DEFAULT_INPUT_UNSTYLED, 'w-full bg-transparent placeholder:font-medium text-base')}
          placeholder="Search networks"
        />
      </div> */}
      <div className="mx-4 border-b border-stone-200/10" />
      <div className="p-2 max-h-[300px] scroll">
        {supportedNetworks
          // .filter((el) => (query ? chainName[el].toLowerCase().includes(query.toLowerCase()) : Boolean))
          .map((el) => (
            <Popover.Button
              as="div"
              onClick={() => {
                // switchNetwork && switchNetwork(el)
                setNetwork(el)
              }}
              key={el}
              className={classNames(
                'hover:bg-white/[0.08] px-1 flex rounded-lg justify-between gap-2 items-center cursor-pointer transform-all h-[40px]'
              )}
            >
              <div className="flex items-center gap-2">
                <NetworkIcon type="naked" chainId={el} width={22} height={22} />
                <Typography variant="sm" weight={500} className="text-stone-50">
                  {chainName[el]}
                </Typography>
              </div>
              {/* {chain?.id === el && <div className="w-2 h-2 mr-1 rounded-full bg-green" />} */}
              {rendNetwork === el && <div className="w-2 h-2 mr-1 rounded-full bg-green" />}
            </Popover.Button>
          ))}
      </div>
    </Popover.Panel>
  )

  return (
    <Popover className="relative">
      {({ open }) => {
        return (
          <>
            <Popover.Button
              className={classNames(
                DEFAULT_INPUT_UNSTYLED,
                'flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white h-[38px] rounded-xl px-2 pl-3 !font-semibold !text-sm text-stone-200'
              )}
            >
              <NetworkIcon type="naked" chainId={rendNetwork} width={20} height={20} />
              <div className="hidden sm:block">
                {/* {chainName?.[chainId]?.replace('Mainnet Shard 0', '')?.replace('Mainnet', '')?.trim()} */}
                {chainName?.[rendNetwork]}
              </div>
              <ChevronDownIcon
                width={20}
                height={20}
                className={classNames(open ? 'rotate-180' : 'rotate-0', 'transition-transform')}
              />
            </Popover.Button>
            {panel}
          </>
        )
      }}
    </Popover>
  )
}
