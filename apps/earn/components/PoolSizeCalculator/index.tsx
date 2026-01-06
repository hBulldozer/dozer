import React, { useState, useEffect } from 'react'
import { Typography, Input, Slider, Widget, Button } from '@dozer/ui'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface PoolSizeCalculatorProps {
  onLiquiditySizeChange: (size: number) => void
}

export const PoolSizeCalculator: React.FC<PoolSizeCalculatorProps> = ({ onLiquiditySizeChange }) => {
  const [averageTradeSize, setAverageTradeSize] = useState<string>('1000')
  const [maxPriceImpact, setMaxPriceImpact] = useState<number>(1)
  const [liquiditySize, setLiquiditySize] = useState<number>(0)
  const [isExpanded, setIsExpanded] = useState<boolean>(false)

  useEffect(() => {
    // Calculate liquidity size based on average trade size and max price impact
    const calculatedLiquiditySize = Number(averageTradeSize) * (100 / maxPriceImpact)
    setLiquiditySize(calculatedLiquiditySize)
    onLiquiditySizeChange(calculatedLiquiditySize)
  }, [averageTradeSize, maxPriceImpact, onLiquiditySizeChange])

  const calculatorContent = isExpanded && (
    <div className="p-4 space-y-4 rounded-lg bg-stone-800">
      <div>
        <Typography variant="sm" weight={500} className="mb-2">
          Average Trade Size (HTR)
        </Typography>
        <Input.Numeric
          value={averageTradeSize}
          onUserInput={setAverageTradeSize}
          placeholder="Enter average trade size"
          className="w-full"
          autoComplete="off"
          data-lpignore="true"
          type="search"
          name="pool-size-calculator-search"
        />
      </div>
      <div>
        <Typography variant="sm" weight={500} className="mb-2">
          Maximum Price Impact (%)
        </Typography>
        <Slider
          value={[maxPriceImpact]}
          onValueChange={(values) => setMaxPriceImpact(values[0])}
          min={0.1}
          max={5}
          step={0.1}
          className="w-full"
        />
        <Typography variant="xs" className="mt-1 text-stone-400">
          {maxPriceImpact.toFixed(1)}%
        </Typography>
      </div>
      <div>
        <Typography variant="sm" weight={500} className="mb-2">
          Recommended Liquidity Size (HTR)
        </Typography>
        <Typography variant="lg" weight={600} className="text-yellow-500">
          {liquiditySize.toLocaleString(undefined, { maximumFractionDigits: 0 })} HTR
        </Typography>
      </div>
    </div>
  )

  return (
    <Widget id="poolSizeCalculator" maxWidth={400} className="mb-4">
      <Widget.Content>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="empty"
          size="sm"
          className="flex items-center justify-between w-full py-3"
        >
          <Typography variant="sm" weight={600}>
            Get help to define initial liquidity
          </Typography>
          {isExpanded ? (
            <ChevronUpIcon className="w-5 h-5 text-stone-400" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-stone-400" />
          )}
        </Button>
        <>{calculatorContent}</>
      </Widget.Content>
    </Widget>
  )
}
