import React, { FC } from 'react'

import { DozerIcon } from '../icons'
import { LoaderProps } from './types'

export const LogoLoader: FC<LoaderProps> = (props) => {
  return <DozerIcon className="animate-heartbeat" {...props} />
}
