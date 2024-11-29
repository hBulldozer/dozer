// import { ChainId } from '@dozer/chain'
// import { Pair, PairType, QuerypairsArgs } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import {
  GenericTable,
  IconButton,
  Table,
  classNames,
  DEFAULT_INPUT_UNSTYLED,
  FilterPools,
  Filters,
  LoadingOverlay,
  Typography,
} from '@dozer/ui'
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

export interface ExtendedPair extends Pair {
  priceHtr?: number
  price?: number
  marketCap?: number
  change?: number
  isPending?: boolean
}

export const PoolsTable: FC = () => {
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

  // Use enabled option to control when queries run
  const initialQuery = api.getPools.firstLoadAllDay.useQuery(undefined, {
    staleTime: 30000, // Reduce refetches
    cacheTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  const detailedQuery = api.getPools.allDay.useQuery(undefined, {
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
    // Only run this query after initial data is loaded
    enabled: !!initialQuery.data,
  })

  const pricesQuery = api.getPrices.all.useQuery(undefined, {
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  })

  const prices = useMemo(() => {
    if (pricesQuery.data) return pricesQuery.data
    return {}
  }, [pricesQuery.data])

  // Combine the data based on what's available
  const _pools = useMemo(() => {
    if (detailedQuery.data) return detailedQuery.data
    return initialQuery.data || []
  }, [initialQuery.data, detailedQuery.data])

  const pools = useMemo(() => {
    const maxAPR = Math.max(...(_pools?.map((pool) => pool.apr) || [])) * 100
    const maxTVL = Math.max(...(_pools?.map((pool) => pool.liquidityUSD) || []))
    const maxFees = Math.max(...(_pools?.map((pool) => pool.fees1d) || []))
    const maxVolume = Math.max(...(_pools?.map((pool) => pool.volume1d) || []))
    return _pools
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
    const maxTVL = Math.max(...(_pools?.map((pool) => pool.liquidityUSD) || []))
    const maxVolume = Math.max(...(_pools?.map((pool) => pool.volume1d) || []))
    const maxFees = Math.max(...(_pools?.map((pool) => pool.fees1d) || []))
    const maxAPR = Math.max(...(_pools?.map((pool) => pool.apr) || []))
    return {
      tvl: maxTVL,
      volume: maxVolume,
      fees: maxFees,
      apr: maxAPR,
    }
  }, [_pools])

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
      <LoadingOverlay show={isSomePending ? false : initialQuery.isLoading} />
      {detailedQuery.isLoading && (
        <Typography variant="xs" className="text-center text-stone-500">
          Loading detailed pools...
        </Typography>
      )}
      <FilterPools maxValues={maxValues} search={query} setSearch={setQuery} setFilters={setFilters} />
      <GenericTable<ExtendedPair>
        table={table}
        // loading={isSomePending ? false : isLoading}
        loading={false}
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
