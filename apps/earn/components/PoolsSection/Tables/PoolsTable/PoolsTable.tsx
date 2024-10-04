// import { ChainId } from '@dozer/chain'
// import { Pair, PairType, QuerypairsArgs } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { GenericTable, IconButton, Table, classNames, DEFAULT_INPUT_UNSTYLED, FilterPools, Filters } from '@dozer/ui'
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
import { Transition } from '@headlessui/react'
import { XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// const COLUMNS = [NETWORK_COLUMN, NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN, FEES_COLUMN, APR_COLUMN]
const COLUMNS = [NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN, FEES_COLUMN, APR_COLUMN]


const dummyPools: Pair[] = [
  // {
  //   id: '1',
  //   name: 'Dummy Pool 1',
  //   liquidityUSD: 200000,
  //   volumeUSD: 10000,
  //   feeUSD: 300,
  //   apr: 0.25,
  //   token0: getTokens(ChainId.HATHOR)[0],
  //   token1: getTokens(ChainId.HATHOR)[1],
  //   reserve0: 1,
  //   reserve1: 2,
  //   chainId: 2,
  //   liquidity: 10000,
  //   volume1d: 45553,
  //   fees1d: 10000,
  //   swapFee: 0.05,
  //   hourSnapshots: [],
  //   daySnapshots: [],
  // },
  // {
  //   id: '2',
  //   name: 'Dummy Pool 2',
  //   liquidityUSD: 100000,
  //   volumeUSD: 5000,
  //   feeUSD: 150,
  //   apr: 0.15,
  //   token0: getTokens(ChainId.HATHOR)[0],
  //   token1: getTokens(ChainId.HATHOR)[2],
  //   reserve0: 1,
  //   reserve1: 2,
  //   chainId: 2,
  //   liquidity: 10000,
  //   volume1d: 45266,
  //   fees1d: 15469,
  //   swapFee: 0.05,
  //   hourSnapshots: [],
  //   daySnapshots: [],
  // },
  // {
  //   id: '3',
  //   name: 'Dummy Pool 3',
  //   liquidityUSD: 50000,
  //   volumeUSD: 2500,
  //   feeUSD: 75,
  //   apr: 0.1,
  //   token0: getTokens(ChainId.HATHOR)[0],
  //   token1: getTokens(ChainId.HATHOR)[3],
  //   reserve0: 1,
  //   reserve1: 2,
  //   chainId: 2,
  //   liquidity: 10000,
  //   volume1d: 4523,
  //   fees1d: 7651,
  //   swapFee: 0.05,
  //   hourSnapshots: [],
  //   daySnapshots: [],
  // },
]

type PoolsOutput = RouterOutputs['getPools']['all']

export interface ExtendedPair extends Pair {
  priceHtr?: number
  price?: number
  marketCap?: number
  change?: number
  isPending?: boolean
}

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
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>({
    tvl: { min: undefined, max: undefined },
    volume: { min: undefined, max: undefined },
    fees: { min: undefined, max: undefined },
    apr: { min: undefined, max: undefined },
  })

  useEffect(() => {
    setRendNetwork(network)
  }, [network])

  const { data: _pools, isLoading: isLoadingPools } = api.getPools.allDay.useQuery()
  const { data: prices, isLoading: isLoadingPrices } = api.getPrices.all.useQuery()

  const isLoading = useMemo(() => {
    return isLoadingPools || isLoadingPrices
  }, [isLoadingPools, isLoadingPrices])

  const pools = useMemo(() => {
    const allPools = _pools?.concat(dummyPools)
    const maxAPR = Math.max(...(allPools?.map((pool) => pool.apr) || [])) * 100
    const maxTVL = Math.max(...(allPools?.map((pool) => pool.liquidityUSD) || []))
    const maxFees = Math.max(...(allPools?.map((pool) => pool.fees1d) || []))
    const maxVolume = Math.max(...(allPools?.map((pool) => pool.volume1d) || []))
    return allPools
      ?.filter((pool) => {
        return pool.name?.toLowerCase().includes(query.toLowerCase())
      })
      .filter((pool) => pool.liquidityUSD > 10)
      .filter((pool) => {
        if (filters.apr.min || filters.apr.max) {
          return pool.apr * 100 >= (filters.apr.min || 0) && pool.apr * 100 <= (filters.apr.max || maxAPR)
        }
        if (filters.tvl.min || filters.tvl.max) {
          return pool.liquidityUSD >= (filters.tvl.min || 0) && pool.liquidityUSD <= (filters.tvl.max || maxTVL)
        }
        if (filters.fees.min || filters.fees.max) {
          return pool.fees1d >= (filters.fees.min || 0) && pool.fees1d <= (filters.fees.max || maxFees)
        }
        if (filters.volume.min || filters.volume.max) {
          return pool.volume1d >= (filters.volume.min || 0) && pool.volume1d <= (filters.volume.max || maxVolume)
        }
        return true
      })
      .map((pool) => {
        return { ...pool, priceHtr: prices?.['00'], isPending: pool.id.startsWith('pending-') }
      })
  }, [_pools, query, filters])

  const maxValues = useMemo(() => {
    const allPools = _pools?.concat(dummyPools)
    const maxTVL = Math.max(...(allPools?.map((pool) => pool.liquidityUSD) || []))
    const maxVolume = Math.max(...(allPools?.map((pool) => pool.volume1d) || []))
    const maxFees = Math.max(...(allPools?.map((pool) => pool.fees1d) || []))
    const maxAPR = Math.max(...(allPools?.map((pool) => pool.apr) || []))
    return {
      tvl: maxTVL,
      volume: maxVolume,
      fees: maxFees,
      apr: maxAPR,
    }
  }, [_pools])
  // const _pairs_array: Pair[] = pools
  //   ? pools.map((pool) => {
  //       return pairFromPool(pool)
  //     })
  //   : []
  // const pairs_array = irs_array?.filter((pair: Pair) => {
  //   return pair.chainId == rendNetwork
  // })

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

  const table = useReactTable<ExtendedPair>({
    data: pools || [],
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

  const isSomePending = useMemo(() => {
    return table.getRowModel().rows.some((row) => row.original.id.startsWith('pending-'))
  }, [table])

  return (
    <>
      <FilterPools maxValues={maxValues} search={query} setSearch={setQuery} setFilters={setFilters} />
      <GenericTable<ExtendedPair>
        table={table}
        loading={isSomePending ? false : isLoading}
        HoverElement={isMd ? PairQuickHoverTooltip : undefined}
        placeholder={'No pools found'}
        pageSize={PAGE_SIZE}
        linkFormatter={rowLink}
        isPendingFormatter={(row) => row.isPending || false}
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
