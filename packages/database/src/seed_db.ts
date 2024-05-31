import { PrismaClient } from '@prisma/client'

interface NanoInfoType {
  DZR_uuid: string
  USDT_uuid: string
  HTR_USDT_ncid: string
  HTR_DZR_ncid: string
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
          'Tether (USDT) is a cryptocurrency with a value meant to mirror the value of the U.S. dollar. The idea was to create a stable cryptocurrency that can be used like digital dollars. Coins that serve this purpose of being a stable dollar substitute are called “stable coins.” Tether is the most popular stable coin and even acts as a dollar replacement on many popular exchanges! According to their site, Tether converts cash into digital currency, to anchor or “tether” the value of the coin to the price of national currencies like the US dollar, the Euro, and the Yen. Like other cryptos it uses blockchain. Unlike other cryptos, it is [according to the official Tether site] “100% backed by USD” (USD is held in reserve). The primary use of Tether is that it offers some stability to the otherwise volatile crypto space and offers liquidity to exchanges who can’t deal in dollars and with banks (for example to the sometimes controversial but leading exchange Bitfinex).\
        The digital coins are issued by a company called Tether Limited that is governed by the laws of the British Virgin Islands, according to the legal part of its website. It is incorporated in Hong Kong. It has emerged that Jan Ludovicus van der Velde is the CEO of cryptocurrency exchange Bitfinex, which has been accused of being involved in the price manipulation of bitcoin, as well as tether. Many people trading on exchanges, including Bitfinex, will use tether to buy other cryptocurrencies like bitcoin. Tether Limited argues that using this method to buy virtual currencies allows users to move fiat in and out of an exchange more quickly and cheaply. Also, exchanges typically have rocky relationships with banks, and using Tether is a way to circumvent that.\
        USDT is fairly simple to use. Once on exchanges like Poloniex or Bittrex, it can be used to purchase Bitcoin and other cryptocurrencies. It can be easily transferred from an exchange to any Omni Layer enabled wallet. Tether has no transaction fees, although external wallets and exchanges may charge one. In order to convert USDT to USD and vise versa through the Tether.to Platform, users must pay a small fee. Buying and selling Tether for Bitcoin can be done through a variety of exchanges like the ones mentioned previously or through the Tether.to platform, which also allows the conversion between USD to and from your bank account.',
      },
      // {
      //   id: '3',
      //   uuid: '00000000f76262bb1cca969d952ac2f0e85f88ec34c31f26a13eb3c31e29d4ed',
      //   chainId: 1,
      //   name: 'Cathor',
      //   symbol: 'CTHOR',
      //   isFeeOnTransfer: false,
      //   isCommon: false,
      //   derivedUSD: null,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   decimals: 2,
      //   isLiquidityToken: false,
      //   miniChartSVG: '',
      // },
      // {
      //   id: '4',
      //   uuid: '00',
      //   chainId: 2,
      //   name: 'Hathor',
      //   symbol: 'HTR',
      //   isFeeOnTransfer: false,
      //   isCommon: false,
      //   derivedUSD: null,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   decimals: 2,
      //   isLiquidityToken: false,
      //   miniChartSVG: '',
      // },
      // {
      //   id: '5',
      //   uuid: '00b1b246cb512515c5258cb0301afcf83e74eb595dbe655d14e11782db4b70c6',
      //   chainId: 2,
      //   name: 'Dozer testnet',
      //   symbol: 'DZR',
      //   isFeeOnTransfer: false,
      //   isCommon: false,
      //   derivedUSD: null,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   decimals: 2,
      //   isLiquidityToken: false,
      //   miniChartSVG: '',
      // },
      // {
      //   id: '6',
      //   uuid: '000000007d74aaa2d49ed93e62cdefea665a25ecf7cd1a02330fea13ba40c823',
      //   chainId: 2,
      //   name: 'NilseSwap Token testnet',
      //   symbol: 'NST',
      //   isFeeOnTransfer: false,
      //   isCommon: false,
      //   derivedUSD: null,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   decimals: 2,
      //   isLiquidityToken: false,
      //   miniChartSVG: '',
      // },
      // {
      //   id: '7',
      //   uuid: '000000002e55df1a7cf4daaf79dc3929e5a89929ae6b5173714f90b47cf13723',
      //   chainId: 2,
      //   name: 'Cathor testnet',
      //   symbol: 'CTHOR',
      //   isFeeOnTransfer: false,
      //   isCommon: false,
      //   derivedUSD: null,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   decimals: 2,
      //   isLiquidityToken: false,
      //   miniChartSVG: '',
      // },
    ],
  })
  console.log('Created Tokens')
  const pools = await prisma.pool.createMany({
    data: [
      // {
      //   name: 'CTHOR-HTR',
      //   apr: 0.1,
      //   chainId: 1,
      //   version: '0.1',
      //   token0Id: '0',
      //   token1Id: '3',
      //   swapFee: 0.05,
      //   feeUSD: 250,
      //   reserve0: '100000',
      //   reserve1: '90000',
      //   liquidityUSD: 3900,
      //   volumeUSD: 390,
      //   liquidity: 3900,
      //   volume1d: 3900,
      //   fees1d: 30,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   tokenLPId: '0',
      //   id: '34677623-d338-4623-957c-137a111dbf45',
      // },
      // {
      //   name: 'NST-HTR (testnet)',
      //   apr: 0.2,
      //   chainId: 2,
      //   version: '0.1',
      //   token0Id: '4',
      //   token1Id: '6',
      //   swapFee: 0.1,
      //   feeUSD: 150,
      //   reserve0: '100000',
      //   reserve1: '43000',
      //   liquidityUSD: 5000,
      //   volumeUSD: 500,
      //   liquidity: 5000,
      //   volume1d: 5000,
      //   fees1d: 40,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   tokenLPId: '0',
      //   id: '5be0a3a4-c1ab-45fa-b050-8e367e751faf',
      // },
      // {
      //   name: 'CTHOR-HTR (testnet)',
      //   apr: 0.1,
      //   chainId: 2,
      //   version: '0.1',
      //   token0Id: '4',
      //   token1Id: '7',
      //   swapFee: 0.05,
      //   feeUSD: 50,
      //   reserve0: '100000',
      //   reserve1: '45000',
      //   liquidityUSD: 4000,
      //   volumeUSD: 400,
      //   liquidity: 4000,
      //   volume1d: 4000,
      //   fees1d: 30,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   tokenLPId: '0',
      //   id: '73d63845-6d7c-44db-b2a3-c1c68dc9d0ad',
      // },
      // {
      //   name: 'NST-HTR',
      //   apr: 0.2,
      //   chainId: 1,
      //   version: '0.1',
      //   token0Id: '0',
      //   token1Id: '2',
      //   swapFee: 0.5,
      //   feeUSD: 300,
      //   reserve0: '100000',
      //   reserve1: '85000',
      //   liquidityUSD: 5000,
      //   volumeUSD: 500,
      //   liquidity: 5000,
      //   volume1d: 5000,
      //   fees1d: 40,
      //   generatedAt: new Date(),
      //   updatedAt: new Date(),
      //   tokenLPId: '0',
      //   id: '8510a655-d67d-4c92-ba78-807eaf31ce67',
      // },
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
        reserve0: '1000000',
        reserve1: '700000',
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
        const reserve0Change = (Math.random() - 0.15) * 1500 // Smaller, more gradual changes
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
          priceHTR: 0.1,
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
              priceHTR: prevReserve1 / prevReserve0, // Calculate price based on reserves
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
  }
}

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
// seed_db(undefined, 5)
