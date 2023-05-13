import { formatUSD } from '@dozer/format'
import { useInViewport } from '@dozer/hooks'
import { Typography } from '@dozer/ui'
import { FC, useRef } from 'react'

// import { PoolPositionProvider } from '../../../../PoolPositionProvider'
// import { PoolPositionStakedProvider } from '../../../../PoolPositionStakedProvider'
import { CellProps } from './types'

export const PairValueCell: FC<CellProps> = ({ row }) => {
  const ref = useRef<HTMLDivElement>(null)
  const inViewport = useInViewport(ref)
  return (
    <div ref={ref}>
      {inViewport && (
        // <PoolPositionProvider watch={false} pair={row.pair}>
        //   <PoolPositionStakedProvider watch={false} pair={row.pair}>
        <_PairValueCell row={row} />
        //   </PoolPositionStakedProvider>
        // </PoolPositionProvider>
      )}
    </div>
  )
}

const _PairValueCell: FC<CellProps> = ({ row }) => {
  return (
    <Typography variant="sm" weight={600} className="text-right text-slate-50">
      {formatUSD(row.volumeUSD)}
    </Typography>
  )
}
