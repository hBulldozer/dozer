import { FC } from 'react'
import { Pair } from '@dozer/api'

export const AddSectionLegacy: FC<{ pool: Pair; prices: { [key: string]: number } }> = ({ pool, prices }) => {
  return null
  /* const {
    input0,
    input1,
  } = useTrade()
  const [isLargeScreen] = useMediaQuery('(min-width: 768px)')

  return useMemo(() => {
    return (
      <AddSectionReviewModalLegacy
        isLargeScreen={isLargeScreen}
        pool={pool}
        input0={input0}
        input1={input1}
        prices={prices}
      >
        <AddSectionWidget pool={pool} prices={prices} />
      </AddSectionReviewModalLegacy>
    )
  }, [isLargeScreen, pool, input0, input1, prices]) */
}
