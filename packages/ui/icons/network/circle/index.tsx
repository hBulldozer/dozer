import { ChainId } from '@dozer/chain'
import React from 'react'

import { HathorCircle } from './HathorCircle'
import { HathorTestCircle } from './HathorTestCircle'
export * from './HathorCircle'
export * from './HathorTestCircle'

export const NETWORK_CIRCLE_ICON: Record<number, (props: React.ComponentProps<'svg'>) => JSX.Element> = {
  [ChainId.HATHOR]: HathorCircle,
  [ChainId.HATHOR_TESTNET]: HathorTestCircle,
}
