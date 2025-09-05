// import { Native } from '@dozer/currency'
import { formatUSD } from '@dozer/format'
// import { Pair } from '@dozer/graph-client'
import { Pair } from '@dozer/api'
import { AppearOnMount, Currency, Dots, Link, Table, Typography } from '@dozer/ui'
import { FC } from 'react'

// import { useTokensFromPair } from '../../lib/hooks'
import { useTokensFromPair } from '@dozer/api'

interface PoolCompositionProps {
  pair: Pair
  prices: { [key: string]: number }
  isLoading?: boolean
}

export const PoolComposition: FC<PoolCompositionProps> = ({ pair, prices, isLoading }) => {
  const { token0, token1, reserve1, reserve0 } = useTokensFromPair(pair)

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex items-center justify-between px-2">
        <Typography weight={600} className="text-stone-50">
          Pool Composition
        </Typography>
        <AppearOnMount>
          <Typography variant="sm" weight={400} className="text-stone-400">
            Total Assets:{' '}
            {isLoading ? (
              <Dots>Loading</Dots>
            ) : (
              <span className="font-semibold text-stone-50">
                {' '}
                {formatUSD(
                  Number(
                    (
                      Number(reserve0.toFixed(2)) * prices?.[token0.uuid] +
                      Number(reserve1.toFixed(2)) * prices?.[token1.uuid]
                    )?.toFixed(2)
                  )
                )}
              </span>
            )}
          </Typography>
        </AppearOnMount>
      </div>
      <Table.container className="w-full">
        <Table.table>
          <Table.thead>
            <Table.thr>
              <Table.th>
                <div className="text-left">Token</div>
              </Table.th>
              <Table.th>
                <div className="text-left">Amount</div>
              </Table.th>
              <Table.th>
                <div className="text-left">Value</div>
              </Table.th>
            </Table.thr>
          </Table.thead>
          <Table.tbody>
            <Table.tr>
              <Table.td>
                <Link.External
                  style={{ textDecoration: 'none' }}
                  href={`../../../swap/tokens/${token0.symbol.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    <Currency.Icon currency={token0} width={24} height={24} />
                    <Typography weight={600} variant="sm" className="text-stone-50">
                      {token0.symbol}
                    </Typography>
                  </div>
                </Link.External>
              </Table.td>
              <Table.td>
                <Typography weight={500} variant="sm" className="text-stone-400">
                  {Number(reserve0.toFixed(2)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Typography>
              </Table.td>
              <Table.td>
                {isLoading ? (
                  <Dots>Loading</Dots>
                ) : (
                  <AppearOnMount>
                    <Typography weight={600} variant="sm" className="text-stone-50">
                      $
                      {prices?.[token0.uuid]
                        ? Number((Number(reserve0.toFixed(2)) * prices?.[token0.uuid]).toFixed(2)).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )
                        : ''}
                    </Typography>
                  </AppearOnMount>
                )}
              </Table.td>
            </Table.tr>
            <Table.tr>
              <Table.td>
                <Link.External
                  style={{ textDecoration: 'none' }}
                  href={`../../../swap/tokens/${token1.symbol.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    <Currency.Icon currency={token1} width={24} height={24} />
                    <Typography weight={600} variant="sm" className="text-stone-50">
                      {token1.symbol}
                    </Typography>
                  </div>
                </Link.External>
              </Table.td>
              <Table.td>
                <Typography weight={500} variant="sm" className="text-stone-400">
                  {Number(reserve1.toFixed(2)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Typography>
              </Table.td>
              <Table.td>
                {isLoading ? (
                  <Dots>Loading</Dots>
                ) : (
                  <AppearOnMount>
                    <Typography weight={600} variant="sm" className="text-stone-50">
                      $
                      {prices?.[token1.uuid]
                        ? Number((Number(reserve1.toFixed(2)) * prices?.[token1.uuid]).toFixed(2)).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )
                        : ''}
                    </Typography>
                  </AppearOnMount>
                )}
              </Table.td>
            </Table.tr>
          </Table.tbody>
        </Table.table>
      </Table.container>
    </div>
  )
}
