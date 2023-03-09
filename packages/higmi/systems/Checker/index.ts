import { FC } from 'react'

import { Amounts, AmountsProps } from './Amounts'
import { Connected } from './Connected'
import { Pool, PoolProps } from './Pool'
import { CheckerButton } from './types'

export type CheckerProps = {
  Amounts: FC<AmountsProps>
  Connected: FC<CheckerButton>
  Pool: FC<PoolProps>
}

export const Checker: CheckerProps = { Amounts, Connected, Pool }
