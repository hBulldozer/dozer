import { FC, useMemo } from 'react'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table'
import { Typography, GenericTable, classNames } from '@dozer/ui'
import { MultiplierBadge } from './MultiplierBadge'
import { PointsCounter } from './PointsCounter'

interface LeaderboardEntry {
  id?: string // Made optional to handle data without id field
  rank: number
  userAddress: string
  totalPoints: number
  volumePoints: number
  liquidityPoints: number
  // referralPoints: number // COMMENTED OUT - Referral feature removed for v1
  multiplier: number
  // discordUserId: string | null // COMMENTED OUT - Discord feature removed for v1
  updatedAt: Date
}

interface LeaderboardEntryWithId extends Omit<LeaderboardEntry, 'id'> {
  id: string // Required id field for table compatibility
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  isLoading?: boolean
  currentUserAddress?: string
  onLoadMore?: () => void
  hasMore?: boolean
}

const columnHelper = createColumnHelper<LeaderboardEntryWithId>()

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const LeaderboardTable: FC<LeaderboardTableProps> = ({
  data,
  isLoading = false,
  currentUserAddress,
  onLoadMore,
  hasMore = false,
}) => {
  // Ensure all data has an id field for table compatibility
  const dataWithIds: LeaderboardEntryWithId[] = data.map((item, index) => ({
    ...item,
    id: item.id || `leaderboard-${item.rank}-${item.userAddress}-${index}`,
  }))

  const columns = useMemo(
    () => [
      columnHelper.accessor('rank', {
        header: 'Rank',
        cell: ({ getValue, row }) => {
          const rank = getValue()
          const isCurrentUser = row.original.userAddress === currentUserAddress

          return (
            <div className="flex items-center gap-2">
              <div
                className={classNames(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                  rank <= 3
                    ? rank === 1
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : rank === 2
                      ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30'
                      : 'bg-amber-600/20 text-amber-300 border border-amber-600/30'
                    : isCurrentUser
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-gray-600/20 text-gray-400'
                )}
              >
                {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
              </div>
            </div>
          )
        },
        size: 80,
        meta: {
          className: 'justify-center',
        },
      }),
      columnHelper.accessor('userAddress', {
        header: 'User',
        cell: ({ getValue, row }) => {
          const address = getValue()
          const isCurrentUser = address === currentUserAddress

          return (
            <div className="flex items-center gap-3">
              <div
                className={classNames(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
                  isCurrentUser
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-gray-600/20 text-gray-400'
                )}
              >
                {address.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <Typography
                  variant="sm"
                  className={classNames('font-medium', isCurrentUser ? 'text-blue-300' : 'text-white')}
                >
                  {truncateAddress(address)}
                </Typography>
                {isCurrentUser && (
                  <Typography variant="xs" className="text-blue-400">
                    You
                  </Typography>
                )}
              </div>
            </div>
          )
        },
        size: 200,
      }),
      columnHelper.accessor('totalPoints', {
        header: 'Total Points',
        cell: ({ getValue }) => <PointsCounter value={getValue()} size="sm" className="text-white font-bold" />,
        size: 150,
        meta: {
          className: 'justify-end',
        },
      }),
      columnHelper.accessor('volumePoints', {
        header: 'Volume',
        cell: ({ getValue }) => (
          <Typography variant="sm" className="text-blue-300 font-medium">
            {getValue().toLocaleString()}
          </Typography>
        ),
        size: 100,
        meta: {
          className: 'justify-end',
        },
      }),
      columnHelper.accessor('liquidityPoints', {
        header: 'Liquidity',
        cell: ({ getValue }) => (
          <Typography variant="sm" className="text-green-300 font-medium">
            {getValue().toLocaleString()}
          </Typography>
        ),
        size: 100,
        meta: {
          className: 'justify-end',
        },
      }),
      // COMMENTED OUT - Referral column removed for v1
      // columnHelper.accessor('referralPoints', {
      //   header: 'Referrals',
      //   cell: ({ getValue }) => (
      //     <Typography variant="sm" className="text-purple-300 font-medium">
      //       {getValue().toLocaleString()}
      //     </Typography>
      //   ),
      //   size: 100,
      //   meta: {
      //     className: 'justify-end',
      //   },
      // }),
      columnHelper.accessor('multiplier', {
        header: 'Multiplier',
        cell: ({ getValue }) => (
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-400">{getValue()}x</div>
            <Typography variant="xs" className="text-gray-500">
              Base multiplier
            </Typography>
          </div>
        ),
        size: 150,
        meta: {
          className: 'justify-center',
        },
      }),
    ],
    [currentUserAddress]
  )

  const table = useReactTable({
    data: dataWithIds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'rank', desc: false }],
    },
  })

  // Show skeleton rows when loading and no data
  if (isLoading && data.length === 0) {
    const skeletonRows = Array.from({ length: 5 }, (_, i) => ({
      id: `skeleton-${i}`,
      rank: i + 1,
      userAddress: 'H' + '0'.repeat(33),
      totalPoints: 0,
      volumePoints: 0,
      liquidityPoints: 0,
      multiplier: 1.0,
      updatedAt: new Date(),
    }))

    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          {skeletonRows.map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600/50 rounded-full"></div>
                <div className="w-10 h-10 bg-gray-600/50 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-600/50 rounded"></div>
                  <div className="h-3 w-16 bg-gray-600/50 rounded"></div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="h-4 w-16 bg-gray-600/50 rounded"></div>
                <div className="h-4 w-12 bg-gray-600/50 rounded"></div>
                <div className="h-4 w-12 bg-gray-600/50 rounded"></div>
                <div className="h-4 w-8 bg-gray-600/50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <GenericTable table={table} loading={false} pageSize={5} placeholder="No leaderboard data available" />

      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {isLoading && data.length > 0 && (
        <div className="flex justify-center pt-4">
          <div className="inline-flex items-center px-4 py-2 text-sm text-gray-400">
            <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-gray-600 border-t-blue-500 rounded-full"></div>
            Loading more...
          </div>
        </div>
      )}
    </div>
  )
}
