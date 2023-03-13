import { ButtonProps } from '@dozer/ui'
import { ReactNode } from 'react'

export interface CheckerButton extends ButtonProps<'button'> {
  children: ReactNode
}
