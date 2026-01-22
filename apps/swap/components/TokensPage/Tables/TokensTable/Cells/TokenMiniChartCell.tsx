import { FC } from 'react'

import { CellProps } from './types'
import { api } from 'utils/api'
import { Skeleton, Typography } from '@dozer/ui'

interface Point {
  x: number
  y: number
}

const createSVGString = (data: Point[], width: number, height: number, padding: number) => {
  const createPathString = (points: Point[]): string => {
    return (
      `M${points[0].x},${points[0].y}` +
      points
        .slice(1)
        .map((point) => `L${point.x},${point.y}`)
        .join('')
    )
  }

  const minX = Math.min(...data.map((p) => p.x))
  const maxX = Math.max(...data.map((p) => p.x))
  const minY = Math.min(...data.map((p) => p.y))
  const maxY = Math.max(...data.map((p) => p.y))

  const scalePoints = (points: Point[], svgWidth: number, svgHeight: number): Point[] => {
    const scaleX = svgWidth / (maxX - minX)
    const scaleY = svgHeight / (maxY - minY)
    return points.map((point) => ({
      x: (point.x - minX) * scaleX,
      y: svgHeight - (point.y - minY) * scaleY,
    }))
  }

  const scaledPoints = scalePoints(data, width, height)
  const minX_scaled = Math.min(...scaledPoints.map((p) => p.x))
  const maxX_scaled = Math.max(...scaledPoints.map((p) => p.x))
  const minY_scaled = Math.min(...scaledPoints.map((p) => p.y))
  const maxY_scaled = Math.max(...scaledPoints.map((p) => p.y))
  const viewBoxValues = `0 0 ${maxX_scaled - minX_scaled + padding} ${maxY_scaled - minY_scaled + padding}`

  const change = data[data.length - 1].y - data[0].y
  return `
  <svg viewBox="${viewBoxValues}" width="${width}" height="${height}">
    <path d="${createPathString(scaledPoints)}" stroke=${
    change >= 0 ? '#4ade80' : '#f87171'
  } stroke-width="1.5" fill="none" />
  </svg>
  `
}

function generateHorizontalLineSvg(width: number, height: number, padding: number): string {
  // Calculate the center y-coordinate
  const centerY = height / 2

  // Define the SVG string with a line element
  const svgString = `
  <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <line x1="${padding}" y1="${centerY}" x2="${width - padding}" y2="${centerY}" stroke="#4ade80" stroke-width="1.5" />
  </svg>
  `

  return svgString
}

export const TokenMiniChartCell: FC<CellProps> = ({ row, displayCurrency = 'USD' }) => {
  // Extract token UUID from row ID
  const tokenUuid = row.id.replace('token-', '')

  // Determine if the chart should be flat (HTR in HTR mode is always 1)
  const isHtrInHtrMode = displayCurrency === 'HTR' && tokenUuid === '00'
  // hUSDC is only flat in USD mode, in HTR mode it fluctuates (inverse of HTR)
  const isHusdcInUsdMode = displayCurrency === 'USD' && row.id.includes('husdc')
  const isHusdcInHtrMode = displayCurrency === 'HTR' && row.id.includes('husdc')

  // Fetch chart data using the appropriate currency
  // For hUSDC in HTR mode, we fetch HTR's USD chart and will invert it
  const { data: chartData, isLoading } = api.getPrices.chartData.useQuery(
    {
      tokenUid: isHusdcInHtrMode ? '00' : tokenUuid, // For hUSDC in HTR mode, use HTR's chart
      currency: isHusdcInHtrMode ? 'USD' : displayCurrency,
      points: 10,
    },
    {
      enabled: !!tokenUuid && !isHtrInHtrMode && !isHusdcInUsdMode,
      staleTime: 60000,
      refetchInterval: 120000,
    }
  )

  // Handle loading state
  if (isLoading && !isHtrInHtrMode && !isHusdcInUsdMode) {
    return (
      <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
        <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
      </div>
    )
  }

  // Handle stable cases (HTR in HTR mode, hUSDC in USD mode - always flat line)
  if (isHtrInHtrMode || isHusdcInUsdMode) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: generateHorizontalLineSvg(110, 30, 6),
        }}
      />
    )
  }

  // Process chart data and create SVG
  if (chartData && chartData.length > 1) {
    // Convert chart data to points - chartData has format {timestamp, price, date}
    let prices = chartData.map((point) => point.price).filter((price) => price > 0)

    // For hUSDC in HTR mode, invert the prices (1/price) to show USD value in HTR
    // This creates the inverse chart pattern
    if (isHusdcInHtrMode) {
      prices = prices.map((price) => (price > 0 ? 1 / price : 0)).filter((price) => price > 0)
    }

    // Check if all prices are the same (flat line)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const isFlat = prices.length === 0 || minPrice === maxPrice

    if (isFlat) {
      return (
        <div
          dangerouslySetInnerHTML={{
            __html: generateHorizontalLineSvg(110, 30, 6),
          }}
        />
      )
    }

    // Create points for SVG path
    const points: Point[] = prices.map((price, index) => ({
      x: index,
      y: price,
    }))

    try {
      const chartSVG = createSVGString(points, 110, 30, 6)

      // Validate SVG doesn't contain NaN values
      if (chartSVG && !chartSVG.includes('NaN')) {
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: chartSVG,
            }}
          />
        )
      }
    } catch (error) {
      console.error('Error creating chart SVG:', error)
    }
  }

  // Fallback: show horizontal line if no valid data or errors
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: generateHorizontalLineSvg(110, 30, 6),
      }}
    />
  )
}
