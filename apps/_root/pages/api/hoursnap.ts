// import { NextApiRequest, NextApiResponse } from 'next'
// import { prisma } from '@dozer/database'
// import { client } from 'utils/api'

// export default async function handler(request: NextApiRequest, response: NextApiResponse) {
//   if (request.query.key && request.query.key === process.env.API_KEY) {
//     const resp = await fetch('https://api.kucoin.com/api/v1/prices?currencies=HTR')
//     const data = await resp.json()
//     const priceHTR = Number(data.data.HTR)
//     const pools = await prisma.pool.findMany()
//     const pools_array: {
//       poolId: string
//       apr: number
//       date: Date
//       liquidityUSD: number
//       volumeUSD: number
//       reserve0: number
//       reserve1: number
//       priceHTR: number
//     }[] = []
//     await Promise.all(
//       pools.map((pool) => {
//         return client.getPools.byIdFromContract.query({ id: pool.id }).then((poolNC) => {
//           pools_array.push({
//             poolId: pool.id,
//             apr: pool.apr + Math.random(),
//             date: new Date(),
//             liquidityUSD: pool.liquidityUSD + Math.random() * 10,
//             volumeUSD: pool.volumeUSD + Math.random() * 10000,
//             reserve0: Number(poolNC ? poolNC.reserve0 : pool.reserve0),
//             reserve1: Number(poolNC ? poolNC.reserve1 : pool.reserve1),
//             priceHTR: priceHTR,
//           })
//         })
//       })
//     )

//     const snaps = await prisma.hourSnapshot.createMany({
//       data: pools_array,
//     })

//     prisma.$disconnect()
//     return response.status(200).end('Updated!')
//   } else return response.status(401).end(`Not Authorized !`)
// }
