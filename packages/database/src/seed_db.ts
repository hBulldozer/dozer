import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import * as fs from 'fs'

const prisma = new PrismaClient()
function generateUUID(): string {
  return crypto.randomUUID()
}

export interface TokenConfig {
  name: string
  symbol: string
  totalSupply: number
  about: string
}

export interface PoolConfig {
  tokenSymbol: string
  htrQuantity: number
  tokenQuantity: number
  fee: number
  protocolFee: number
}

export interface OasisConfig {
  tokenSymbol: string
  htrQuantity: number
}

export interface SeedConfig {
  tokens: TokenConfig[]
  pools: PoolConfig[]
  oasis: OasisConfig[]
}

export interface NanoInfoType {
  [key: string]: string
}

export async function main(nano_info: NanoInfoType | undefined, snaps_period: number, seedConfig: SeedConfig) {
  const config = seedConfig
  console.log('*** Starting to seed DB... ***')
  const delete1 = await prisma.hourSnapshot.deleteMany()
  console.log('Deleted hourSnapshot Table')
  const delete2 = await prisma.daySnapshot.deleteMany()
  console.log('Deleted daySnapshot Table')
  const delete3 = await prisma.oasis.deleteMany()
  console.log('Deleted Oasis Table')
  const delete4 = await prisma.pool.deleteMany()
  console.log('Deleted Pool Table')
  const delete5 = await prisma.token.deleteMany()
  console.log('Deleted Token Table')
  const tokenSymbolToId: { [symbol: string]: string } = {}

  const tokens = await prisma.token.createMany({
    data: [
      {
        id: '0',
        uuid: '00',
        chainId: 1,
        name: 'Hathor',
        symbol: 'HTR',
        isFeeOnTransfer: false,
        isCommon: false,
        derivedUSD: null,
        generatedAt: new Date(),
        updatedAt: new Date(),
        decimals: 2,
        isLiquidityToken: false,
        miniChartSVG: '',
        about: '...',
      },
      ...config.tokens.map((token, index) => {
        const id = (index + 1).toString()
        const uuid = generateUUID()
        tokenSymbolToId[token.symbol] = id
        return {
          id,
          uuid: uuid, // This will be updated later with the actual UUID
          chainId: 1,
          name: token.name,
          symbol: token.symbol,
          isFeeOnTransfer: false,
          isCommon: false,
          derivedUSD: null,
          generatedAt: new Date(),
          updatedAt: new Date(),
          decimals: 2,
          isLiquidityToken: false,
          miniChartSVG: '',
          about: token.about, // You might want to add this to your config file
        }
      }),
    ],
  })
  console.log('Created Tokens')

  // Create a map to store pool names and their corresponding IDs
  const poolNameToId: { [name: string]: string } = {}

  const pools = await prisma.pool.createMany({
    data: config.pools.map((pool, index) => {
      const name = `${pool.tokenSymbol}-HTR`
      const id = index.toString()
      poolNameToId[name] = id
      return {
        name: name,
        apr: 0.1,
        chainId: 1,
        version: '0.1',
        token0Id: '0',
        token1Id: tokenSymbolToId[pool.tokenSymbol] || '',
        swapFee: pool.fee,
        feeUSD: 0,
        reserve0: pool.htrQuantity.toString(),
        reserve1: pool.tokenQuantity.toString(),
        liquidityUSD: 0,
        volumeUSD: 0,
        liquidity: 0,
        volume1d: 0,
        fees1d: 0,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        id,
      }
    }),
  })
  console.log('Created Pools')

  // Create a map to store oasis names and their corresponding IDs
  const oasisNameToId: { [name: string]: string } = {}

  const oasis = await prisma.oasis.createMany({
    data: config.oasis.map((oasis, index) => {
      const name = `${oasis.tokenSymbol}-HTR`
      const id = index.toString()
      oasisNameToId[name] = id
      return {
        name: name,
        tokenId: tokenSymbolToId[oasis.tokenSymbol] || '',
        poolId: poolNameToId[name] || '',
        id,
      }
    }),
  })
  console.log('Created Oasis')

  if (snaps_period) {
    console.log(`Creating snapshots for ${snaps_period} days...`)
    const allPools = await prisma.pool.findMany()
    const snapshots = []

    for (const pool of allPools) {
      let prevReserve0 = parseInt(pool.reserve0)
      let prevReserve1 = parseInt(pool.reserve1)
      let prevLiquidityUSD = pool.liquidityUSD

      for (let j = 0; j < snaps_period * 24 * 4; j++) {
        const snapshotTime = Date.now() - j * 15 * 60 * 1000
        const snapshotDate = new Date(snapshotTime)

        // Calculate changes with continuity
        const reserve0Change = (Math.random() - (pool.name == 'USDT-HTR' ? 0.45 : 0.55)) * 1500 // Smaller, more gradual changes
        const reserve1Change = (reserve0Change * prevReserve1) / (prevReserve0 + reserve0Change)

        prevReserve0 += reserve0Change
        prevReserve1 -= reserve1Change

        // Ensure rules are followed
        prevLiquidityUSD = 2 * prevReserve0

        snapshots.push({
          poolId: pool.id,
          apr: pool.apr + (Math.random() - 0.15) * 0.05, // Smaller APR fluctuations
          date: snapshotDate,
          liquidityUSD: prevLiquidityUSD,
          volumeUSD: 0, // pool.volumeUSD + Math.random() * 5000, // Reduced randomness
          reserve0: prevReserve0,
          reserve1: prevReserve1,
          priceHTR: pool.name == 'USDT-HTR' ? prevReserve1 / prevReserve0 : 0.04,
        })

        // Push data to daySnapshot if it's 9 PM
        if (j % (24 * 4) == 0) {
          await prisma.daySnapshot.create({
            data: {
              poolId: pool.id,
              apr: pool.apr + (Math.random() + 0.15) * 0.05, // Smaller APR fluctuations
              date: snapshotDate,
              liquidityUSD: prevLiquidityUSD,
              volumeUSD: 0, // pool.volumeUSD + Math.random() * 5000, // Reduced randomness
              reserve0: prevReserve0,
              reserve1: prevReserve1,
              priceHTR: pool.name == 'USDT-HTR' ? prevReserve1 / prevReserve0 : 0.04,
            },
          })
        }
      }
    }

    // Batch insert hourSnapshots (consider adjusting chunk size)
    const chunkSize = 1000
    for (let i = 0; i < snapshots.length; i += chunkSize) {
      const chunk = snapshots.slice(i, i + chunkSize)
      await prisma.hourSnapshot.createMany({
        data: chunk,
      })
    }
  }

  console.log('Created snapshots')

  if (nano_info) {
    console.log('Updating nano contracts info...')
    for (const [key, uuid] of Object.entries(nano_info)) {
      if (key.endsWith('_uuid')) {
        const tokenSymbol = key.replace('_uuid', '')
        const tokenId = tokenSymbolToId[tokenSymbol]
        if (tokenId) {
          await prisma.token.update({
            where: { id: tokenId },
            data: { uuid },
          })
          console.log(`Updated Token ${tokenSymbol} UUID.`)
        } else {
          console.error(`Token ID not found for symbol: ${tokenSymbol}`)
        }
      } else if (key.endsWith('_ncid')) {
        const poolName = key.replace('_ncid', '').replace('_', '-')
        const poolId = poolNameToId[poolName]
        if (poolId) {
          await prisma.pool.update({
            where: { id: poolId },
            data: { id: uuid },
          })
          console.log(`Updated Pool ${poolName} nano contract ID.`)
        } else {
          console.error(`Pool ID not found for name: ${poolName}`)
        }
      } else if (key.endsWith('_oasisncid')) {
        const oasisName = key.replace('_oasisncid', '').replace('_', '-')
        const oasisId = oasisNameToId[oasisName]
        if (oasisId) {
          await prisma.oasis.update({
            where: { id: oasisId },
            data: { id: uuid },
          })
          console.log(`Updated Oasis ${oasisName} nano contract ID.`)
        } else {
          console.error(`Pool ID not found for name: ${oasisName}`)
        }
      }
    }
  }
}

export async function seed_db(seedConfig: SeedConfig, nano_info?: NanoInfoType, snaps_period = 0) {
  main(nano_info, snaps_period, seedConfig)
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}
// seed_db(bootstrap, 5)
