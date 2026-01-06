import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()
function generateUUID(): string {
  return crypto.randomUUID()
}

export interface TokenConfig {
  name: string
  symbol: string
  totalSupply: number
  about: string
  bridged?: boolean
  sourceChain?: string
  targetChain?: string
  originalAddress?: string
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
  await prisma.hourSnapshot.deleteMany()
  console.log('Deleted hourSnapshot Table')
  await prisma.daySnapshot.deleteMany()
  console.log('Deleted daySnapshot Table')
  await prisma.oasis.deleteMany()
  console.log('Deleted Oasis Table')
  await prisma.pool.deleteMany()
  console.log('Deleted Pool Table')
  await prisma.token.deleteMany()
  console.log('Deleted Token Table')
  await prisma.faucet.deleteMany()
  console.log('Deleted Faucet Table')
  const tokenSymbolToId: { [symbol: string]: string } = {}

  // Create tokens only
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
          about: token.about,
          bridged: token.bridged || false,
          sourceChain: token.sourceChain || null,
          targetChain: token.targetChain || null,
          originalAddress: token.originalAddress || null,
        }
      }),
    ],
  })
  console.log('Created Tokens')

  // No pool creation in DB. Only tokens are stored.

  // Historical data (snapshots) - use poolKeys from nano_info if present
  if (snaps_period && nano_info && Array.isArray(nano_info.poolKeys)) {
    console.log(`Creating snapshots for ${snaps_period} days...`)
    const poolKeys: string[] = nano_info.poolKeys
    const snapshots = []
    for (const poolKey of poolKeys) {
      // Use random or fixed values for reserves/liquidity for now
      let prevReserve0 = 100000
      let prevReserve1 = 70000
      let prevLiquidityUSD = 2 * prevReserve0
      for (let j = 0; j < snaps_period * 24 * 4; j++) {
        const snapshotTime = Date.now() - j * 15 * 60 * 1000
        const snapshotDate = new Date(snapshotTime)
        // Calculate changes with continuity
        const reserve0Change = (Math.random() - 0.5) * 1500
        const reserve1Change = (reserve0Change * prevReserve1) / (prevReserve0 + reserve0Change)
        prevReserve0 += reserve0Change
        prevReserve1 -= reserve1Change
        prevLiquidityUSD = 2 * prevReserve0
        // Store poolKey in poolId field for compatibility
        snapshots.push({
          poolId: poolKey, // poolId now stores the poolKey string
          apr: 0.1 + (Math.random() - 0.15) * 0.05,
          date: snapshotDate,
          liquidityUSD: prevLiquidityUSD,
          volumeUSD: 0,
          reserve0: prevReserve0,
          reserve1: prevReserve1,
          priceHTR: 0.04,
        })
        // Push data to daySnapshot if it's 9 PM
        if (j % (24 * 4) == 0) {
          await prisma.daySnapshot.create({
            data: {
              poolId: poolKey, // poolId now stores the poolKey string
              apr: 0.1 + (Math.random() + 0.15) * 0.05,
              date: snapshotDate,
              liquidityUSD: prevLiquidityUSD,
              volumeUSD: 0,
              reserve0: prevReserve0,
              reserve1: prevReserve1,
              priceHTR: 0.04,
            },
          })
        }
      }
    }
    // Batch insert hourSnapshots
    const chunkSize = 1000
    for (let i = 0; i < snapshots.length; i += chunkSize) {
      const chunk = snapshots.slice(i, i + chunkSize)
      await prisma.hourSnapshot.createMany({
        data: chunk,
      })
    }
    console.log('Created snapshots')
  } else {
    console.log('Skipping snapshot creation (no poolKeys or snaps_period)')
  }

  // Update token UUIDs from nano_info
  if (nano_info) {
    console.log('Updating token UUIDs...')
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
