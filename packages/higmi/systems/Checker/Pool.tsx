import { Button } from '@dozer/ui'
import { FC, ReactElement, useMemo } from 'react'

import { CheckerButton } from './types'
import { Token } from '@dozer/currency'
import router from 'next/router'
import Link from 'next/link'

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
    if (!poolExist && token0 && token1)
      return (
        <Link href="/create">
          <Button fullWidth onClick={() => router.push('/pool/create')} size="md">
            Create Pool
          </Button>
        </Link>
      )

    return <>{children}</>
  }, [poolExist, as, children, className, fullWidth, size, variant])
}
