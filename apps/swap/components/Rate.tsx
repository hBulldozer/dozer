import { Token, Price } from '@dozer/currency'
import { classNames, Typography } from '@dozer/ui'
import { usePrices } from '@dozer/react-query'
import { FC, ReactElement, ReactNode, useCallback, useState } from 'react'
import { useNetwork } from '@dozer/zustand'

interface RenderPayload {
  invert: boolean
  toggleInvert(): void
  content: ReactElement
  usdPrice?: string
}

interface Rate {
  price: Price<Token, Token> | undefined
  children?: (payload: RenderPayload) => ReactNode
}

export const Rate: FC<Rate> = ({ children, price }) => {
  const [invert, setInvert] = useState(false)
  const { network } = useNetwork()
  const { data: prices } = usePrices(network)
  const usdPrice = price ? prices?.[invert ? price.quoteCurrency.uuid : price.baseCurrency.uuid]?.toFixed(2) : undefined

  const content = (
    <>
      {invert ? (
        <>
          1 {price?.invert().baseCurrency.symbol} = {price?.invert().toSignificant(6)}{' '}
          {price?.invert().quoteCurrency.symbol}
        </>
      ) : (
        <>
          1 {price?.baseCurrency.symbol} = {price?.toSignificant(6)} {price?.quoteCurrency.symbol}
        </>
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
        {price ? (
          <div className="flex items-center h-full gap-1 font-medium" onClick={toggleInvert}>
            {content} <span className="text-slate-500">(${usdPrice})</span>
          </div>
        ) : (
          'Enter an amount'
        )}
      </Typography>
    </div>
  )
}
