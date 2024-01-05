import { ChainId } from '@dozer/chain'
import { Pool, daySnapshot, hourSnapshot } from '@dozer/database'
import { Token } from '@dozer/currency'
import { type Pair, dbPoolWithTokens, dbTokenWithPools, dbToken } from './types'
import { FrontEndApiNCOutput } from '..'

export function toToken(dbToken: dbToken | dbTokenWithPools): Token {
  return new Token({
    chainId: dbToken.chainId,
    uuid: dbToken.uuid,
    decimals: dbToken.decimals,
    name: dbToken.name,
    symbol: dbToken.symbol,
  })
}

export function pairFromPoolAndTokens(
  pool: (dbPoolWithTokens & { hourSnapshots: hourSnapshot[]; daySnapshots: daySnapshot[] }) | null
): Pair {
  return (
    pool &&
    JSON.parse(
      JSON.stringify({
        id: pool.id,
        name: pool.name,
        liquidityUSD: pool.liquidityUSD,
        volumeUSD: pool.volumeUSD,
        feeUSD: pool.feeUSD,
        swapFee: pool.swapFee,
        apr: pool.apr,
        token0: toToken(pool.token0),
        token1: toToken(pool.token1),
        tokenLP: toToken(pool.tokenLP),
        reserve0: Number(pool.reserve0),
        reserve1: Number(pool.reserve1),
        chainId: pool.chainId,
        liquidity: pool.liquidity,
        volume1d: pool.volume1d,
        fees1d: pool.fees1d,
        hourSnapshots: pool.hourSnapshots,
        daySnapshots: pool.daySnapshots,
      })
    )
  )
}

export function pairFromPoolAndTokensList(pool: dbPoolWithTokens | null): Pair {
  return (
    pool &&
    JSON.parse(
      JSON.stringify({
        id: pool.id,
        name: pool.name,
        liquidityUSD: pool.liquidityUSD,
        volumeUSD: pool.volumeUSD,
        feeUSD: pool.feeUSD,
        apr: pool.apr,
        token0: toToken(pool.token0),
        token1: toToken(pool.token1),
        tokenLP: toToken(pool.tokenLP),
        reserve0: Number(pool.reserve0),
        reserve1: Number(pool.reserve1),
        chainId: pool.chainId,
        liquidity: pool.liquidity,
        volume1d: pool.volume1d,
        fees1d: pool.fees1d,
      })
    )
  )
}

export function pairFromPool(pool: dbPoolWithTokens | null): Pair {
  return (
    pool &&
    JSON.parse(
      JSON.stringify({
        id: pool.id,
        name: pool.name,
        liquidityUSD: pool.liquidityUSD,
        volumeUSD: pool.volumeUSD,
        feeUSD: pool.feeUSD,
        swapFee: pool.swapFee,
        apr: pool.apr,
        token0: toToken(pool.token0),
        token1: toToken(pool.token1),
        tokenLP: toToken(pool.tokenLP),
        reserve0: Number(pool.reserve0),
        reserve1: Number(pool.reserve1),
        chainId: pool.chainId,
        liquidity: pool.liquidity,
        volume1d: pool.volume1d,
        fees1d: pool.fees1d,
      })
    )
  )
}

export function pairFromPoolMerged(
  poolDB: (dbPoolWithTokens & { hourSnapshots: hourSnapshot[]; daySnapshots: daySnapshot[] }) | null,
  poolNC: FrontEndApiNCOutput
): Pair {
  return (
    poolDB &&
    poolNC &&
    JSON.parse(
      JSON.stringify({
        id: poolDB.id,
        name: poolDB.name,
        liquidityUSD: poolDB.liquidityUSD,
        volumeUSD: poolNC.volume,
        feeUSD: poolDB.feeUSD,
        swapFee: poolDB.swapFee,
        apr: poolDB.apr,
        token0: toToken(poolDB.token0),
        token1: toToken(poolDB.token1),
        tokenLP: toToken(poolDB.tokenLP),
        reserve0: Number(poolNC.reserve0),
        reserve1: Number(poolNC.reserve1),
        chainId: poolDB.chainId,
        liquidity: poolDB.liquidity,
        volume1d: poolDB.volume1d,
        fees1d: poolDB.fees1d,
        hourSnapshots: poolDB.hourSnapshots,
        daySnapshots: poolDB.daySnapshots,
      })
    )
  )
}

export function pairWithSnapsFromPool(
  pool: (dbPoolWithTokens & { hourSnapshots: hourSnapshot[]; daySnapshots: daySnapshot[] }) | null
): Pair {
  return (
    pool &&
    JSON.parse(
      JSON.stringify({
        id: pool.id,
        name: pool.name,
        liquidityUSD: pool.liquidityUSD,
        volumeUSD: pool.volumeUSD,
        feeUSD: pool.feeUSD,
        swapFee: pool.swapFee,
        apr: pool.apr,
        token0: toToken(pool.token0),
        token1: toToken(pool.token1),
        tokenLP: toToken(pool.tokenLP),
        reserve0: Number(pool.reserve0),
        reserve1: Number(pool.reserve1),
        chainId: pool.chainId,
        liquidity: pool.liquidity,
        volume1d: pool.volume1d,
        fees1d: pool.fees1d,
        hourSnapshots: pool.hourSnapshots,
        daySnapshots: pool.daySnapshots,
      })
    )
  )
}
