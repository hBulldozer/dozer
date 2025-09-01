import { AllTokensDBOutput, Pair } from '@dozer/api'
// EDIT
import { useBreakpoint } from '@dozer/hooks'
import { FilterTokens, FiltersTokens, GenericTable, LoadingOverlay, Typography } from '@dozer/ui'
import { getCoreRowModel, getSortedRowModel, PaginationState, SortingState, useReactTable } from '@tanstack/react-table'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Token } from '@dozer/currency'

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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const COLUMNS = [NAME_COLUMN, PRICE_COLUMN, CHANGE_COLUMN, MARKETCAP_COLUMN, TVL_COLUMN, VOLUME_COLUMN, CHART_COLUMN]

export interface ExtendedPair extends Pair {
  priceHtr?: number
  price?: number
  marketCap?: number
  change?: number // Will be calculated by TokenChangeCell component, not set here
}

// Utility to normalize a token object to the Token class structure
function normalizeToken(token: any): Token {
  return new Token({
    chainId: token.chainId || 1,
    uuid: token.uuid,
    decimals: token.decimals || 2,
    symbol: token.symbol,
    name: token.name,
    imageUrl: token.imageUrl || '',
    bridged: token.bridged || false,
    originalAddress: token.originalAddress || '',
    sourceChain: token.sourceChain || '',
    targetChain: token.targetChain || '',
    rebase: token.rebase || { base: 1, elastic: 1 },
  })
}

export const TokensTable: FC = () => {
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
  const [filters, setFilters] = useState<FiltersTokens>({
    price: { min: undefined, max: undefined },
    marketcap: { min: undefined, max: undefined },
    tvl: { min: undefined, max: undefined },
    volume: { min: undefined, max: undefined },
  })

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setRendNetwork(network)
  }, [network])

  // Get all the data we need
  const { data: allPools, isLoading: isLoadingPools } = api.getPools.all.useQuery(undefined, {
    enabled: mounted,
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  })

  const { data: currentPrices, isLoading: isLoadingPrices } = api.getPrices.allUSD.useQuery(undefined, {
    enabled: mounted,
    staleTime: 30000,
    cacheTime: 1000 * 60 * 5,
  })

  const { data: tokens, isLoading: isLoadingTokens } = api.getTokens.all.useQuery(undefined, {
    enabled: mounted,
  })

  // Simplified approach: Just show the pools as tokens
  const _pairs_array: ExtendedPair[] = useMemo(() => {
    if (!mounted || !allPools || !currentPrices) {
      return []
    }

    // Convert pools to token-like entries (show each pool as representing its tokens)
    const tokenEntries: ExtendedPair[] = []

    // Add HTR token entry first (special case)
    const htrPool = allPools.find(
      (pool) =>
        (pool.token0.uuid === '00' && pool.token1.symbol === 'hUSDC') ||
        (pool.token1.uuid === '00' && pool.token0.symbol === 'hUSDC')
    )

    if (htrPool) {
      tokenEntries.push({
        ...htrPool,
        id: `token-00`,
        name: 'HTR',
        token0: normalizeToken({
          uuid: '00',
          symbol: 'HTR',
          name: 'Hathor',
          chainId: 1,
          decimals: 2,
          imageUrl: '',
          bridged: false,
          originalAddress: '',
          sourceChain: '',
          targetChain: '',
          rebase: { base: 1, elastic: 1 },
        }),
        token1: normalizeToken(htrPool.token0.uuid === '00' ? htrPool.token1 : htrPool.token0),
        liquidityUSD: htrPool.liquidityUSD / 2,
        price: currentPrices['00'] || 0,
        marketCap: 0,
        change: undefined,
        priceHtr: currentPrices['00'] || 0,
      } as ExtendedPair)
    }

    allPools.forEach((pool) => {
      // Add entry for token0 if not HTR
      if (pool.token0.uuid !== '00') {
        tokenEntries.push({
          ...pool,
          id: `token-${pool.token0.uuid}`,
          name: pool.token0.symbol,
          token0: normalizeToken(pool.token0),
          token1: normalizeToken(pool.token1),
          liquidityUSD: pool.liquidityUSD / 2, // Split liquidity between token pair
          price: currentPrices[pool.token0.uuid] || 0,
          marketCap: 0, // TODO: Calculate when we have total supply data
          change: undefined, // Will be calculated by TokenChangeCell component
          priceHtr: currentPrices['00'] || 0,
        } as ExtendedPair)
      }

      // Add entry for token1 if not HTR and different from token0
      if (pool.token1.uuid !== '00' && pool.token1.uuid !== pool.token0.uuid) {
        tokenEntries.push({
          ...pool,
          id: `token-${pool.token1.uuid}`,
          name: pool.token1.symbol,
          token0: normalizeToken(pool.token0),
          token1: normalizeToken(pool.token1),
          liquidityUSD: pool.liquidityUSD / 2, // Split liquidity between token pair
          price: currentPrices[pool.token1.uuid] || 0,
          marketCap: 0, // TODO: Calculate when we have total supply data
          change: undefined, // Will be calculated by TokenChangeCell component
          priceHtr: currentPrices['00'] || 0,
        } as ExtendedPair)
      }
    })

    // Remove duplicates by token UUID, but prioritize HTR special entry
    const uniqueTokens = new Map<string, ExtendedPair>()

    tokenEntries.forEach((entry) => {
      const tokenUuid = entry.id.replace('token-', '')
      const existing = uniqueTokens.get(tokenUuid)

      // For HTR token, prioritize the specially created entry (token0 is always HTR)
      if (tokenUuid === '00') {
        if (!existing || (entry.token0.symbol === 'HTR' && existing.token0.symbol !== 'HTR')) {
          uniqueTokens.set(tokenUuid, entry)
        }
      } else {
        // For other tokens, keep the one with highest liquidity
        if (!existing || entry.liquidityUSD > existing.liquidityUSD) {
          uniqueTokens.set(tokenUuid, entry)
        }
      }
    })

    return Array.from(uniqueTokens.values())
      .filter((pair) => pair.liquidityUSD > 0)
      .sort((a, b) => b.liquidityUSD - a.liquidityUSD)
  }, [allPools, currentPrices, mounted])

  const pairs_array = useMemo(() => {
    if (!mounted || !_pairs_array.length) {
      return []
    }

    return _pairs_array
      .filter((pair) => {
        // Filter by search query
        const tokenName = pair.name || ''
        return tokenName.toLowerCase().includes(query.toLowerCase())
      })
      .filter((pair) => {
        // Apply filters - simplified for now
        if (filters.tvl.min || filters.tvl.max) {
          const maxTVL = Math.max(..._pairs_array.map((p) => p.liquidityUSD))
          return pair.liquidityUSD >= (filters.tvl.min || 0) && pair.liquidityUSD <= (filters.tvl.max || maxTVL)
        }
        return true
      })
  }, [_pairs_array, query, filters, mounted])

  const table = useReactTable<ExtendedPair>({
    data: pairs_array || [],
    columns: COLUMNS,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false,
    manualPagination: true,
  })

  useEffect(() => {
    if (!mounted) return

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
      // Mobile view: show only name and price for better readability
      setColumnVisibility({
        network: false,
        change: false,
        rewards: false,
        liquidityUSD: false,
        fees: false,
        volume: false,
        marketcap: false,
        chart: false,
      })
    }
  }, [isMd, isSm, mounted])

  const rowLink = useCallback((row: Pair) => {
    // Extract token UUID from the modified ID and get the symbol
    const tokenUuid = row.id.replace('token-', '')
    const token = row.token0.uuid === tokenUuid ? row.token0 : row.token1
    return `/tokens/${(token.symbol || 'unknown').toLowerCase()}`
  }, [])

  // Calculate max values for filters
  const maxValues = useMemo(() => {
    if (!_pairs_array.length) {
      return { tvl: 0, volume: 0, price: 0, marketcap: 0 }
    }

    return {
      tvl: Math.max(..._pairs_array.map((p) => p.liquidityUSD)),
      volume: Math.max(..._pairs_array.map((p) => p.volume1d ?? 0)),
      price: Math.max(..._pairs_array.map((p) => p.price || 0)),
      marketcap: Math.max(..._pairs_array.map((p) => p.marketCap || 0)),
    }
  }, [_pairs_array])

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <>
        <div className="flex flex-row items-center">
          <div className="w-96 h-12 rounded animate-pulse bg-stone-700"></div>
        </div>
        <div className="w-full h-96 rounded animate-pulse bg-stone-700"></div>
      </>
    )
  }

  const isLoading = isLoadingPools || isLoadingPrices || isLoadingTokens

  return (
    <>
      <div className="flex flex-row items-center">
        <FilterTokens maxValues={maxValues} search={query} setSearch={setQuery} setFilters={setFilters} />
        {isLoading && (
          <Typography variant="xs" className="text-balance text-stone-500">
            Loading token data...
          </Typography>
        )}
      </div>
      <GenericTable<ExtendedPair>
        table={table}
        loading={isLoading}
        placeholder={'No tokens found'}
        pageSize={PAGE_SIZE}
        linkFormatter={rowLink}
      />
    </>
  )
}
