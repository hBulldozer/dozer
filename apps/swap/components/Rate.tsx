import { Token } from '@dozer/currency'
import { classNames, Typography } from '@dozer/ui'
import { FC, ReactElement, ReactNode, useCallback, useEffect, useState } from 'react'
import { useTrade } from '@dozer/zustand'

interface RenderPayload {
  invert: boolean
  toggleInvert(): void
  content: ReactElement
  usdPrice?: string
  prices?: { [key: string]: number }
}

interface Rate {
  token1: Token | undefined
  token2: Token | undefined
  children?: (payload: RenderPayload) => ReactNode
  prices?: { [key: string]: number }
}

export const Rate: FC<Rate> = ({ children, token1, token2, prices }) => {
  const [invert, setInvert] = useState(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const trade = useTrade()
  const usd = token1 && token2 ? prices?.[invert ? token2.uuid : token1.uuid] : undefined
  const [usdPrice, setUsdPrice] = useState<string | undefined>('')

  useEffect(() => {
    setUsdPrice(usd?.toString())
  }, [usd])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const content = isMounted ? (
    <>
      {token1 && token2 && trade.amountSpecified ? (
        invert ? (
          <>
            1 {token2?.symbol} = {0} {token1?.symbol}
          </>
        ) : (
          <>
            1 {token1?.symbol} = {0} {token2?.symbol}
          </>
        )
      ) : (
        <Typography>Enter an amount</Typography>
      )}
    </>
  ) : (
    <></>
  )

  const toggleInvert = useCallback(() => {
    setInvert((prevState) => !prevState)
  }, [])

  if (typeof children === 'function') {
    return <>{children({ invert, toggleInvert, content, usdPrice, prices })}</>
  }

  return isMounted ? (
    <div
      className={classNames(
        'text-stone-300 hover:text-stone-200 flex justify-between border-t border-opacity-40 border-stone-700'
      )}
    >
      <Typography variant="xs" className={classNames('cursor-pointer h-[36px] flex items-center gap-1')}>
        Rate
      </Typography>
      <Typography variant="xs" className={classNames('cursor-pointer h-[36px] flex items-center ')}>
        <div className="flex items-center h-full gap-1 font-medium" onClick={toggleInvert}>
          {content}
          {/* <span className="text-stone-500">{trade.amountSpecified ? `(${usdPrice})` : null}</span> */}
        </div>
      </Typography>
    </div>
  ) : null
}
