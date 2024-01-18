import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

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

  const viewBoxValues = `${minX - padding} ${minY - padding} ${maxX - minX + 2 * padding} -${
    maxY - minY + 3 * padding // Increase padding for the bottom
  }`

  const scalePoints = (points: Point[], svgWidth: number, svgHeight: number): Point[] => {
    const scaleX = svgWidth / (maxX - minX)
    const scaleY = svgHeight / (maxY - minY)
    return points.map((point) => ({
      x: (point.x - minX) * scaleX,
      y: (point.y - minY) * scaleY,
    }))
  }

  const scaledPoints = scalePoints(data, width, height)

  return `
<svg viewBox="${viewBoxValues}" width="${width}" height="${height}">
  <path d="${createPathString(scaledPoints)}" stroke="black" stroke-width="1.5" fill="none" />
</svg>
`
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const _pools = await prisma.pool.findMany({ include: { token0: true, token1: true, hourSnapshots: true } })
    const pools = _pools.filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')
    const tokens = await prisma.token.findMany({ select: { uuid: true } })
    const tokensId: string[] = []
    const svgStringArray: string[] = []

    await Promise.all(
      pools.map((pool) => {
        const token = pool.token0.uuid == '00' ? pool.token1 : pool.token0
        tokensId.push(token.id)
        const currentDate = Math.round(Date.now())
        const [x, y] = pool.hourSnapshots.reduce<[number[], number[]]>(
          (acc, cur) => {
            const date = new Date(cur.date).getTime()
            const tokenReserve: { reserve0: number; reserve1: number } = {
              reserve0: Number(cur.reserve0),
              reserve1: Number(cur.reserve1),
            }

            const priceInUSD = (Number(tokenReserve.reserve0) / Number(tokenReserve.reserve1)) * Number(cur.priceHTR)
            if (date >= currentDate - 86400 * 1000) {
              acc[0].push(date / 1000)
              acc[1].push(priceInUSD)
            }
            return acc
          },
          [[], []]
        )
        const data = y.reverse().map((value, index) => {
          return { x: index, y: value }
        })

        const svgString = createSVGString(data, 110, 30, 2)
        svgStringArray.push(svgString)
      })
    )

    await Promise.all(
      pools.map((pool) => {
        const token = pool.token0.uuid == '00' ? pool.token0 : pool.token1
        tokensId.push(token.id)
        const currentDate = Math.round(Date.now())
        const [x, y] = pool.hourSnapshots.reduce<[number[], number[]]>(
          (acc, cur) => {
            const date = new Date(cur.date).getTime()
            const priceInUSD = Number(cur.priceHTR)
            if (date >= currentDate - 86400 * 1000) {
              acc[0].push(date / 1000)
              acc[1].push(priceInUSD)
            }
            return acc
          },
          [[], []]
        )
        const data = y.reverse().map((value, index) => {
          return { x: index, y: value }
        })

        const svgString = createSVGString(data, 110, 30, 2)
        svgStringArray.push(svgString)
      })
    )

    tokensId.map(async (value, index) => {
      // console.log(value, svgStringArray[index])
      await prisma.token.update({
        where: {
          id: value,
        },
        data: {
          miniChartSVG: svgStringArray[index],
        },
      })
    })

    return response.status(200).end('Updated!')
  } else return response.status(401).end(`Not Authorized !`)
}
