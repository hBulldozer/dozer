import { PrismaClient } from '@prisma/client'

interface NanoInfoType {
  DZR_uuid: string
  USDT_uuid: string
  NST_uuid: string
  KELB_uuid: string
  CTHOR_uuid: string
  HTR_USDT_ncid: string
  HTR_DZR_ncid: string
  HTR_KELB_ncid: string
  HTR_NST_ncid: string
  HTR_CTHOR_ncid: string
}
const prisma = new PrismaClient()
export async function main(nano_info: NanoInfoType | undefined, snaps_period: number) {
  console.log('*** Starting to seed DB... ***')
  const delete1 = await prisma.hourSnapshot.deleteMany()
  console.log('Deleted hourSnapshot Table')
  const delete2 = await prisma.daySnapshot.deleteMany()
  console.log('Deleted daySnapshot Table')
  const delete3 = await prisma.pool.deleteMany()
  console.log('Deleted Pool Table')
  const delete4 = await prisma.token.deleteMany()
  console.log('Deleted Token Table')
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
        about:
          'Hathor arranges its transactions in a DAG - outside the blocks - which are confirmed by the blocks. This design reportedly allows Hathor to be highly scalable and decentralized. Hathor aims to tackle the complexity of creating a new token. Tokens in the network will reportedly operate with the same scalability and security parameters as the native HTR token. The team started the development of the project on 27 Aug 2018 and the mainnet network was launched on 3 Jan 2020. The project is public and open-source, with anyone welcome to join.',
      },
      {
        id: '1',
        uuid: '0000018844a71bca14d62f0e8cd2f304885d4b77069ad47c8e49905d9ef913d2',
        chainId: 1,
        name: 'Dozer',
        symbol: 'DZR',
        isFeeOnTransfer: false,
        isCommon: false,
        derivedUSD: null,
        generatedAt: new Date(),
        updatedAt: new Date(),
        decimals: 2,
        isLiquidityToken: false,
        miniChartSVG: '',
        about:
          'DZR is the native utility token of Dozer Finance, a decentralized finance (DeFi) platform built on the Hathor Network. DZR token holders can participate in platform governance, earn staking rewards, and access exclusive features within the Dozer ecosystem. With zero gas fees and instant finality, DZR is designed to facilitate seamless transactions and empower users to take control of their financial future.',
      },
      {
        id: '2',
        uuid: '0000014cc48671f021032c78dc347392944f509c91ef03b5ae0405a6cc73706d',
        chainId: 1,
        name: 'USD Tether',
        symbol: 'USDT',
        isFeeOnTransfer: false,
        isCommon: false,
        derivedUSD: null,
        generatedAt: new Date(),
        updatedAt: new Date(),
        decimals: 2,
        isLiquidityToken: false,
        miniChartSVG: '',
        about:
          'Tether (USDT) is a cryptocurrency with a value meant to mirror the value of the U.S. dollar. The idea was to create a stable cryptocurrency that can be used like digital dollars. Coins that serve this purpose of being a stable dollar substitute are called “stable coins.” Tether is the most popular stable coin and even acts as a dollar replacement on many popular exchanges! According to their site, Tether converts cash into digital currency, to anchor or “tether” the value of the coin to the price of national currencies like the US dollar, the Euro, and the Yen. Like other cryptos it uses blockchain. Unlike other cryptos, it is [according to the official Tether site] “100% backed by USD” (USD is held in reserve). The primary use of Tether is that it offers some stability to the otherwise volatile crypto space and offers liquidity to exchanges who can’t deal in dollars and with banks',
      },
      {
        id: '3',
        uuid: '00000000f76262bb1cca969d952ac2f0e85f88ec34c31f26a13eb3c31e29',
        chainId: 1,
        name: 'Cathor',
        symbol: 'CTHOR',
        isFeeOnTransfer: false,
        isCommon: false,
        derivedUSD: null,
        generatedAt: new Date(),
        updatedAt: new Date(),
        decimals: 2,
        isLiquidityToken: false,
        miniChartSVG: '',
        about:
          'Cathor is the original Hathor Network community coin. Minted in February 2021 by the CEO of Hathor for the community, Cathor’s mission is to support and grow awareness for the Hathor Network and projects building on Hathor.  CTHOR has a fixed supply of 30,000, the majority of which have been gifted to the community.',
      },
      {
        id: '4',
        uuid: '00000000f76262bb1cca969d952ac2f0e85f88ec346a13eb3c31e29d4ed',
        chainId: 1,
        name: 'Nileswap Token',
        symbol: 'NST',
        isFeeOnTransfer: false,
        isCommon: false,
        derivedUSD: null,
        generatedAt: new Date(),
        updatedAt: new Date(),
        decimals: 2,
        isLiquidityToken: false,
        miniChartSVG: '',
        about:
          "NileSwap Token  is the designated rewards token for the NileSwap platform. \
        Holders of a predetermined quantity of NST are eligible to receive monthly rewards based on the platform's trading fees.\
        NST holders may be entitled to additional benefits in the future.",
      },
      {
        id: '5',
        uuid: '00000000f76262bb1cca969d952ac5f88ec34c31f26a13eb3c31e29d4ed',
        chainId: 1,
        name: 'Kelbcoin',
        symbol: 'KELB',
        isFeeOnTransfer: false,
        isCommon: false,
        derivedUSD: null,
        generatedAt: new Date(),
        updatedAt: new Date(),
        decimals: 2,
        isLiquidityToken: false,
        miniChartSVG: '',
        about:
          'Kelbcoin ($KELB) is a meme coin with utility on the Hathor network. Inspired by the Kelb tal-Fenek dog, it has a total supply of 30,420. Kelbcoin offers two key products: Kelbtools and Kelbswap. \
        Kelbtools provides a range of tools for the Layer 1 Hathor ecosystem, including an NFT screener, an in-depth tokenomics page, and a list of Hathor projects. These tools offer valuable insights and data for users. \
        Kelbswap is the first community-built swap on Hathor, currently supporting seven token pairs with liquidity over 100,000 HTR. In over a year of operations, it has processed thousands of transactions with a strong focus on ease of use and security.\
        Kelbcoin holders of 100 tokens or more can join an exclusive private Telegram group. This group offers governance, exclusive benefits, and access to a trading alert bot. Additionally, all holders receive fees generated from Kelbswap.\
        Kelbcoin provides practical services to Hathorians, bridging finance and fun.',
      },
    ],
  })
  console.log('Created Tokens')
  const pools = await prisma.pool.createMany({
    data: [
      {
        name: 'CTHOR-HTR',
        apr: 0.1,
        chainId: 1,
        version: '0.1',
        token0Id: '0',
        token1Id: '3',
        swapFee: 0.05,
        feeUSD: 250,
        reserve0: '1000000',
        reserve1: '78000',
        liquidityUSD: 3900,
        volumeUSD: 390,
        liquidity: 3900,
        volume1d: 3900,
        fees1d: 30,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        id: '4',
      },
      {
        name: 'NST-HTR',
        apr: 0.2,
        chainId: 1,
        version: '0.1',
        token0Id: '0',
        token1Id: '4',
        swapFee: 0.5,
        feeUSD: 300,
        reserve0: '1000000',
        reserve1: '827000',
        liquidityUSD: 5000,
        volumeUSD: 500,
        liquidity: 5000,
        volume1d: 5000,
        fees1d: 40,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        id: '3',
      },
      {
        name: 'KELB-HTR',
        apr: 0.2,
        chainId: 1,
        version: '0.1',
        token0Id: '0',
        token1Id: '5',
        swapFee: 0.5,
        feeUSD: 300,
        reserve0: '1000000',
        reserve1: '58000',
        liquidityUSD: 5000,
        volumeUSD: 500,
        liquidity: 5000,
        volume1d: 5000,
        fees1d: 40,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        id: '2',
      },
      {
        name: 'USDT-HTR',
        apr: 0.15,
        chainId: 1,
        version: '0.1',
        token0Id: '0',
        token1Id: '2',
        swapFee: 0.5,
        feeUSD: 0,
        reserve0: '1000000',
        reserve1: '70000',
        liquidityUSD: 0,
        volumeUSD: 0,
        liquidity: 0,
        volume1d: 0,
        fees1d: 0,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        // id: 'd14e4ef9-01ca-4cc6-8b27-06a0145ab067',
        id: '1',
      },
      {
        name: 'DZR-HTR',
        apr: 0.15,
        chainId: 1,
        version: '0.1',
        token0Id: '0',
        token1Id: '1',
        swapFee: 0.5,
        feeUSD: 0,
        reserve0: '2000000',
        reserve1: '1400000',
        liquidityUSD: 0,
        volumeUSD: 0,
        liquidity: 0,
        volume1d: 0,
        fees1d: 0,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        // id: '16c056e5-322d-4b80-bdad-58f399fbdc9e',
        id: '0',
      },
    ],
  })
  console.log('Created Pools')

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
    await prisma.token.update({
      where: { id: '5' },
      data: {
        uuid: nano_info.KELB_uuid,
      },
    })
    await prisma.token.update({
      where: { id: '4' },
      data: {
        uuid: nano_info.NST_uuid,
      },
    })
    await prisma.token.update({
      where: { id: '3' },
      data: {
        uuid: nano_info.CTHOR_uuid,
      },
    })
    await prisma.token.update({
      where: { id: '2' },
      data: {
        uuid: nano_info.USDT_uuid,
      },
    })
    console.log('Updated USDT UUID.')
    await prisma.token.update({
      where: { id: '1' },
      data: {
        uuid: nano_info.DZR_uuid,
      },
    })
    console.log('Updated DZR UUID.')
    await prisma.pool.update({
      where: { id: '0' },
      data: {
        id: nano_info.HTR_DZR_ncid,
      },
    })
    console.log('Updated HTR-DZR nano contract ID.')
    await prisma.pool.update({
      where: { id: '1' },
      data: {
        id: nano_info.HTR_USDT_ncid,
      },
    })
    console.log('Updated HTR-USDT nano contract ID.')
    await prisma.pool.update({
      where: { id: '2' },
      data: {
        id: nano_info.HTR_KELB_ncid,
      },
    })
    console.log('Updated HTR-KELB nano contract ID.')
    await prisma.pool.update({
      where: { id: '3' },
      data: {
        id: nano_info.HTR_NST_ncid,
      },
    })
    console.log('Updated HTR-NST nano contract ID.')
    await prisma.pool.update({
      where: { id: '4' },
      data: {
        id: nano_info.HTR_CTHOR_ncid,
      },
    })
    console.log('Updated HTR-CTHOR nano contract ID.')
  }
}

// const bootstrap: NanoInfoType = {
//   USDT_uuid: '00000196e885717d5d2499f41be612df13575f32e8ede8aad9711d9fd4b0a6cc',
//   HTR_USDT_ncid: '0000002b8c2ca725ac789c37d71a88f0b9ab9ebe331afeaeeb3092b0810d3aa7',
// }

export async function seed_db(nano_info?: NanoInfoType, snaps_period = 0) {
  main(nano_info, snaps_period)
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
