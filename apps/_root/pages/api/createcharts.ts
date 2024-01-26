import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

interface Point {
  x: number
  y: number
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const tokens = await prisma.token.findMany({ where: { isLiquidityToken: false }, select: { id: true, uuid: true } })
    const tokensId: string[] = []
    const svgStringArray: string[] = []
    const kuCoinArray = await getKuCoinArray(60 * 24 * 15)
    await Promise.all(
      tokens.map(async (token) => {
        tokensId.push(token.id)
        const snaps = await getSnapsByUuid(token.uuid, kuCoinArray)
        const points: Point[] = snaps.map((snap: number, index: number) => {
          return { x: index, y: snap }
        })
        console.log(token.id, points)

        const svgString = createSVGString(points, 110, 30, 2)
        svgStringArray.push(svgString)
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

const getSnapsByUuid = async (tokenUuid: string, kuCoinArray: number[]) => {
  if (tokenUuid == '00') {
    return kuCoinArray
  } else {
    const result = await prisma.hourSnapshot.findMany({
      where: {
        AND: [
          { date: { gte: new Date(Date.now() - 60 * 60 * 24 * 1000) } },
          {
            pool: {
              token0: {
                uuid: '00',
              },
            },
          },
          {
            pool: {
              token1: {
                uuid: tokenUuid,
              },
            },
          },
        ],
      },
      select: {
        reserve0: true,
        reserve1: true,
        priceHTR: true,
      },
    })

    return result.reverse().map((snap, idx) => {
      return (snap.reserve0 / snap.reserve1) * kuCoinArray[idx]
    })
  }
}
async function getKuCoinArray(size: number) {
  const now = Math.round(Date.now() / 1000)
  const resp = await fetch(
    `https://api.kucoin.com/api/v1/market/candles\?type\=5min\&symbol\=HTR-USDT\&startAt\=${now - size}\&endAt\=${now}`
  )
  const data = await resp.json()
  const kuCoinArray = data.data.map((item: string[]) => {
    return Number(item[2])
  })
  return kuCoinArray
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
      y: (point.y - minY) * scaleY,
    }))
  }

  const scaledPoints = scalePoints(data, width, height)
  const minX_scaled = Math.min(...scaledPoints.map((p) => p.x))
  const maxX_scaled = Math.max(...scaledPoints.map((p) => p.x))
  const minY_scaled = Math.min(...scaledPoints.map((p) => p.y))
  const maxY_scaled = Math.max(...scaledPoints.map((p) => p.y))
  const viewBoxValues = `0 0 ${maxX_scaled - minX_scaled + 2 * padding} ${
    maxY_scaled - minY_scaled + 3 * padding // Increase padding for the bottom
  }`

  return `
  <svg viewBox="${viewBoxValues}" width="${width}" height="${height}">
    <path d="${createPathString(scaledPoints)}" stroke="black" stroke-width="1.5" fill="none" />
  </svg>
  `
}
