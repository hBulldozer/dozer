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

export async function main(nano_info: NanoInfoType | undefined, seedConfig: SeedConfig) {
  const config = seedConfig
  console.log('*** Starting to seed DB... ***')
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
  // Historical data is now fetched directly from blockchain via history API

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

export async function seed_db(seedConfig: SeedConfig, nano_info?: NanoInfoType) {
  main(nano_info, seedConfig)
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
