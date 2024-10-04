import { AllTokensDBOutput, Pair, dbPoolWithTokens } from '@dozer/api'
// EDIT
import { useBreakpoint } from '@dozer/hooks'
import { FilterTokens, FiltersTokens, GenericTable } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { PAGE_SIZE } from '../contants'
import {
  CHANGE_COLUMN,
  PRICE_COLUMN,
  CHART_COLUMN,
  NAME_COLUMN,
  TVL_COLUMN,
  VOLUME_COLUMN,
  MARKETCAP_COLUMN,
} from './Cells/columns'
import { ChainId } from '@dozer/chain'
import { useNetwork } from '@dozer/zustand'
import { api } from '../../../../utils/api'
import { set } from 'date-fns'
import { getTokens } from '@dozer/currency'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const COLUMNS = [NAME_COLUMN, PRICE_COLUMN, CHANGE_COLUMN, MARKETCAP_COLUMN, TVL_COLUMN, VOLUME_COLUMN, CHART_COLUMN]

export interface ExtendedPair extends Pair {
  priceHtr?: number
  price?: number
  marketCap?: number
  change?: number
}

export const TokensTable: FC = () => {
  // const { query, extraQuery, selectedNetworks, selectedPoolTypes, farmsOnly, atLeastOneFilterSelected } =
  // usePoolFilters()
  const { isSm } = useBreakpoint('sm')
  const { isMd } = useBreakpoint('md')

  const [sorting, setSorting] = useState<SortingState>([{ id: 'liquidityUSD', desc: true }])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const [rendNetwork, setRendNetwork] = useState<number>(ChainId.HATHOR)
  const { network } = useNetwork()
  const [tokens_array, setTokens_array] = useState<AllTokensDBOutput[]>([])

  const { data: all_pools, isLoading: isLoadingPools } = api.getPools.allDay.useQuery()
  const { data: tokens, isLoading } = api.getTokens.all.useQuery()
  const { data: prices24h, isLoading: isLoadingPrices24h } = api.getPrices.all24h.useQuery()
  const { data: lastPrices, isLoading: isLoadingLastPrice } = api.getPrices.all.useQuery()

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<FiltersTokens>({
    tvl: { min: undefined, max: undefined },
    volume: { min: undefined, max: undefined },
    price: { min: undefined, max: undefined },
    marketcap: { min: undefined, max: undefined },
  })

  useEffect(() => {
    // without useeffect it was giving hydration error,
    // because the two fetchs above can be lazy and cause a difference between server render and client render
    setTokens_array(
      tokens
        ? tokens.filter((token: AllTokensDBOutput) => {
            return token.chainId == rendNetwork
          })
        : []
    )
  }, [tokens])

  useEffect(() => {
    setRendNetwork(network)
  }, [network])

  const _pairs_array: Pair[] = tokens_array
    .filter((token) => !token.custom)
    .map((token: AllTokensDBOutput) => {
      const pools0 = token.pools0
      const pools1 = token.pools1
      const htr_pools0 = pools0.find((pool) => {
        return pool.token1.uuid == '00'
      })
      const htr_pools1 = pools1.find((pool) => {
        return pool.token0.uuid == '00'
      })
      const pools_idx = []
      htr_pools0 ? pools_idx.push(htr_pools0.id) : null
      htr_pools1 ? pools_idx.push(htr_pools1.id) : null
      if (token.uuid == '00') {
        const pairs_htr: Pair[] = all_pools
          ? all_pools
              .filter((pool) => pool.chainId == rendNetwork)
              .filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')
              .map((pool) => {
                const pair = pool ? pool : ({} as Pair)
                return pair
              })
          : []
        const fakeHTRPair: Pair =
          pairs_htr.length == 0
            ? ({} as Pair)
            : {
                id: network == ChainId.HATHOR ? 'native' : 'native-testnet',
                name: network == ChainId.HATHOR ? 'HTR' : 'HTR testnet',
                liquidityUSD: pairs_htr ? pairs_htr.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) / 2 : 0,
                volumeUSD: pairs_htr ? pairs_htr.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
                feeUSD: pairs_htr ? pairs_htr.map((pair) => pair.feeUSD).reduce((a, b) => a + b) : 0,
                swapFee: pairs_htr[0].swapFee,
                apr: 0,
                token0: pairs_htr[0].token0.uuid == '00' ? pairs_htr[0].token0 : pairs_htr[0].token1,
                token1: pairs_htr[0].token0.uuid == '00' ? pairs_htr[0].token0 : pairs_htr[0].token1,
                chainId: token.chainId,
                reserve0: 0,
                reserve1: 0,
                liquidity: pairs_htr ? pairs_htr.map((pair) => pair.liquidity).reduce((a, b) => a + b) / 2 : 0,
                volume1d: pairs_htr ? pairs_htr.map((pair) => pair.volume1d).reduce((a, b) => a + b) : 0,
                fees1d: pairs_htr ? pairs_htr.map((pair) => pair.fees1d).reduce((a, b) => a + b) : 0,
                hourSnapshots: [],
                daySnapshots: [],
              }
        return fakeHTRPair
      } else if (token.symbol == 'USDT') {
        const pairs_usdt: Pair[] = all_pools
          ? all_pools
              .filter((pool) => pool.chainId == rendNetwork)
              .filter((pool) => pool.token0.symbol == 'USDT' || pool.token1.symbol == 'USDT')
              .map((pool) => {
                const pair = pool ? pool : ({} as Pair)
                return pair
              })
          : []
        const fakeUSDTPair: Pair =
          pairs_usdt.length == 0
            ? ({} as Pair)
            : {
                id: network == ChainId.HATHOR ? 'usdt' : 'usdt-testnet',
                name: network == ChainId.HATHOR ? 'USDT' : 'USDT testnet',
                liquidityUSD: pairs_usdt ? pairs_usdt.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) / 2 : 0,
                volumeUSD: pairs_usdt ? pairs_usdt.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
                feeUSD: pairs_usdt ? pairs_usdt.map((pair) => pair.feeUSD).reduce((a, b) => a + b) : 0,
                swapFee: pairs_usdt[0].swapFee,
                apr: 0,
                token0: pairs_usdt[0].token0.symbol == 'USDT' ? pairs_usdt[0].token0 : pairs_usdt[0].token1,
                token1: pairs_usdt[0].token0.symbol == 'USDT' ? pairs_usdt[0].token0 : pairs_usdt[0].token1,
                chainId: token.chainId,
                reserve0: 0,
                reserve1: 0,
                liquidity: pairs_usdt ? pairs_usdt.map((pair) => pair.liquidity).reduce((a, b) => a + b) / 2 : 0,
                volume1d: pairs_usdt ? pairs_usdt.map((pair) => pair.volume1d).reduce((a, b) => a + b) : 0,
                fees1d: pairs_usdt ? pairs_usdt.map((pair) => pair.fees1d).reduce((a, b) => a + b) : 0,
                hourSnapshots: [],
                daySnapshots: [],
              }
        return fakeUSDTPair
      } else {
        const pool_with_htr = pools_idx[0]

        if (!pool_with_htr) return {} as Pair
        const _poolDB = all_pools ? all_pools.find((pool) => pool.id == pool_with_htr) : undefined
        if (!_poolDB) return {} as Pair
        const pair = _poolDB ? { ..._poolDB, liquidityUSD: _poolDB.liquidityUSD / 2 } : ({} as Pair)
        return pair
      }
    })

  const { data: prices } = api.getPrices.all.useQuery()
  const { data: totalSupplies } = api.getTokens.allTotalSupply.useQuery()

  const pairs_array = useMemo(() => {
    const allPools = _pairs_array?.filter((pair) => (pair.name ? pair : null))
    const maxPrice = Math.max(
      ...(allPools?.map((pool) =>
        prices ? (pool.id.includes('native') ? prices[pool.token0.uuid] : prices[pool.token1.uuid]) : 0
      ) || [])
    )
    const maxTVL = Math.max(...(allPools?.map((pool) => pool.liquidityUSD) || []))
    const maxVolume = Math.max(...(allPools?.map((pool) => pool.volume1d) || []))
    const maxMarketCap = Math.max(
      ...(allPools?.map((pool) =>
        totalSupplies && prices
          ? pool.id.includes('native')
            ? totalSupplies[pool.token0.uuid] * prices[pool.token0.uuid]
            : totalSupplies[pool.token1.uuid] * prices[pool.token1.uuid]
          : 0
      ) || [])
    )
    return allPools
      ?.filter((pool) => {
        const tokenName = pool.id.includes('native') ? pool.token0.name : pool.token1.name
        const tokenSymbol = pool.id.includes('native') ? pool.token0.symbol : pool.token1.symbol
        return (
          tokenName?.toLowerCase().includes(query.toLowerCase()) ||
          tokenSymbol?.toLowerCase().includes(query.toLowerCase())
        )
      })
      .filter((pool) => {
        if (filters.price.min || filters.price.max) {
          const poolPrice = prices
            ? pool.id.includes('native')
              ? prices[pool.token0.uuid]
              : prices[pool.token1.uuid]
            : 0
          return poolPrice >= (filters.price.min || 0) && poolPrice <= (filters.price.max || maxPrice)
        }
        if (filters.marketcap.min || filters.marketcap.max) {
          const poolMarketCap =
            totalSupplies && prices
              ? pool.id.includes('native')
                ? totalSupplies[pool.token0.uuid] * prices[pool.token0.uuid]
                : totalSupplies[pool.token1.uuid] * prices[pool.token1.uuid]
              : 0
          return (
            poolMarketCap >= (filters.marketcap.min || 0) && poolMarketCap <= (filters.marketcap.max || maxMarketCap)
          )
        }
        if (filters.tvl.min || filters.tvl.max) {
          return pool.liquidityUSD >= (filters.tvl.min || 0) && pool.liquidityUSD <= (filters.tvl.max || maxTVL)
        }

        if (filters.volume.min || filters.volume.max) {
          return pool.volume1d >= (filters.volume.min || 0) && pool.volume1d <= (filters.volume.max || maxVolume)
        }
        return true
      })
  }, [_pairs_array, query, filters])
  // const pairs_array = _pairs_array.filter((pair) => (pair.name ? pair : null))

  const args = useMemo(
    () => ({
      sorting,
      pagination,
      // selectedNetworks,
      // selectedPoolTypes,
      // farmsOnly,
      // query,
      // extraQuery,
    }),
    [sorting, pagination]
    // [sorting, pagination, selectedNetworks, selectedPoolTypes, farmsOnly, query, extraQuery]
  )

  const extended_pairs_array = pairs_array.map((pair) => {
    const tokenUuid = pair.id.includes('native') ? pair.token0.uuid : pair.token1.uuid
    const prices24h_token = prices24h?.[tokenUuid]
    const lastPrice = lastPrices?.[tokenUuid]
    const previousPrice = prices24h_token?.[0]
    const change =
      lastPrice && previousPrice
        ? (lastPrice - previousPrice) / lastPrice < 0.001
          ? 0
          : (lastPrice - previousPrice) / lastPrice
        : 0
    const extendedPair: ExtendedPair = { ...pair }
    extendedPair.price = prices ? (pair.id.includes('native') ? prices[pair.token0.uuid] : prices[pair.token1.uuid]) : 0
    extendedPair.marketCap =
      totalSupplies && prices
        ? pair.id.includes('native')
          ? totalSupplies[pair.token0.uuid] * prices[pair.token0.uuid]
          : totalSupplies[pair.token1.uuid] * prices[pair.token1.uuid]
        : 0
    extendedPair.change = change
    extendedPair.priceHtr = prices ? prices['00'] : 0
    return extendedPair
  })

  const table = useReactTable<ExtendedPair>({
    data: extended_pairs_array || [],
    columns: COLUMNS,
    state: {
      sorting,
      columnVisibility,
    },
    // pageCount: Math.ceil((poolCount || 0) / PAGE_SIZE),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false,
    manualPagination: true,
  })

  useEffect(() => {
    if (isSm && !isMd) {
      setColumnVisibility({
        volume: false,
        network: false,
        rewards: false,
        fees: false,
      })
    } else if (isSm) {
      setColumnVisibility({})
    } else {
      setColumnVisibility({
        network: false,
        price: false,
        rewards: false,
        liquidityUSD: false,
        fees: false,
        chart: false,
        marketcap: false,
      })
    }
  }, [isMd, isSm])

  const rowLink = useCallback((row: Pair) => {
    return `./tokens/${row.token1.chainId}/${row.token1.uuid}`
  }, [])

  const maxValues = useMemo(() => {
    const allPairs = _pairs_array?.filter((pair) => (pair.name ? pair : null))
    const maxTVL = Math.max(...(allPairs?.map((pool) => pool.liquidityUSD) || []))
    const maxVolume = Math.max(...(allPairs?.map((pool) => pool.volume1d) || []))
    const maxPrice = Math.max(
      ...(allPairs?.map((pool) =>
        prices ? (pool.id.includes('native') ? prices[pool.token0.uuid] : prices[pool.token1.uuid]) : 0
      ) || [])
    )
    const maxMarketCap = Math.max(
      ...(allPairs?.map((pool) =>
        totalSupplies && prices
          ? pool.id.includes('native')
            ? totalSupplies[pool.token0.uuid] * prices[pool.token0.uuid]
            : totalSupplies[pool.token1.uuid] * prices[pool.token1.uuid]
          : 0
      ) || [])
    )
    return {
      tvl: maxTVL,
      volume: maxVolume,
      price: maxPrice,
      marketcap: maxMarketCap,
    }
  }, [_pairs_array])

  return (
    <>
      <FilterTokens maxValues={maxValues} search={query} setSearch={setQuery} setFilters={setFilters} />
      <GenericTable<ExtendedPair>
        table={table}
        loading={isLoading || isLoadingPools || isLoadingPrices24h || isLoadingLastPrice}
        placeholder={'No tokens found'}
        pageSize={PAGE_SIZE}
        linkFormatter={rowLink}
      />
      {/* only needed when we have more than 8 or 10 pools */}
      {/* <Table.Paginator
        hasPrev={pagination.pageIndex > 0}
        // hasNext={true}
        hasNext={(pools?.length || 0) >= PAGE_SIZE}
        nextDisabled={true}
        // nextDisabled={!pools}
        // nextDisabled={!pools && isValidating}
        onPrev={table.previousPage}
        onNext={table.nextPage}
        page={pagination.pageIndex}
        onPage={table.setPageIndex}
        pages={undefined}
        // pages={!atLeastOneFilterSelected ? table.getPageCount() : undefined}
        pageSize={PAGE_SIZE}
      /> */}
    </>
  )
}
