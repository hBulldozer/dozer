import { GenericTable, Typography } from '@dozer/ui'
import { ColumnDef, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { api } from 'utils/api'

export interface User {
  id: string
  address: string
  points: number
}

const COLUMNS: ColumnDef<User, unknown>[] = [
  {
    id: 'address',
    header: 'Address',
    cell: (info) => (
      <div className="flex items-center gap-2">
        <Typography variant="sm" weight={500} className="truncate text-stone-50">
          {info.row.original.address}
        </Typography>
      </div>
    ),
    size: 50,
  },
  {
    id: 'points',
    header: 'Points',
    accessorKey: 'points', // Use accessorKey instead of accessorFn
    cell: (info) => info.getValue<number>().toLocaleString(), // Use getValue to access the cell value
    size: 50,
  },
]

const Leaderboard = () => {
  const { data: balances, isLoading: isLoading_balances } = api.getProfile.leaderboard.useQuery()
  // const {data:test3} = api.getPools.contractState.useQuery({})
  const interval = 30 * 60 * 1000
  // const { data: test4 } = api.getPools.hourSnaps.useQuery({
  //   tokenUuid: '00b1b246cb512515c5258cb0301afcf83e74eb595dbe655d14e11782db4b70c6',
  // })
  const { data: prices, isLoading: isLoading_prices } = api.getPrices.all.useQuery()
  const { data: tokens } = api.getTokens.all.useQuery()
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'points',
      desc: true, // Set to false if you want ascending order
    },
  ])

  const isLoading = isLoading_balances || isLoading_prices

  const data = balances?.map((user) => {
    const htr_uuid = tokens?.find((token) => token.symbol == 'HTR')?.uuid || '00'
    const a_uuid = tokens?.find((token) => token.symbol == 'YIN')?.uuid || '00'
    const b_uuid = tokens?.find((token) => token.symbol == 'YANG')?.uuid || '00'
    const balances_htr = ((user.balances[htr_uuid] || 0) * (prices?.[htr_uuid] || 0)) / 100
    const balances_a = ((user.balances[a_uuid] || 0) * (prices?.[a_uuid] || 0)) / 100
    const balances_b = ((user.balances[b_uuid] || 0) * (prices?.[b_uuid] || 0)) / 100
    return {
      id: user.address,
      address: user.address,
      points: balances_htr + balances_a + balances_b,
    }
  })

  const table = useReactTable<User>({
    data: data || [],
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <>
      <GenericTable<User> table={table} loading={isLoading} placeholder={'No users found'} pageSize={20} />
    </>
  )
}

export default Leaderboard
