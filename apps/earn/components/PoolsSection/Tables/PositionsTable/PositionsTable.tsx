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

export interface PositionPair extends Pair {
  value0?: number
  value1?: number
}

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
  const { data: prices, isLoading: isLoadingPrices } = api.getPrices.allUSD.useQuery()
  const { data: allPoolInfo, isLoading: isLoadingPoolInfo } = api.getProfile.allPoolInfo.useQuery({ address: address })

  const _pairs_array: PositionPair[] = useMemo(() => {
    const array: PositionPair[] = []
    if (pools && prices && allPoolInfo && !isLoadingPrices && !isLoadingPoolInfo && !isLoading) {
      pools.map((pool) => {
        const userInfo = allPoolInfo?.find((info) => info.contractId == pool.id)

        if (
          userInfo &&
          userInfo.max_withdraw_a > 0 &&
          userInfo.max_withdraw_b > 0 &&
          prices &&
          prices[pool.token0.uuid] &&
          prices[pool.token1.uuid]
        ) {
          const pair: PositionPair = pool
          pair.value0 = (userInfo.max_withdraw_a / 100) * prices?.[pool.token0.uuid]
          pair.value1 = (userInfo.max_withdraw_b / 100) * prices?.[pool.token1.uuid]
          array.push(pair)
        }
      })
      return array
    } else return []
  }, [pools, prices, allPoolInfo, isLoadingPrices, isLoadingPoolInfo, isLoading])

  // if (pools)
  //   pools.map((pool) => {
  //     const { data: userInfo } = api.getProfile.poolInfo.useQuery({
  //       contractId: pool.id,
  //       address,
  //     })
  //     const { data: prices } = api.getPrices.all.useQuery()
  //     if (
  //       userInfo &&
  //       (userInfo.max_withdraw_a > 0 || userInfo.max_withdraw_b > 0) &&
  //       prices &&
  //       prices[pool.token0.uuid] &&
  //       prices[pool.token1.uuid]
  //     ) {
  //       const pair: PositionPair = pool
  //       pair.value0 = (userInfo.max_withdraw_a / 100) * prices?.[pool.token0.uuid]
  //       pair.value1 = (userInfo.max_withdraw_b / 100) * prices?.[pool.token1.uuid]
  //       _pairs_array.push(pair)
  //     }
  //   })

  const pairs_array = _pairs_array
    ?.filter((pair: Pair) => {
      return pair.chainId == rendNetwork
    })
    .filter((pool) => pool.liquidityUSD > 10)
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

  const table = useReactTable<PositionPair>({
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
    <GenericTable<PositionPair>
      table={table}
      HoverElement={isMd ? PositionQuickHoverTooltip : undefined}
      loading={isLoading}
      placeholder="No positions found"
      pageSize={Math.max(pairs_array?.length || 0, 5)}
      linkFormatter={rowLink}
    />
  )
}
