import { ChainId } from '@dozer/chain'
import React from 'react'

import { HathorNaked } from './HathorNaked'
// import { HathorTestNaked } from './HathorTestNaked'
export * from './HathorNaked'
// export * from './HathorTestNaked'

export const NETWORK_NAKED_ICON: Record<number, (props: React.ComponentProps<'svg'>) => JSX.Element> = {
  [ChainId.HATHOR]: HathorNaked,
  [ChainId.HATHOR_TESTNET]: HathorNaked,
}
