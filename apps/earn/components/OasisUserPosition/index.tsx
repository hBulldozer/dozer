import { toToken } from '@dozer/api'
import { Button, Currency, Dots, Tooltip, Typography } from '@dozer/ui'
import Icon from '@dozer/ui/currency/Icon'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export interface OasisInterface {
  id: string
  user_deposit_b: number
  user_balance_a: number
  user_withdrawal_time: Date
  max_withdraw_htr: number
  max_withdraw_b: number
  token: { symbol: string; uuid: string }
  user_lp_htr: number
  user_lp_b: number
  htr_price_in_deposit: number
  token_price_in_htr_in_deposit: number
  position_closed?: boolean
  closed_balance_a?: number
  closed_balance_b?: number
}

const UserOasisPosition = ({
  oasis,
  buttonWithdraw,
  buttonWithdrawBonus,
  buttonClosePosition,
  setSelectedTab,
  isRpcRequestPending,
  prices,
}: {
  oasis: OasisInterface
  isRpcRequestPending?: boolean
  buttonWithdraw: JSX.Element
  buttonWithdrawBonus: JSX.Element
  buttonClosePosition?: JSX.Element
  setSelectedTab: (tab: number) => void
  prices: Record<string, number>
}) => {
  // All operations are now handled via optimistic UI updates directly in the allUserOasis data

  const getWithdrawalDate = () => {
    if (!oasis.user_withdrawal_time) return null
    return typeof oasis.user_withdrawal_time === 'string'
      ? new Date(oasis.user_withdrawal_time)
      : oasis.user_withdrawal_time
  }

  const withdrawalDate = getWithdrawalDate()
  const isUnlocked = withdrawalDate ? withdrawalDate.getTime() < Date.now() : false

  // Calculate time remaining until unlock
  const getTimeRemaining = () => {
    if (!withdrawalDate || isUnlocked) return null

    const now = Date.now()
    const unlockTime = withdrawalDate.getTime()
    const remaining = unlockTime - now

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.ceil((remaining % (1000 * 60 * 60)) / (1000 * 60))

    return { days, hours, minutes }
  }

  const timeRemaining = getTimeRemaining()

  // Calculate impermanent loss protection
  const calculateImpermanentLossProtection = () => {
    if (!oasis.user_deposit_b || !oasis.max_withdraw_b || !oasis.max_withdraw_htr) {
      return { ilProtection: 0, hasIL: false }
    }

    // Check if there's impermanent loss
    const hasIL = oasis.max_withdraw_b < oasis.user_deposit_b

    // Calculate IL protection amount in HTR
    const ilProtection = hasIL ? oasis.max_withdraw_htr - oasis.user_balance_a : 0

    return { ilProtection, hasIL }
  }

  const ilData = calculateImpermanentLossProtection()

  // Calculate ROI
  const calculateROI = () => {
    // Only calculate if we have all the necessary data
    if (!oasis.user_deposit_b || !prices)
      return null

    const currencyUuid = oasis.token.uuid

    // Use initial prices from deposit if available, otherwise fallback to current prices
    // Note: API already converts these from contract PRICE_PRECISION format
    const initialHtrPriceUSD = oasis.htr_price_in_deposit || 0
    // Contract stores deposit_amount/htr_amount (tokens per HTR), so invert to get HTR per token
    const tokensPerHTR = oasis.token_price_in_htr_in_deposit || 0
    const initialTokenPriceHTR = tokensPerHTR > 0 ? 1 / tokensPerHTR : 0

    // Calculate initial token price in USD: token_price_htr * htr_price_usd
    const initialTokenPriceUSD = initialTokenPriceHTR * initialHtrPriceUSD

    // Initial investment value in USD using initial prices
    const initialInvestmentUSD = oasis.user_deposit_b * initialTokenPriceUSD

    // Current position value in USD using current prices
    const tokenValueUSD = oasis.max_withdraw_b * prices[currencyUuid]
    const htrValueUSD = oasis.max_withdraw_htr * prices['00']

    // HTR bonus value in USD using current prices
    const bonusValueUSD = oasis.user_balance_a * prices['00']

    // Total current value including bonus if available
    const totalCurrentValueUSD = tokenValueUSD + htrValueUSD

    // ROI calculation based on initial investment value
    const roi = (totalCurrentValueUSD / initialInvestmentUSD - 1) * 100

    return {
      roi,
      initialInvestmentUSD,
      currentPositionUSD: tokenValueUSD + htrValueUSD,
      bonusValueUSD,
      totalCurrentValueUSD,
      // Include initial prices for debugging or display
      initialHtrPriceUSD,
      initialTokenPriceHTR,
      initialTokenPriceUSD,
    }
  }

  const roiData = calculateROI()

  // Format remaining time as string
  const getFormattedTimeRemaining = () => {
    if (!timeRemaining) return null

    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h left`
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m left`
    } else {
      return `${timeRemaining.minutes}m left`
    }
  }

  const formattedTimeRemaining = getFormattedTimeRemaining()

  return (
    <div className="flex overflow-hidden relative flex-col rounded-lg">
      {/* Only show loading overlay for wallet confirmation */}
      {isRpcRequestPending && (
        <div className="flex absolute inset-0 z-50 justify-center items-center rounded-lg bg-black/80">
          <Dots>Confirm in wallet</Dots>
        </div>
      )}

      {/* Position Header */}
      <div className="flex justify-between items-center p-4 rounded-lg bg-stone-800/50">
        <div className="flex gap-2 items-center">
          <div className="relative flex-shrink-0 -mt-5 mr-2 w-8 h-8">
            <div className="absolute z-10 mt-7">
              <Currency.IconList iconWidth={18} iconHeight={18}>
                <Currency.Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} />
                <Currency.Icon currency={toToken(oasis.token)} />
              </Currency.IconList>
            </div>
            <Typography variant="hero" className="mt-1">
              🏝️
            </Typography>
          </div>
          <div className="ml-4">
            <Typography variant="lg" weight={600} className="text-stone-200">
              HTR-{oasis.token.symbol}
            </Typography>
            <div className="flex flex-wrap gap-1 items-start">
              <div className="flex gap-1 items-center">
                <div
                  className={`w-2 h-2 rounded-full ${
                    oasis.position_closed ? 'bg-blue-500' : isUnlocked ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                />
                <Typography variant="xs" className="text-stone-400">
                  {oasis.position_closed ? 'Closed' : isUnlocked ? 'Unlocked' : 'Locked'}
                </Typography>
              </div>
              {formattedTimeRemaining && (
                <div className="mt-1 w-full sm:w-auto sm:mt-0 sm:ml-1">
                  <Typography variant="xs" className="text-yellow">
                    {formattedTimeRemaining}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </div>

        {roiData && (
          <div className="text-right">
            <Typography variant="lg" weight={600} className="text-stone-200">
              ${roiData.totalCurrentValueUSD.toFixed(2)}
            </Typography>
            <div className="flex gap-1 justify-end items-center">
              <div
                className={`${
                  roiData.roi > 0 ? 'text-green-500' : Math.abs(roiData.roi) < 0.01 ? 'text-stone-500' : 'text-red-500'
                }`}
              >
                <Typography variant="xs" weight={500}>
                  {roiData.roi > 0 ? '+' : Math.abs(roiData.roi) < 0.01 ? '' : '-'}
                  {Math.abs(roiData.roi).toFixed(2)}%
                </Typography>
              </div>

              <Tooltip
                panel={
                  <div className="max-w-xs">
                    {oasis.user_balance_a > 0 ? (
                      <Typography variant="xs">
                        Return on investment calculated using the token price at the time of your deposit.
                      </Typography>
                    ) : (
                      <Typography variant="xs">
                        Your current ROI has decreased by up to 20% following your bonus withdrawal.
                      </Typography>
                    )}
                  </div>
                }
                button={<InformationCircleIcon width={14} height={14} className="inline ml-1 text-stone-500" />}
              >
                <></>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Position Content */}
      <div className="flex flex-col py-4">
        {/* Assets Section */}
        <div className="mb-4">
          <Typography variant="sm" weight={600} className="mb-2 text-stone-300">
            Your Assets
          </Typography>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-stone-800/50">
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6">
                  <Icon currency={toToken(oasis.token)} width={24} height={24} />
                </div>
                <Typography variant="sm" className="text-stone-300">
                  {oasis.token.symbol}
                </Typography>
              </div>
              <Typography variant="sm" weight={600} className="text-stone-200">
                {oasis.max_withdraw_b}
              </Typography>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-stone-800/50">
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6">
                  <Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} width={24} height={24} />
                </div>
                <div>
                  <Typography variant="sm" className="text-stone-300">
                    HTR
                    {(oasis.user_balance_a > 0 || ilData.hasIL) && (
                      <Tooltip
                        panel={
                          <div className="max-w-xs">
                            <Typography variant="xs">
                              {oasis.user_balance_a > 0 && (
                                <p className="mb-1">Bonus - {oasis.user_balance_a.toFixed(2)}</p>
                              )}
                              {ilData.hasIL && <p className="mb-1">IL protection - {ilData.ilProtection.toFixed(2)}</p>}
                            </Typography>
                          </div>
                        }
                        button={<InformationCircleIcon width={14} height={14} className="inline ml-1 text-stone-500" />}
                      >
                        <></>
                      </Tooltip>
                    )}
                  </Typography>
                </div>
              </div>
              <Typography variant="sm" weight={600} className="text-stone-200">
                {oasis.max_withdraw_htr}
              </Typography>
            </div>
          </div>
        </div>

        {/* Bonus Section - only show if bonus is available
        {oasis.user_balance_a > 0 && (
          <div className="mb-4">
            <Typography variant="sm" weight={600} className="mb-2 text-stone-300">
              Available Bonus
              <Tooltip
                panel={
                  <div className="max-w-xs">
                    <Typography variant="xs">
                      This is your HTR bonus that you can withdraw immediately, even while your position is still
                      locked.
                    </Typography>
                  </div>
                }
                button={<InformationCircleIcon width={14} height={14} className="inline ml-1 text-stone-500" />}
              >
                <></>
              </Tooltip>
            </Typography>

            <div className="flex justify-between items-center p-3 rounded-lg bg-stone-800/50">
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6">
                  <Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} width={24} height={24} />
                </div>
                <Typography variant="sm" className="text-stone-300">
                  HTR Bonus
                </Typography>
              </div>
              <Typography variant="sm" weight={600} className="text-yellow">
                {oasis.user_balance_a}
              </Typography>
            </div>
          </div>
        )} */}

        {/* Details Section */}
        <Typography variant="sm" weight={600} className="mb-2 text-stone-300">
          Position Details
        </Typography>
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-stone-800">
          <div className="flex justify-between items-start">
            <Typography variant="sm" className="text-stone-400">
              Unlock Date
            </Typography>
            <div className="text-right">
              <Typography variant="sm" className="text-yellow">
                {withdrawalDate?.toLocaleDateString()}
              </Typography>
              <Typography variant="sm" className="text-yellow">
                {withdrawalDate?.toLocaleTimeString()}
              </Typography>
            </div>
          </div>

          {roiData && (
            <>
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Initial Value
                </Typography>
                <Typography variant="sm" className="text-yellow">
                  ${roiData.initialInvestmentUSD.toFixed(2)}
                </Typography>
              </div>

              {/* {oasis.htr_price_in_deposit > 0 && (
                  <div className="flex justify-between">
                    <Typography variant="xs" className="text-stone-400">
                      Initial Prices
                      <Tooltip
                        panel={
                          <div className="max-w-xs">
                            <Typography variant="xs">
                              Prices at the time of deposit, used to calculate your ROI.
                            </Typography>
                          </div>
                        }
                        button={<InformationCircleIcon width={14} height={14} className="inline ml-1 text-stone-500" />}
                      >
                        <></>
                      </Tooltip>
                    </Typography>
                    <div className="text-right">
                      <Typography variant="xs" weight={500} className="text-stone-300">
                        HTR: ${roiData.initialHtrPrice.toFixed(2)}
                      </Typography>
                      {roiData.initialTokenPrice > 0 && (
                        <Typography variant="xs" weight={500} className="text-stone-300">
                          {oasis.token.symbol}: ${roiData.initialTokenPrice.toFixed(2)}
                        </Typography>
                      )}
                    </div>
                  </div>
                )} */}

              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Current Value
                  <Tooltip
                    panel={
                      <div className="max-w-xs">
                        <Typography variant="xs">
                          This includes the value of your {oasis.token.symbol} and HTR in the position,
                          {oasis.user_balance_a > 0
                            ? ' plus your available HTR bonus.'
                            : ' but does not include any already withdrawn bonus.'}
                        </Typography>
                      </div>
                    }
                    button={<InformationCircleIcon width={14} height={14} className="inline ml-1 text-stone-500" />}
                  >
                    <></>
                  </Tooltip>
                </Typography>
                <Typography variant="sm" className="text-yellow">
                  ${roiData.totalCurrentValueUSD.toFixed(2)}
                </Typography>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row gap-2 p-1 w-full">
        {/* When position is unlocked but not closed, show Close Position button */}
        {isUnlocked && !oasis.position_closed && <div className="w-full">{buttonClosePosition}</div>}

        {/* When position is closed, show Withdraw Position button */}
        {oasis.position_closed && <div className="w-full">{buttonWithdraw}</div>}

        {!isUnlocked && oasis.user_balance_a > 0 && <div className="w-full">{buttonWithdrawBonus}</div>}
        {!oasis.position_closed && (
          <div className="w-full">
            <Button
              size="md"
              fullWidth
              onClick={() => {
                setSelectedTab(0)
              }}
            >
              <div className="flex flex-col">Deposit</div>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserOasisPosition
