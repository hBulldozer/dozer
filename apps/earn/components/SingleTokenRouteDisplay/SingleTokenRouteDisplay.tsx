import { Typography, Currency } from '@dozer/ui'
import { Type } from '@dozer/currency'
import { FC } from 'react'

interface SingleTokenRouteDisplayProps {
  type: 'add' | 'remove'
  inputToken?: Type
  outputToken?: Type
  token0?: Type
  token1?: Type
  inputAmount?: number
  outputAmount?: number
  token0Amount?: number
  token1Amount?: number
  swapAmount?: number
  swapOutput?: number
  prices?: { [key: string]: number }
  formatAmount: (amount: number) => string
}

export const SingleTokenRouteDisplay: FC<SingleTokenRouteDisplayProps> = ({
  type,
  inputToken,
  outputToken,
  token0,
  token1,
  inputAmount,
  outputAmount,
  token0Amount,
  token1Amount,
  swapAmount,
  swapOutput,
  prices,
  formatAmount,
}) => {
  const Arrow = () => (
    <div className="flex flex-col items-center">
      <svg
        className="w-4 h-4 text-stone-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </div>
  )

  if (type === 'add') {
    return (
      <>
        {/* Visual Route Display for Add */}
        <div className="py-3">
          <div className="flex justify-center items-center space-x-3">
            {/* Input Token */}
            {inputToken && inputAmount && (
              <div className="flex flex-col items-center space-y-1">
                <Currency.Icon currency={inputToken} width={24} height={24} />
                <Typography variant="xs" className="text-stone-300">
                  {inputAmount.toFixed(2)}
                </Typography>
              </div>
            )}

            {/* Arrow to Swap */}
            <div className="flex flex-col items-center">
              <Arrow />
              <Typography variant="xs" className="mt-1 text-stone-500">
                Swap
              </Typography>
            </div>

            {/* Split Result */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex flex-col items-center space-y-2">
                {token0 && token0Amount !== undefined && (
                  <div className="flex flex-col items-center space-y-1">
                    <Currency.Icon currency={token0} width={20} height={20} />
                    <Typography variant="xs" className="text-green-300">
                      {formatAmount(token0Amount)}
                    </Typography>
                  </div>
                )}
                {token1 && token1Amount !== undefined && (
                  <div className="flex flex-col items-center space-y-1">
                    <Currency.Icon currency={token1} width={20} height={20} />
                    <Typography variant="xs" className="text-green-300">
                      {formatAmount(token1Amount)}
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow to Pool */}
            <div className="flex flex-col items-center">
              <Arrow />
              <Typography variant="xs" className="mt-1 text-stone-500">
                Add LP
              </Typography>
            </div>

            {/* Final Position Value */}
            <div className="flex flex-col items-center space-y-1">
              {inputToken && outputToken && (
                <Currency.IconList iconWidth={24} iconHeight={24}>
                  <Currency.Icon currency={inputToken} width={24} height={24} />
                  <Currency.Icon currency={outputToken} width={24} height={24} />
                </Currency.IconList>
              )}
              <Typography variant="xs" className="text-stone-400">
                {prices && inputToken && outputToken && prices[inputToken.uuid] && prices[outputToken.uuid] && token0Amount !== undefined && token1Amount !== undefined ? (
                  <span className="text-green-300">
                    $
                    {(
                      token0Amount * prices[inputToken.uuid] +
                      token1Amount * prices[outputToken.uuid]
                    ).toFixed(2)}
                  </span>
                ) : (
                  'LP Position'
                )}
              </Typography>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Remove liquidity display
  return (
    <>
      {/* Visual Route Display for Remove */}
      <div className="py-3 border-t border-stone-700">
        <div className="flex justify-center items-center space-x-3">
          {/* LP Position */}
          <div className="flex flex-col items-center space-y-1">
            {token0 && token1 && (
              <Currency.IconList iconWidth={24} iconHeight={24}>
                <Currency.Icon currency={token0} width={24} height={24} />
                <Currency.Icon currency={token1} width={24} height={24} />
              </Currency.IconList>
            )}
            <Typography variant="xs" className="text-stone-300">
              LP Position
            </Typography>
            {prices && token0 && token1 && prices[token0.uuid] && prices[token1.uuid] && token0Amount !== undefined && token1Amount !== undefined && (
              <Typography variant="xs" className="text-stone-500">
                $
                {(
                  token0Amount * prices[token0.uuid] +
                  token1Amount * prices[token1.uuid]
                ).toFixed(2)}
              </Typography>
            )}
          </div>

          {/* Arrow to Withdrawal */}
          <div className="flex flex-col items-center">
            <Arrow />
            <Typography variant="xs" className="mt-1 text-stone-500">
              Withdraw
            </Typography>
          </div>

          {/* Withdrawn Tokens */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex flex-col items-center space-y-2">
              {token0 && token0Amount !== undefined && (
                <div className="flex flex-col items-center space-y-1">
                  <Currency.Icon currency={token0} width={20} height={20} />
                  <Typography variant="xs" className="text-green-300">
                    {formatAmount(token0Amount)}
                  </Typography>
                </div>
              )}
              {token1 && token1Amount !== undefined && (
                <div className="flex flex-col items-center space-y-1">
                  <Currency.Icon currency={token1} width={20} height={20} />
                  <Typography variant="xs" className="text-green-300">
                    {formatAmount(token1Amount)}
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {swapAmount && swapAmount > 0 && (
            <>
              {/* Arrow to Swap */}
              <div className="flex flex-col items-center">
                <Arrow />
                <Typography variant="xs" className="mt-1 text-stone-500">
                  Swap
                </Typography>
              </div>
            </>
          )}

          {/* Final Token */}
          {outputToken && outputAmount !== undefined && (
            <div className="flex flex-col items-center space-y-1">
              <Currency.Icon currency={outputToken} width={24} height={24} />
              <Typography variant="xs" className="text-green-300">
                {formatAmount(outputAmount)}
              </Typography>
              {prices && outputToken && prices[outputToken.uuid] && (
                <Typography variant="xs" className="text-stone-500">
                  ${(outputAmount * prices[outputToken.uuid]).toFixed(2)}
                </Typography>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}