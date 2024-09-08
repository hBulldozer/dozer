import React, { FC, useMemo } from 'react'
import { GenericTable, Button } from '@dozer/ui'
import { useRouter } from 'next/router'
import { getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnDef } from '@tanstack/react-table'
import { api } from '../../utils/api'
import { AllTokensDBOutput } from '@dozer/api' // Adjust the import path as needed

interface CustomTokensTableProps {
  address: string
}

interface CustomToken extends AllTokensDBOutput {
  totalSupply?: number
}

export const CustomTokensTable: FC<CustomTokensTableProps> = ({ address }) => {
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data: tokens, isLoading } = api.getTokens.all.useQuery()
  const { data: totalSupplies } = api.getTokens.allTotalSupply.useQuery()

  const customTokens = useMemo(() => {
    return (tokens?.filter((token) => token.custom && token.createdBy === address) || []).map((token) => ({
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
          <span>{info.row.original.symbol}</span>
          <span className="text-stone-400">{info.row.original.name}</span>
        </div>
      ),
      size: 200,
    },
    {
      id: 'totalSupply',
      header: 'Total Supply',
      accessorFn: (row) => row.totalSupply,
      cell: (info) => info.getValue(),
      size: 150,
    },
    {
      id: 'actions',
      header: '',
      cell: (info) => (
        <Button
          as="a"
          href={`/pool/create?token=${info.row.original.uuid}`}
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            window.location.href = `/pool/create?token=${info.row.original.uuid}`
          }}
          size="sm"
        >
          Create Pool
        </Button>
      ),
      size: 100,
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

  return <GenericTable table={table} loading={isLoading} placeholder="No custom tokens found" pageSize={20} />
}
