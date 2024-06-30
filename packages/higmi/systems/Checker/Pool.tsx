import { Button } from '@dozer/ui'
import { FC, ReactElement, useMemo } from 'react'

import { CheckerButton } from './types'
import { Token } from '@dozer/currency'

export interface PoolProps extends CheckerButton {
  poolExist: boolean
  token0?: Token
  token1?: Token
}

export const Pool: FC<PoolProps> = ({
  poolExist,
  children,
  className,
  variant,
  fullWidth,
  token0,
  token1,
  as,
  size,
}): ReactElement<any, any> | null => {
  return useMemo(() => {
    if (!poolExist)
      return (
        <Button disabled={true} className={className} variant={variant} as={as} fullWidth={fullWidth} size={size}>
          Pool does not exist
        </Button>
      )

    return <>{children}</>
  }, [poolExist, as, children, className, fullWidth, size, variant])
}
