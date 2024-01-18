import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@dozer/database'

interface Point {
  x: number
  y: number
}

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.query.key && request.query.key === process.env.API_KEY) {
    const tokens = await prisma.token.findMany({ select: { id: true, uuid: true } })
    const tokensId: string[] = []
    const svgStringArray: string[] = []
    await Promise.all(
      tokens.map(async (token) => {
        tokensId.push(token.id)
        const snaps = await getSnapsByUuid(token.uuid)
        const points: Point[] = snaps.map((snap, index) => {
          return { x: index, y: snap }
        })

        const svgString = createSVGString(points, 110, 30, 2)
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

const getSnapsByUuid = async (tokenUuid: string) => {
  if (tokenUuid == '00') {
    const result = await prisma.hourSnapshot.findMany({
      where: {
        AND: [
          { date: { gte: new Date(Date.now() - 60 * 60 * 24 * 1000) } },
          {
            pool: {
              id: '1',
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
    return result.map((snap) => {
      return snap.priceHTR
    })
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
    return result.map((snap) => {
      return (snap.reserve0 / snap.reserve1) * snap.priceHTR
    })
  }
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
