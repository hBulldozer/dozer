import { AllTokensDBOutput, FrontEndApiNCOutput, Pair, dbPoolWithTokens, pairFromPoolMerged } from '@dozer/api'
import { useBreakpoint } from '@dozer/hooks'
import { GenericTable } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { PAGE_SIZE } from '../contants'
import { CHANGE_COLUMN, PRICE_COLUMN, CHART_COLUMN, NAME_COLUMN, TVL_COLUMN, VOLUME_COLUMN } from './Cells/columns'
import { ChainId } from '@dozer/chain'
import { useNetwork } from '@dozer/zustand'
import { api } from '../../../../utils/api'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const COLUMNS = [NAME_COLUMN, PRICE_COLUMN, CHANGE_COLUMN, TVL_COLUMN, VOLUME_COLUMN, CHART_COLUMN]

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

  const { data: _all_pools } = api.getPools.all.useQuery()
  const all_pools = _all_pools ? _all_pools : []

  const { data: tokens, isLoading } = api.getTokens.all.useQuery()
  const tokens_array = tokens
    ? tokens.filter((token: AllTokensDBOutput) => {
        return token.chainId == rendNetwork
      })
    : []

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
        .filter((pool) => pool.chainId == rendNetwork)
        .filter((pool) => pool.token0.uuid == '00' || pool.token1.uuid == '00')
        .map((pool) => {
          const poolDB = pool ? pool : ({} as dbPoolWithTokens)
          const { data: _poolNC } = api.getPools.byIdFromContract.useQuery({ ncid: poolDB.ncid })
          const poolNC = _poolNC ? _poolNC : ({} as FrontEndApiNCOutput)
          if (!(poolDB && poolNC)) return {} as Pair
          return pairFromPoolMerged(poolDB, poolNC)
        })
      const fakeHTRPair: Pair = {
        id: network == ChainId.HATHOR ? 'native' : 'native-testnet',
        name: network == ChainId.HATHOR ? 'HTR' : 'HTR testnet',
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
