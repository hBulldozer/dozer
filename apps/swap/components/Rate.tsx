import { Token, Price } from '@dozer/currency'
import { classNames, Typography } from '@dozer/ui'
import { usePrices } from '@dozer/react-query'
import { FC, ReactElement, ReactNode, useCallback, useState } from 'react'
import { useNetwork, useTrade } from '@dozer/zustand'

interface RenderPayload {
  invert: boolean
  toggleInvert(): void
  content: ReactElement
  usdPrice?: string
}

interface Rate {
  token1: Token | undefined
  token2: Token | undefined
  children?: (payload: RenderPayload) => ReactNode
}

export const Rate: FC<Rate> = ({ children, token1, token2 }) => {
  const [invert, setInvert] = useState(false)
  const { network } = useNetwork()
  const { data: prices } = usePrices(network)
  const trade = useTrade()
  const usdPrice = token1 && token2 ? prices?.[invert ? token2.uuid : token1.uuid] : undefined

  const content = (
    <>
      {token1 && token2 && trade.outputAmount && trade.amountSpecified ? (
        invert ? (
          <>
            1 {token2?.symbol} = {(trade.outputAmount / trade.amountSpecified).toFixed(2)} {token1?.symbol}
          </>
        ) : (
          <>
            1 {token1?.symbol} = {(trade.outputAmount / trade.amountSpecified).toFixed(2)} {token2?.symbol}
          </>
        )
      ) : (
        <Typography>Enter an amount</Typography>
      )}
    </>
  )

  const toggleInvert = useCallback(() => {
    setInvert((prevState) => !prevState)
  }, [])

  if (typeof children === 'function') {
    return <>{children({ invert, toggleInvert, content, usdPrice })}</>
  }

  return (
    <div
      className={classNames(
        'text-slate-300 hover:text-slate-200 flex justify-between border-t border-opacity-40 border-slate-700'
      )}
    >
      <Typography variant="xs" className={classNames('cursor-pointer h-[36px] flex items-center gap-1')}>
        Rate
      </Typography>
      <Typography variant="xs" className={classNames('cursor-pointer h-[36px] flex items-center ')}>
        <div className="flex items-center h-full gap-1 font-medium" onClick={toggleInvert}>
          {content} <span className="text-slate-500">(${usdPrice})</span>
        </div>
      </Typography>
    </div>
  )
}
