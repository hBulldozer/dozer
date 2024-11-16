import React, { FC, useMemo } from 'react'
import { GenericTable, Button, Typography } from '@dozer/ui'
import { useRouter } from 'next/router'
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnDef } from '@tanstack/react-table'
import { api } from '../../utils/api'
import { AllTokensDBOutput } from '@dozer/api' // Adjust the import path as needed
import { useBreakpoint } from '@dozer/hooks'

interface CustomTokensTableProps {
  address: string
}

interface CustomToken extends AllTokensDBOutput {
  totalSupply?: number
}

export const CustomTokensTable: FC<CustomTokensTableProps> = ({ address }) => {
  const { isSm } = useBreakpoint('sm')
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data: tokens, isLoading } = api.getTokens.all.useQuery(undefined, { staleTime: 5000 })
  const { data: totalSupplies } = api.getTokens.allTotalSupply.useQuery()

  const customTokens = useMemo(() => {
    return (tokens?.filter((token) => token.createdBy === address) || []).map((token) => ({
      ...token,
      totalSupply: totalSupplies?.[token.uuid] || 0,
    }))
  }, [tokens, address, totalSupplies])

  const COLUMNS: ColumnDef<CustomToken, unknown>[] = [
    {
      id: 'token',
      header: 'Token',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <img src={info.row.original.imageUrl} alt={info.row.original.name} className="w-6 h-6 rounded-full" />
          <Typography variant="sm" weight={500} className="truncate text-stone-50">
            {info.row.original.symbol}
          </Typography>
          <Typography variant="xxs" className="hidden truncate sm:block text-stone-400">
            {info.row.original.name}
          </Typography>
        </div>
      ),
      size: 50,
    },
    {
      id: 'totalSupply',
      header: 'Total Supply',
      accessorFn: (row) => row.totalSupply,
      cell: (info) => info.getValue(),
      size: 50,
    },
    {
      id: 'actions',
      header: '',
      cell: (info) => (
        //justify the button to the right of the table
        <div className="flex justify-end">
          <Button
            as="a"
            href={
              !info.row.original.custom
                ? `/pool/${info.row.original.uuid}`
                : `/pool/create?token=${info.row.original.uuid}`
            }
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault()
              window.location.href = !info.row.original.custom
                ? `/pool/${info.row.original.pools1[0].id}`
                : `/pool/create?token=${info.row.original.uuid}`
            }}
            size="sm"
          >
            {!info.row.original.custom ? 'View Pool' : 'Create Pool'}
          </Button>
        </div>
      ),
      size: isSm ? 20 : 90,
    },
  ]

  const table = useReactTable({
    data: customTokens,
    columns: COLUMNS,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <GenericTable
      table={table}
      loading={isLoading}
      placeholder="No custom tokens found"
      pageSize={Math.max(customTokens?.length || 0, 5)}
    />
  )
}
