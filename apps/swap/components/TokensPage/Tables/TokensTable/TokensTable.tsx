// import { ChainId } from '@dozer/chain'
// import { Pair, PairType, QuerypairsArgs } from '@dozer/graph-client'
import {
  AllTokensDBOutput,
  FrontEndApiNCOutput,
  Pair,
  dbPoolWithTokens,
  dbToken,
  dbTokenWithPools,
  pairFromPool,
  pairFromPoolMerged,
  toToken,
} from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { GenericTable, Table } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
// import stringify from 'fast-json-stable-stringify'

// import { usePoolFilters } from '../../../PoolsFiltersProvider'
import { PAGE_SIZE } from '../contants'
import { CHANGE_COLUMN, PRICE_COLUMN, CHART_COLUMN, NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN } from './Cells/columns'
import { Token, getTokens } from '@dozer/currency'
import { ChainId, Network } from '@dozer/chain'
import { useNetwork } from '@dozer/zustand'
import { RouterOutputs, api } from '../../../../utils/api'
import { dbPool } from 'interfaces'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// const COLUMNS = [NETWORK_COLUMN, NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN, FEES_COLUMN, APR_COLUMN]
const COLUMNS = [NAME_COLUMN, PRICE_COLUMN, CHANGE_COLUMN, TVL_COLUMN, VOLUME_COLUMN, CHART_COLUMN]

// const fetcher = ({
//   url,
//   args,
// }: {
//   url: string
//   args: {
//     sorting: SortingState
//     pagination: PaginationState
//     query: string
//     extraQuery: string
//     selectedNetworks: ChainId[]
//     selectedPoolTypes: string[]
//     farmsOnly: boolean
//   }
// }) => {
//   const _url = new URL(url, window.location.origin)

//   if (args.sorting[0]) {
//     _url.searchParams.set('orderBy', args.sorting[0].id)
//     _url.searchParams.set('orderDirection', args.sorting[0].desc ? 'desc' : 'asc')
//   }

//   if (args.pagination) {
//     _url.searchParams.set('pagination', stringify(args.pagination))
//   }

//   if (args.selectedNetworks) {
//     _url.searchParams.set('networks', stringify(args.selectedNetworks))
//   }

//   const where: QuerypairsArgs['where'] = {}
//   if (args.query) where['name_contains_nocase'] = args.query
//   if (args.selectedPoolTypes) where['type_in'] = args.selectedPoolTypes as PairType[]

//   if (Object.keys(where).length > 0) {
//     _url.searchParams.set('where', stringify(where))
//   }

//   if (args.farmsOnly) {
//     _url.searchParams.set('farmsOnly', 'true')
//   }

//   return fetch(_url.href)
//     .then((res) => res.json())
// }

// const pools = [
//   {
//     id: '1',
//     name: 'Dummy Pool 1',
//     liquidityUSD: 200000,
//     volumeUSD: 10000,
//     feeUSD: 300,
//     apr: 0.25,
//     token0: getTokens(ChainId.HATHOR)[0],
//     token1: getTokens(ChainId.HATHOR)[1],
//     reserve0: 1,
//     reserve1: 2,
//     chainId: 2,
//     liquidity: 10000,
//     volume1d: 45553,
//     fees1d: 10000,
//   },
//   {
//     id: '2',
//     name: 'Dummy Pool 2',
//     liquidityUSD: 100000,
//     volumeUSD: 5000,
//     feeUSD: 150,
//     apr: 0.15,
//     token0: getTokens(ChainId.HATHOR)[0],
//     token1: getTokens(ChainId.HATHOR)[2],
//     reserve0: 1,
//     reserve1: 2,
//     chainId: 2,
//     liquidity: 10000,
//     volume1d: 45266,
//     fees1d: 15469,
//   },
//   {
//     id: '3',
//     name: 'Dummy Pool 3',
//     liquidityUSD: 50000,
//     volumeUSD: 2500,
//     feeUSD: 75,
//     apr: 0.1,
//     token0: getTokens(ChainId.HATHOR)[0],
//     token1: getTokens(ChainId.HATHOR)[3],
//     reserve0: 1,
//     reserve1: 2,
//     chainId: 2,
//     liquidity: 10000,
//     volume1d: 4523,
//     fees1d: 7651,
//   },
// ]

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

  useEffect(() => {
    setRendNetwork(network)
  }, [network])

  const { data: all_pools } = api.getPools.all.useQuery()
  if (!all_pools) return <></>

  const { data: tokens, isLoading } = api.getTokens.all.useQuery()
  const tokens_array = tokens?.filter((token: AllTokensDBOutput) => {
    return token.chainId == rendNetwork
  })

  if (!tokens_array) return <></>

  const _pairs_array: Pair[] = tokens_array.map((token: AllTokensDBOutput) => {
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
    if (token.uuid !== '00') {
      const pool_with_htr = pools_idx[0]

      if (!pool_with_htr) return {} as Pair
      const _poolDB = all_pools.find((pool) => pool.id == pool_with_htr)
      if (!_poolDB) return {} as Pair
      const poolDB = _poolDB ? _poolDB : ({} as dbPoolWithTokens)

      const { data: _poolNC } = api.getPools.byIdFromContract.useQuery({ ncid: poolDB.ncid })
      const poolNC = _poolNC ? _poolNC : ({} as FrontEndApiNCOutput)
      if (!(poolDB && poolNC)) return {} as Pair
      return pairFromPoolMerged(poolDB, poolNC)
    } else {
      const pairs_htr: Pair[] = all_pools
        .filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')
        .map((pool) => {
          const poolDB = pool ? pool : ({} as dbPoolWithTokens)
          const { data: _poolNC } = api.getPools.byIdFromContract.useQuery({ ncid: poolDB.ncid })
          const poolNC = _poolNC ? _poolNC : ({} as FrontEndApiNCOutput)
          if (!(poolDB && poolNC)) return {} as Pair
          return pairFromPoolMerged(poolDB, poolNC)
        })
      const fakeHTRPair: Pair = {
        id: 'native',
        name: 'HTR',
        liquidityUSD: pairs_htr ? pairs_htr.map((pair) => pair.liquidityUSD).reduce((a, b) => a + b) : 0,
        volumeUSD: pairs_htr ? pairs_htr.map((pair) => pair.volumeUSD).reduce((a, b) => a + b) : 0,
        feeUSD: 0,
        swapFee: 0,
        apr: 0,
        token0: pairs_htr[0].token0.uuid == '00' ? pairs_htr[0].token0 : pairs_htr[0].token1,
        token1: pairs_htr[0].token0.uuid == '00' ? pairs_htr[0].token0 : pairs_htr[0].token1,
        tokenLP: pairs_htr[0].token0.uuid == '00' ? pairs_htr[0].token0 : pairs_htr[0].token1,
        chainId: token.chainId,
        reserve0: 0,
        reserve1: 0,
        liquidity: 0,
        volume1d: 0,
        fees1d: 0,
        hourSnapshots: [],
        daySnapshots: [],
      }
      return fakeHTRPair
    }
  })

  const pairs_array = _pairs_array.filter((pair) => (pair.name ? pair : null))

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

  const table = useReactTable<Pair>({
    data: pairs_array || [],
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
    manualSorting: true,
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
        volume: false,
        network: false,
        rewards: false,
        liquidityUSD: false,
        fees: false,
      })
    }
  }, [isMd, isSm])

  const rowLink = useCallback((row: Pair) => {
    return `/tokens/${row.id}`
  }, [])

  return (
    <>
      <GenericTable<Pair>
        table={table}
        loading={isLoading}
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
