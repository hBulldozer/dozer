import { Button } from '@dozer/ui'
import { FC, ReactElement } from 'react'

import { CheckerButton } from './types'

export interface PoolProps extends CheckerButton {
  poolExist: boolean
}

export const Pool: FC<PoolProps> = ({ poolExist, children, ...rest }): ReactElement<any, any> | null => {
  if (!poolExist)
    return (
      <Button disabled={true} {...rest}>
        Pool does not exist
      </Button>
    )

  return <>{children}</>
}
