import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

interface Point {
  x: number
  y: number
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const _pools = await prisma.pool.findMany({ include: { token0: true, token1: true, hourSnapshots: true } })
    const pools = _pools.filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')

    await Promise.all(
      pools.map((pool) => {
        const token = pool.token0.uuid == '00' ? pool.token1 : pool.token0
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
        const createPathString = (points: Point[]): string => {
          return (
            `M${points[0].x},${points[0].y}` +
            points
              .slice(1)
              .map((point) => `L${point.x},${point.y}`)
              .join('')
          )
        }

        const minX = Math.min(...points.map((p) => p.x))
        const maxX = Math.max(...points.map((p) => p.x))
        const minY = Math.min(...points.map((p) => p.y))
        const maxY = Math.max(...points.map((p) => p.y))

        const scalePoints = (points: Point[], svgWidth: number, svgHeight: number): Point[] => {
          const scaleX = svgWidth / Math.max(...points.map((p) => p.x))
          const scaleY = svgHeight / Math.max(...points.map((p) => p.y))

          return points.map((point) => ({
            x: point.x * scaleX,
            y: point.y * scaleY,
          }))
        }

        console.log(createPathString(scalePoints(data, 300, 100)))

        // prisma.token.update({
        //   where: { id: token.id },
        //   data: {
        //     miniChartSVG: svgString,
        //   },
        // })
      })
    )
    return response.status(200).end('Updated!')
  } else return response.status(401).end(`Not Authorized !`)
}
