import { FC, HTMLProps } from 'react'

import { classNames } from '../index'

export interface BoxProps extends HTMLProps<HTMLDivElement> {
  variant?: 'default' | 'fast' | 'pulse'
}

export const Box: FC<BoxProps> = ({ variant = 'default', ...props }) => {
  const animationClass = {
    default: 'shimmer',
    fast: 'shimmer-fast',
    pulse: 'pulse-subtle'
  }[variant]

  return <div {...props} className={classNames(props.className, 'rounded-lg overflow-hidden', animationClass)} />
}
