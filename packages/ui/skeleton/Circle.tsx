import { FC, HTMLProps } from 'react'

import { classNames } from '../index'

export interface CircleProps extends HTMLProps<HTMLDivElement> {
  radius: number
  variant?: 'default' | 'fast' | 'pulse'
}

export const Circle: FC<CircleProps> = ({ variant = 'default', ...props }) => {
  const animationClass = {
    default: 'shimmer',
    fast: 'shimmer-fast',
    pulse: 'pulse-subtle'
  }[variant]

  return (
    <div
      {...props}
      style={{
        minWidth: props.radius,
        minHeight: props.radius,
        width: props.radius,
        height: props.radius,
      }}
      className={classNames(props.className, 'rounded-full overflow-hidden', animationClass)}
    />
  )
}
