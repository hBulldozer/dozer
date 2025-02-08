import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@dozer/database'
import { client } from 'utils/api'

interface Point {
  x: number
  y: number
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const pools = await prisma.pool.findMany({ select: { id: true, token0: true, token1: true } })
    const tokensId: string[] = []
    const svgStringArray: string[] = []
    await Promise.all(
      pools.map(async (pool) => {
        const prices24h = await client.getPrices.all24h.query()
        const lastPrices = await client.getPrices.all.query()
        const tokenUuid = pool.id.includes('native') ? pool.token0.uuid : pool.token1.uuid
        const tokenId = pool.id.includes('native') ? pool.token0.id : pool.token1.id
        tokensId.push(tokenId)
        const lastPrice = lastPrices?.[tokenUuid]
        let price24h: number[] = []
        if (prices24h) {
          price24h = prices24h[tokenUuid].map((p) => Number(p.toPrecision(5)))
        }
        price24h.push(lastPrice ? Number(lastPrice.toPrecision(5)) : price24h[0])
        const points = price24h.map((p, i) => ({ x: i, y: p }))
        const chartSVG =
          pool.id.includes('usdt') || Math.min(...price24h) == Math.max(...price24h)
            ? generateHorizontalLineSvg(110, 30, 6)
            : createSVGString(points, 110, 30, 6)
        svgStringArray.push(chartSVG && !chartSVG.includes('NaN') ? chartSVG : generateHorizontalLineSvg(110, 30, 6))
      })
    )
    tokensId.map(async (value, index) => {
      await prisma.token.update({
        where: {
          id: value,
        },
        data: {
          miniChartSVG: svgStringArray[index],
        },
      })
    })
    prisma.$disconnect()
    return response.status(200).end('Updated!')
  } else return response.status(401).end(`Not Authorized !`)
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
