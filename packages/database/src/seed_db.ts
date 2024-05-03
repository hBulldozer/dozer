import { PrismaClient } from '@prisma/client'

interface NanoInfoType {
  DZR_uuid: string
  USDT_uuid: string
  HTR_USDT_ncid: string
  HTR_DZR_ncid: string
}
const prisma = new PrismaClient()
export async function main(nano_info: NanoInfoType | undefined) {
  console.log('*** Starting to seed DB... ***')
  const delete1 = await prisma.pool.deleteMany()
  console.log('Deleted Pool Table')
  const delete2 = await prisma.token.deleteMany()
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
        uuid: '00b1b246cb512515c5258cb0301afcf83e74eb595dbe655d14e11782db4b70c5',
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
        chainId: 2,
        version: '0.1',
        token0Id: '0',
        token1Id: '2',
        swapFee: 0.1,
        feeUSD: 200,
        reserve0: '100000',
        reserve1: '40000',
        liquidityUSD: 10000,
        volumeUSD: 1000,
        liquidity: 10000,
        volume1d: 100000,
        fees1d: 50,
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
        swapFee: 0.1,
        feeUSD: 450,
        reserve0: '1000',
        reserve1: '2000',
        liquidityUSD: 10000,
        volumeUSD: 1000,
        liquidity: 10000,
        volume1d: 10000,
        fees1d: 50,
        generatedAt: new Date(),
        updatedAt: new Date(),
        tokenLPId: '0',
        // id: '16c056e5-322d-4b80-bdad-58f399fbdc9e',
        id: '0',
      },
    ],
  })
  console.log('Created Pools')

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

export async function seed_db(nano_info?: NanoInfoType) {
  main(nano_info)
    .then(async () => {
      await prisma.$disconnect()
    })
    .catch(async (e) => {
      console.error(e)
      await prisma.$disconnect()
      process.exit(1)
    })
}