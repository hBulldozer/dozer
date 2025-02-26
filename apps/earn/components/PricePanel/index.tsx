import { FC, useState, useEffect, useMemo } from 'react'
import { useIsMounted } from '@dozer/hooks'
import { Typography, Skeleton } from '@dozer/ui'

interface PricePanelProps {
  amount: string
  tokenSymbol: string
  prices: Record<string, number>
  loading?: boolean
}

const PricePanel: FC<PricePanelProps> = ({ amount, tokenSymbol, prices, loading }) => {
  const isMounted = useIsMounted()
  const [usdValue, setUsdValue] = useState<number | undefined>(0)
  
  const parsedAmount = useMemo(() => parseFloat(amount), [amount])
  
  // Map token symbols to their equivalent in the prices object
  const tokenPriceKey = useMemo(() => {
    if (tokenSymbol === 'hUSDT') return 'usdt'
    if (tokenSymbol === 'hETH') return 'eth'
    if (tokenSymbol === 'hBTC') return 'btc'
    if (tokenSymbol === 'HTR') return 'htr'
    return tokenSymbol.toLowerCase()
  }, [tokenSymbol])
  
  // Get price for the selected token
  const tokenPrice = useMemo(() => {
    if (!prices || !tokenPriceKey) return 1
    return prices[tokenPriceKey] || 1
  }, [prices, tokenPriceKey])
  
  useEffect(() => {
    if (parsedAmount && tokenPrice) {
      setUsdValue(parsedAmount * tokenPrice)
    } else {
      setUsdValue(0)
    }
  }, [parsedAmount, tokenPrice])
  
  if ((!prices && isMounted) || loading)
    return (
      <div className="h-[24px] w-[60px] flex items-center">
        <Skeleton.Box className="bg-white/[0.06] h-[12px] w-full" />
      </div>
    )

  return (
    <Typography variant="xs" weight={400} className="select-none text-stone-500">
      ${parsedAmount && !isNaN(parsedAmount) && isMounted ? Number(usdValue).toFixed(2) : '0.00'}
    </Typography>
  )
}

export default PricePanel
