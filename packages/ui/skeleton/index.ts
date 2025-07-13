import { FC } from 'react'

import { Box, BoxProps } from './Box'
import { Circle, CircleProps } from './Circle'

export const Skeleton: {
  Box: FC<BoxProps>
  Circle: FC<CircleProps>
} = {
  Box: Box,
  Circle: Circle,
}
