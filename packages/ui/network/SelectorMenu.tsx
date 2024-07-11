import { CheckIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { ChainId, chainName } from '@dozer/chain'
import { FC } from 'react'

import { classNames, NetworkIcon, Typography } from '..'
import { Select } from '../select'

export interface SelectorMenuProps {
  className?: string
  networks: ChainId[]
  selectedNetworks: ChainId[]
  onChange(selectedNetworks: ChainId[]): void
}

export const SelectorMenu: FC<SelectorMenuProps> = ({ networks, selectedNetworks, onChange }) => {
  const value = networks.length === selectedNetworks.length ? [] : selectedNetworks

  return (
    <Select
      value={value}
      onChange={(values: ChainId[]) => onChange(values.length === 0 ? networks : values)}
      button={
        <Select.Button className="ring-offset-stone-900 !bg-stone-700">
          <Typography variant="sm" weight={600} className="flex gap-2 items-center text-stone-200">
            {value.length === 0 ? (
              <>
                <CheckIcon width={20} height={20} className="text-green" /> All Networks
              </>
            ) : (
              <>
                <XCircleIcon
                  onClick={() => onChange(networks)}
                  width={20}
                  height={20}
                  className="hover:text-stone-400 text-stone-500"
                />{' '}
                {value.length} Selected
              </>
            )}
          </Typography>
        </Select.Button>
      }
      multiple
    >
      <Select.Options className="w-fit">
        {networks.map((network) => (
          <Select.Option key={network} value={network} showArrow={false} on>
            <div className="grid grid-cols-[auto_26px] gap-3 items-center w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5">
                  <NetworkIcon type="circle" chainId={network} width={20} height={20} />
                </div>
                <Typography
                  variant="sm"
                  weight={600}
                  className={classNames(
                    selectedNetworks.includes(network) && selectedNetworks.length !== networks.length
                      ? 'text-stone-50'
                      : 'text-stone-400'
                  )}
                >
                  {chainName[network]}
                </Typography>
              </div>
              <div className="flex justify-end">
                {selectedNetworks.includes(network) && selectedNetworks.length !== networks.length ? (
                  <CheckIcon width={20} height={20} className="text-blue" />
                ) : (
                  <></>
                )}
              </div>
            </div>
          </Select.Option>
        ))}
      </Select.Options>
    </Select>
  )
}
