// import { HTR } from '@dozer/currency'
import { ChainId } from '@dozer/chain'
import { getTokens } from '@dozer/currency'
import { Currency } from '@dozer/ui'
import { FC } from 'react'

import { ICON_SIZE } from './contants'
import { CellProps } from './types'

export const PairRewardsCell: FC<CellProps> = ({ row }) => {
  return (
    <Currency.IconList iconHeight={ICON_SIZE} iconWidth={ICON_SIZE}>
      <Currency.Icon currency={getTokens(ChainId.HATHOR)[0]} />
    </Currency.IconList>
  )
}
