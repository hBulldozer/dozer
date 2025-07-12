import { Token } from '@dozer/currency'
import { classNames, Typography, Skeleton } from '@dozer/ui'
import { FC, ReactElement, ReactNode, useCallback, useEffect, useState } from 'react'
import { useTrade } from '@dozer/zustand'

// Simple number formatting
const formatRate = (value: number): string => {
  if (value === 0) return '0.00'
  if (value >= 0.1) {
    return value.toFixed(2)
  }
  if (value < 0.1) {
    return value.toFixed(4)
  }
  return value.toFixed(2)
}

// Simple USD formatting
const formatUSD = (value: number): string => {
  if (value === 0) return '0.00'
  if (value >= 0.1) {
    return value.toFixed(2)
  }
  if (value < 0.1) {
    return value.toFixed(4)
  }
  return value.toFixed(2)
}

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
  loading?: boolean
}

export const Rate: FC<Rate> = ({ children, token1, token2, prices, loading = false }) => {
  const [invert, setInvert] = useState(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [delayedLoading, setDelayedLoading] = useState(false)
  const trade = useTrade()
  const usd = token1 && token2 ? prices?.[invert ? token2.uuid : token1.uuid] : undefined
  const [usdPrice, setUsdPrice] = useState<string | undefined>('')
  
  // Add delay when removing loading state to prevent glitch
  useEffect(() => {
    if (loading) {
      setDelayedLoading(true)
    } else {
      const timer = setTimeout(() => {
        setDelayedLoading(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [loading])
  
  // Show loading when we don't have trade data but tokens are selected, or when loading prop is true
  const isDataLoading = delayedLoading || (token1 && token2 && (!trade.amountSpecified || !trade.outputAmount))

  useEffect(() => {
    setUsdPrice(usd?.toString())
  }, [usd])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const content = isMounted ? (
    <>
      {isDataLoading ? (
        <div className="flex items-center gap-1">
          <span className="whitespace-nowrap">1 {invert ? token2?.symbol : token1?.symbol}</span>
          <span className="mx-1">=</span>
          <div className="w-[45px] flex justify-end">
            <Skeleton.Box variant="fast" className="w-[40px] h-[14px]" />
          </div>
          <span className="whitespace-nowrap">{invert ? token1?.symbol : token2?.symbol}</span>
        </div>
      ) : token1 && token2 && trade.amountSpecified && trade.outputAmount && !isDataLoading ? (
        <div className="flex items-center gap-1">
          <span className="whitespace-nowrap">
            1 {invert ? token2?.symbol : token1?.symbol}
          </span>
          <span className="mx-1">=</span>
          <div className="w-[50px] flex justify-end">
            <span className="text-right">
              {(() => {
                const rate = invert 
                  ? (trade.amountSpecified / trade.outputAmount)
                  : (trade.outputAmount / trade.amountSpecified)
                return (rate && rate > 0) ? formatRate(rate) : ''
              })()}
            </span>
          </div>
          <span className="whitespace-nowrap">
            {invert ? token1?.symbol : token2?.symbol}
          </span>
        </div>
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
          <div className="w-[60px] flex justify-end ml-2">
            {isDataLoading ? (
              <span className="text-stone-500">
                (<Skeleton.Box variant="fast" className="w-[35px] h-[12px] inline-block" />)
              </span>
            ) : trade.amountSpecified && trade.outputAmount && usdPrice ? (
              <span className="text-stone-500 text-right">
                (${formatUSD(Number(usdPrice))})
              </span>
            ) : (
              <span className="text-stone-500 invisible">
                ($00.00)
              </span>
            )}
          </div>
        </div>
      </Typography>
    </div>
  ) : null
}
