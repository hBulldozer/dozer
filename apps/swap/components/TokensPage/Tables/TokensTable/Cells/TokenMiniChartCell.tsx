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

export const TokenMiniChartCell: FC<CellProps> = ({ row }) => {
  const { data: prices24h, isLoading } = api.getPrices.all24h.useQuery()
  const { data: lastPrices, isLoading: isLoadingLast } = api.getPrices.all.useQuery()
  const tokenUuid = row.id.includes('native') ? row.token0.uuid : row.token1.uuid
  const lastPrice = lastPrices?.[tokenUuid]
  let price24h: number[] = []
  if (prices24h) {
    price24h = prices24h[tokenUuid]
  }
  price24h.push(lastPrice ? lastPrice : price24h[0])
  const points = price24h.map((p, i) => ({ x: i, y: p }))
  const chartSVG = createSVGString(points, 110, 30, 6)
  return isLoading || isLoadingLast ? (
    <div className="flex flex-col gap-1 justify-center flex-grow h-[44px]">
      <Skeleton.Box className="w-[120px] h-[22px] bg-white/[0.06] rounded-full" />
    </div>
  ) : chartSVG && !chartSVG.includes('NaN') ? (
    <div
      dangerouslySetInnerHTML={{
        __html: chartSVG,
      }}
    />
  ) : (
    <Typography variant="sm" weight={300}>
      Failed to fetch
    </Typography>
  )
}
