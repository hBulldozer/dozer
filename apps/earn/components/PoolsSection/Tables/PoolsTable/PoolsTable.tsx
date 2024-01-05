// import { ChainId } from '@dozer/chain'
// import { Pair, PairType, QuerypairsArgs } from '@dozer/graph-client'
import { Pair, pairFromPool } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { GenericTable, Table } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
// import stringify from 'fast-json-stable-stringify'

// import { usePoolFilters } from '../../../PoolsFiltersProvider'
import { PAGE_SIZE } from '../contants'
import { APR_COLUMN, FEES_COLUMN, NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN } from './Cells/columns'
import { getTokens } from '@dozer/currency'
import { ChainId, Network } from '@dozer/chain'
import { PairQuickHoverTooltip } from './PairQuickHoverTooltip'
import { useNetwork } from '@dozer/zustand'
import { RouterOutputs, api } from '../../../../utils/api'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// const COLUMNS = [NETWORK_COLUMN, NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN, FEES_COLUMN, APR_COLUMN]
const COLUMNS = [NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN, FEES_COLUMN, APR_COLUMN]

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
//     .catch((e) => console.log(stringify(e)))
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

type PoolsOutput = RouterOutputs['getPools']['all']

export const PoolsTable: FC = () => {
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

  const { data: pools, isLoading } = api.getPools.all.useQuery()
  const _pairs_array: Pair[] = pools
    ? pools.map((pool) => {
        return pairFromPool(pool)
      })
    : []
  const pairs_array = _pairs_array?.filter((pair: Pair) => {
    return pair.chainId == rendNetwork
  })

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

  // console.log({ pools })

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
    return `/${row.id}`
  }, [])

  return (
    <>
      <GenericTable<Pair>
        table={table}
        loading={isLoading}
        HoverElement={isMd ? PairQuickHoverTooltip : undefined}
        placeholder={'No pools found'}
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
