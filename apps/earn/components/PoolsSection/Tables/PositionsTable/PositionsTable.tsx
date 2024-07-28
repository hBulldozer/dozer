import { useBreakpoint } from '@dozer/hooks'
import { GenericTable } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import stringify from 'fast-json-stable-stringify'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { APR_COLUMN, NAME_COLUMN, NETWORK_COLUMN, VALUE_COLUMN } from './Cells/columns'
import { PositionQuickHoverTooltip } from './PositionQuickHoverTooltip'
import { useAccount, useNetwork } from '@dozer/zustand'
import { PAGE_SIZE } from '../contants'
import { ChainId } from '@dozer/chain'
import { Pair } from '@dozer/api'
import { api } from '../../../../utils/api'
import { usePoolPosition } from '../../../PoolPositionProvider'
import { useWalletConnectClient } from '@dozer/higmi'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const COLUMNS = [NETWORK_COLUMN, NAME_COLUMN, VALUE_COLUMN, APR_COLUMN]
// VOLUME_COLUMN

export const PositionsTable: FC = () => {
  // const { address } = useAccount()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { isSm } = useBreakpoint('sm')
  const { isMd } = useBreakpoint('md')

  const [sorting, setSorting] = useState<SortingState>([{ id: 'value', desc: true }])
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
  const _pairs_array: Pair[] = []
  if (pools)
    pools.map((pool) => {
      const { data: userInfo } = api.getProfile.poolInfo.useQuery({
        contractId: pool.id,
        address,
      })
      if (userInfo && userInfo.liquidity > 0) _pairs_array.push(pool)
    })

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
    <GenericTable<Pair>
      table={table}
      HoverElement={isMd ? PositionQuickHoverTooltip : undefined}
      loading={isLoading}
      placeholder="No positions found"
      pageSize={Math.max(pairs_array?.length || 0, 5)}
      linkFormatter={rowLink}
    />
  )
}
