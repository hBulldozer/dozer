import React, { Fragment, useEffect, useState, FC, useRef } from 'react'
import {
  Widget,
  Select,
  Input,
  Button,
  Typography,
  Slider,
  classNames,
  NotificationData,
  createSuccessToast,
  createErrorToast,
  Dots,
  Tooltip,
  Currency,
} from '@dozer/ui'
import Image from 'next/legacy/image'
import { Token } from '@dozer/currency'
import { ArrowTopRightOnSquareIcon, ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import backgroundOasis from '../public/background_oasis.jpeg'
import { Tab, Transition } from '@headlessui/react'
import { Connected } from '@dozer/higmi/systems/Checker/Connected'
import { api } from '@dozer/higmi/utils/api'
import { Checker, useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { get, remove } from 'lodash'
import { hathorLib, Oasis } from '@dozer/nanocontracts'
import { useAccount, useNetwork } from '@dozer/zustand'
import { ChainId } from '@dozer/chain'
import BlockTracker from '@dozer/higmi/components/BlockTracker/BlockTracker'
import {
  OasisAddModal,
  OasisRemoveBonusModal,
  OasisRemoveModal,
  OasisClosePositionModal,
} from '../components/OasisModal'
import type { OasisPosition } from '../components/OasisModal/types'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import Link from 'next/link'
import { OasisChart } from '../components/OasisChart'
import PricePanel from '../components/PricePanel'
import Icon from '@dozer/ui/currency/Icon'
import { toToken } from '@dozer/api'

interface OasisInterface {
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

const TokenOption = ({ token, disabled }: { token: { symbol: string; uuid: string }; disabled?: boolean }) => {
  const currency =
    token.symbol == 'hUSDC' ? 'hUSDC' : token.symbol == 'hETH' ? 'ETH' : token.symbol == 'hBTC' ? 'BTC' : 'hUSDC'
  return (
    <div className={classNames('flex flex-row items-center w-full gap-4', disabled && 'opacity-50')}>
      <div className="flex flex-row items-center w-full gap-4">
        <div className="flex-shrink-0 w-7 h-7">
          <Icon key={token.symbol} currency={toToken(token)} width={28} height={28} />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <Typography variant="sm" weight={500} className="truncate text-stone-200 group-hover:text-stone-50">
            {token.symbol}
          </Typography>
        </div>
      </div>
    </div>
  )
}

const UserOasisPosition = ({
  address,
  currentBlockHeight,
  oasis,
  isLoading,
  addingLiquidity,
  addingToOasisId,
  buttonWithdraw,
  buttonWithdrawBonus,
  buttonClosePosition,
  setSelectedTab,
  isRpcRequestPending,
  prices,
}: {
  address: string
  currentBlockHeight: number
  oasis: OasisInterface
  isLoading?: boolean
  isRpcRequestPending?: boolean
  addingLiquidity?: boolean
  addingToOasisId?: string
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
    if (!oasis.user_deposit_b || !prices || !oasis.htr_price_in_deposit || !oasis.token_price_in_htr_in_deposit)
      return null

    const currencyUuid = oasis.token.uuid

    // Use initial prices from deposit if available, otherwise fallback to current prices
    const initialHtrPrice = oasis.htr_price_in_deposit
    const initialTokenPrice = oasis.token_price_in_htr_in_deposit / initialHtrPrice

    // Initial investment value in USD using initial prices
    const initialInvestmentUSD = oasis.user_deposit_b * initialTokenPrice

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
      initialHtrPrice,
      initialTokenPrice,
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
    <div className="relative flex flex-col overflow-hidden rounded-lg">
      {/* Only show loading overlay for wallet confirmation */}
      {isRpcRequestPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-black/80">
          <Dots>Confirm in wallet</Dots>
        </div>
      )}

      {/* Position Header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-stone-800/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0 w-8 h-8 mr-2 -mt-5">
            <div className="absolute z-10 mt-7 ">
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
            <div className="flex flex-wrap items-start gap-1">
              <div className="flex items-center gap-1 ">
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
                <div className="w-full mt-1 sm:w-auto sm:mt-0 sm:ml-1">
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
            <div className="flex items-center justify-end gap-1">
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50">
              <div className="flex items-center gap-2">
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

            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50">
              <div className="flex items-center gap-2">
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

            <div className="flex items-center justify-between p-3 rounded-lg bg-stone-800/50">
              <div className="flex items-center gap-2">
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
        <div className="flex flex-col gap-4 p-4 bg-stone-800 rounded-xl">
          <div className="flex items-start justify-between">
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
      <div className="flex flex-row w-full gap-2 p-1">
        {/* When position is unlocked but not closed, show Close Position button */}
        {isUnlocked && !oasis.position_closed && <div className="w-full ">{buttonClosePosition}</div>}

        {/* When position is closed, show Withdraw Position button */}
        {oasis.position_closed && <div className="w-full ">{buttonWithdraw}</div>}

        {!isUnlocked && oasis.user_balance_a > 0 && <div className="w-full ">{buttonWithdrawBonus}</div>}
        {!oasis.position_closed && (
          <div className="w-full ">
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

// Function to update oasis position optimistically for bonus withdrawal
const editOasisBonusOnWithdraw = (allUserOasisList: OasisInterface[] | undefined, oasisId: string) => {
  if (!allUserOasisList) return allUserOasisList

  return allUserOasisList.map((oasis) => {
    if (oasis.id === oasisId) {
      // Calculate new max_withdraw_htr by subtracting the bonus
      const bonusAmount = oasis.user_balance_a || 0
      const newMaxWithdrawHtr = Math.max(0, oasis.max_withdraw_htr - bonusAmount)

      // Create a new object with bonus zeroed out to avoid reference issues
      return {
        ...oasis,
        user_balance_a: 0,
        max_withdraw_htr: newMaxWithdrawHtr,
      }
    }
    return oasis
  })
}

// Function to update oasis position optimistically for position withdrawal
const editOasisOnWithdraw = (allUserOasisList: OasisInterface[] | undefined, oasisId: string) => {
  if (!allUserOasisList) return allUserOasisList

  // Filter out the position entirely instead of just marking it as closed
  return allUserOasisList.filter((oasis) => oasis.id !== oasisId)
}

// Function to update oasis position optimistically for adding liquidity to an existing position
const editOasisOnAdd = (
  allUserOasisList: OasisInterface[] | undefined,
  oasisId: string,
  addAmount: number,
  addBonus: number,
  addHtrMatch: number,
  newUnlockDate: Date,
  htrPrice: number
) => {
  if (!allUserOasisList) return allUserOasisList

  return allUserOasisList.map((oasis) => {
    if (oasis.id === oasisId) {
      // Create a new object with updated values using data from getFrontQuoteLiquidityIn
      return {
        ...oasis,
        // Update deposit amount with depositAmount from the API response
        user_deposit_b: oasis.user_deposit_b + addAmount,
        // Update bonus balance (this is the value from bonus in the API response)
        user_balance_a: oasis.user_balance_a + addBonus,
        // Update max withdrawable amounts (use depositAmount for token)
        max_withdraw_b: oasis.max_withdraw_b + addAmount,
        // HTR includes matched amount + bonus
        max_withdraw_htr: oasis.max_withdraw_htr + addBonus,
        // Update withdrawal time from API response
        user_withdrawal_time: newUnlockDate,
        // Update LP token amounts (htr_amount from API response)
        user_lp_htr: oasis.user_lp_htr + addHtrMatch,
        user_lp_b: oasis.user_lp_b + addAmount,
        // Keep the existing htr_price_in_deposit and token_price_in_htr_in_deposit
        // as these will be properly updated when the real data comes from the blockchain
        position_closed: false,
      }
    }
    return oasis
  })
}

// Function to update oasis position optimistically for closing a position
const editOasisOnClose = (allUserOasisList: OasisInterface[] | undefined, oasisId: string) => {
  if (!allUserOasisList) return allUserOasisList

  return allUserOasisList.map((oasis) => {
    if (oasis.id === oasisId) {
      // Mark the position as closed but keep it in the list
      return {
        ...oasis,
        position_closed: true,
      }
    }
    return oasis
  })
}

const OasisProgram = () => {
  const [amount, setAmount] = useState<string>('')
  const [token, setToken] = useState<string>('hUSDC')
  const [lockPeriod, setLockPeriod] = useState<number>(12)
  const [selectedTab, setSelectedTab] = useState(0)
  const [unlockDate, setUnlockDate] = useState<Date>(new Date())
  const [htrMatch, setHtrMatch] = useState<number>(0)
  const [fetchLoading, setFetchLoading] = useState<boolean>(false)
  const [hasPosition, setHasPosition] = useState<boolean>(false)
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [bonus, setBonus] = useState<number>(0)
  // Track whether add liquidity transaction is pending
  const [addingLiquidity, setAddingLiquidity] = useState<boolean>(false)
  const [addingToOasisId, setAddingToOasisId] = useState<string>('')
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false)
  const [removeModalOpen, setRemoveModalOpen] = useState<boolean>(false)
  const [selectedOasisForRemove, setSelectedOasisForRemove] = useState<OasisPosition | null>(null)
  const [selectedOasisForRemoveBonus, setSelectedOasisForRemoveBonus] = useState<OasisPosition | null>(null)
  const [removeBonusModalOpen, setRemoveBonusModalOpen] = useState<boolean>(false)
  const [selectedOasisForClose, setSelectedOasisForClose] = useState<OasisPosition | null>(null)
  const [closePositionModalOpen, setClosePositionModalOpen] = useState<boolean>(false)
  const [txType, setTxType] = useState<string>('Add liquidity')
  const [pendingTransactions, setPendingTransactions] = useState<{ [key: string]: boolean }>({})
  const [hasOptimisticUpdate, setHasOptimisticUpdate] = useState<boolean>(false)
  const [showChart, setShowChart] = useState(false)
  const [tokenPriceChange, setTokenPriceChange] = useState<number>(0)
  const [hover, setHover] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  const { network } = useNetwork()
  const { addNotification } = useAccount()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

  // We're not using pendingPositions from the store anymore
  const { data: currentBlock } = api.getNetwork.getBestBlock.useQuery(undefined, {
    refetchInterval: 30000,
    staleTime: 5000, // Consider data fresh for 5 seconds
  })
  const currentBlockHeight = currentBlock?.number || 0

  const utils = api.useUtils()
  const { data: prices } = api.getPrices.all.useQuery()
  const initialPrices = {
    htr: prices ? prices['00'] : 0,
    btc: 98520,
    eth: 3339,
    usdc: 1,
    husdc: 1,
  }

  // Bonus rate based on lock period
  const bonusRate = lockPeriod === 6 ? 0.1 : lockPeriod === 9 ? 0.15 : 0.2

  // Unlock date calculation
  // const unlockDate = new Date(Date.now() + lockPeriod * 30 * 24 * 60 * 60 * 1000)
  const currency = token == 'hUSDC' ? 'hUSDC' : token == 'hETH' ? 'ETH' : token == 'hBTC' ? 'BTC' : 'hUSDC'
  const { data: allOasis } = api.getOasis.all.useQuery()
  const { data: allReserves } = api.getOasis.allReserves.useQuery()
  const { data: allUserOasis } = api.getOasis.allUser.useQuery(
    { address: address },
    {
      enabled: Boolean(address) && !hasOptimisticUpdate, // Only fetch when not showing optimistic updates
      refetchOnWindowFocus: false, // Don't refetch on window focus to avoid disrupting optimistic updates
      refetchInterval: hasOptimisticUpdate ? false : 60000, // Only auto-refetch when not showing optimistic updates
      staleTime: 30000, // Consider data fresh for 30 seconds
      // This is important - don't replace optimistic updates with stale data
      keepPreviousData: hasOptimisticUpdate,
    }
  )

  const oasis = allOasis?.find((oasis) => oasis.token.symbol == currency)
  const oasisReserve = allReserves?.find((oasis) => oasis.token.symbol == currency)
  const availableHTR = oasisReserve?.oasis_htr_balance || 0
  const depositedHTR = oasisReserve?.dev_deposit_amount || 0
  const progress = (availableHTR / depositedHTR) * 100
  const oasisId = oasis?.id
  const oasisName = oasis?.name || ''
  const poolId = oasis?.pool.id || ''
  const tokenUuid = oasis?.token.uuid || ''
  const oasisObj = new Oasis(tokenUuid, poolId)
  const handleAddLiquidity = async (): Promise<void> => {
    setAddingLiquidity(true)
    setTxType('Add liquidity')
    if (amount && lockPeriod && oasisId && prices && prices['00']) {
      // If user has existing position, mark it as pending
      const existingPosition = allUserOasis?.find((o) => o.token.symbol === currency)
      if (existingPosition) {
        setAddingToOasisId(existingPosition.id)
      }

      const response = await oasisObj.user_deposit(
        hathorRpc,
        address,
        lockPeriod,
        oasisId,
        Math.floor(parseFloat(amount) * 100),
        prices['00']
      )

      // Do not clear the addingLiquidity state here - let it be cleared in the useEffect
      // This ensures the loading overlay remains visible until confirmation
    }
  }

  const handleRemoveLiquidity = async (removeAmount: number, removeAmountHtr: number): Promise<void> => {
    if (!selectedOasisForRemove?.id) return
    setTxType('Remove liquidity')

    // Send the transaction first - user will confirm in wallet
    const response = await oasisObj.user_withdraw(
      hathorRpc,
      address,
      selectedOasisForRemove.id,
      removeAmount,
      removeAmountHtr
    )
  }

  const handleRemoveBonus = async (removeAmount: number): Promise<void> => {
    if (!selectedOasisForRemoveBonus?.id) return
    setTxType('Remove bonus')

    // Send the transaction first - user will confirm in wallet
    const response = await oasisObj.user_withdraw_bonus(
      hathorRpc,
      address,
      selectedOasisForRemoveBonus.id,
      removeAmount
    )
  }

  const handleClosePosition = async (): Promise<void> => {
    if (!selectedOasisForClose?.id) return
    setTxType('Close position')

    const response = await oasisObj.close_position(hathorRpc, address, selectedOasisForClose.id)
  }

  // Combined effect for setting hasOptimisticUpdate flag
  useEffect(() => {
    // Set flag based on whether we have pending RPC requests or transactions
    const hasPendingTxs = Object.keys(pendingTransactions).length > 0
    const shouldDisableFetches = isRpcRequestPending || hasPendingTxs

    if (shouldDisableFetches !== hasOptimisticUpdate) {
      setHasOptimisticUpdate(shouldDisableFetches)
    }
  }, [isRpcRequestPending, pendingTransactions, hasOptimisticUpdate])
  // Monitor block changes to clear loading states and update positions when transactions are confirmed
  // Use a ref to track the previous block height to avoid unnecessary updates
  const prevBlockHeightRef = useRef<number>(0)

  useEffect(() => {
    // Only proceed if we have a valid block height and it has changed
    if (currentBlockHeight > 0 && currentBlockHeight !== prevBlockHeightRef.current) {
      prevBlockHeightRef.current = currentBlockHeight

      // If there was an optimistic update, now we can safely fetch the real data
      if (hasOptimisticUpdate && Object.keys(pendingTransactions).length > 0) {
        // We shouldn't reset optimistic updates too quickly - only after a block change
        // First, identify if we should be clearing any pending transactions
        const pendingTxs = { ...pendingTransactions }
        let shouldClearUpdates = false

        // Logic to determine if we should clear updates - could be based on time since tx creation
        // For now, we'll use a simple approach - clear after any block change
        if (Object.keys(pendingTxs).length > 0) {
          shouldClearUpdates = true
        }

        if (shouldClearUpdates) {
          // Clear any pending transactions
          setPendingTransactions({})

          // Reset optimistic update flag to allow refetching
          setHasOptimisticUpdate(false)

          // Re-fetch user's positions to get the updated blockchain data
          if (address) {
            utils.getOasis.allUser.invalidate({ address })
          }
        }
      }

      // Clear loading states when the block changes
      if (addingLiquidity || addingToOasisId) {
        setAddingLiquidity(false)
        setAddingToOasisId('')
      }
    }
  }, [currentBlockHeight, address, hasOptimisticUpdate, pendingTransactions])

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result) {
      if (oasisId || selectedOasisForRemove || selectedOasisForRemoveBonus || selectedOasisForClose) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          // For add liquidity and close position, create a standard notification
          if (txType === 'Add liquidity' || txType === 'Close position') {
            const notificationData: NotificationData = {
              type: 'swap',
              chainId: network,
              summary: {
                pending: `Waiting for next block. ${txType} in ${oasisName} Oasis pool.`,
                completed: `${txType} in ${oasisName} Oasis pool.`,
                failed: 'Failed summary',
                info: `${txType} in ${oasisName} Oasis pool: ${amount} ${token}.`,
              },
              status: 'pending',
              txHash: hash,
              groupTimestamp: Math.floor(Date.now() / 1000),
              timestamp: Math.floor(Date.now() / 1000),
              promise: new Promise((resolve) => {
                setTimeout(resolve, 500)
              }),
              account: address,
            }
            const notificationGroup: string[] = []
            notificationGroup.push(JSON.stringify(notificationData))
            addNotification(notificationGroup)
            createSuccessToast(notificationData)
          }

          // Close all modals
          setAddModalOpen(false)
          setRemoveModalOpen(false)
          setRemoveBonusModalOpen(false)
          setClosePositionModalOpen(false)

          // For add liquidity transactions
          if (txType == 'Add liquidity') {
            // Check if user already has a position with this token
            const existingPosition = allUserOasis?.find((o) => o.token.symbol === currency)

            if (existingPosition) {
              // Apply optimistic update for existing position
              utils.getOasis.allUser.setData(
                { address: address },
                (currentData) =>
                  editOasisOnAdd(
                    currentData,
                    existingPosition.id,
                    parseFloat(amount),
                    bonus,
                    htrMatch,
                    unlockDate,
                    prices ? prices['00'] : 0
                  ) as typeof currentData
              )

              // Set flag to prevent auto-refetching while showing optimistic update
              setHasOptimisticUpdate(true)

              // Track this transaction
              setPendingTransactions((prev) => ({
                ...prev,
                [hash]: true,
              }))
              // We don't need to use pendingPositions anymore - we directly update the UI data
            } else {
              // For creating a new position with optimistic updates
              const newPosition: OasisInterface = {
                id: `pending-${hash}`,
                token: { symbol: currency, uuid: oasis?.token.uuid || '' },
                user_deposit_b: depositAmount, // Use depositAmount from the API response
                user_balance_a: bonus, // Use bonus from the API response
                user_withdrawal_time: unlockDate, // Use withdrawal_time from the API response
                max_withdraw_htr: bonus, // HTR matched + bonus
                max_withdraw_b: depositAmount, // Use depositAmount from the API response
                user_lp_htr: htrMatch, // htr_amount from the API response
                user_lp_b: depositAmount, // Use depositAmount for LP tokens
                htr_price_in_deposit: prices ? prices['00'] : 0, // Current HTR price
                token_price_in_htr_in_deposit: prices ? prices['00'] : 0, // Calculate token price in HTR
                position_closed: false,
              }

              // Add position directly to allUserOasis data via optimistic update
              utils.getOasis.allUser.setData({ address: address }, (currentData) => {
                // Make sure we maintain the same data shape by casting
                return [...(currentData || []), newPosition] as typeof currentData
              })

              // Set flag to prevent auto-refetching
              setHasOptimisticUpdate(true)

              // Track this transaction
              setPendingTransactions((prev) => ({
                ...prev,
                [hash]: true,
              }))
              setAddingLiquidity(false)
            }
          }

          // Handle withdraw bonus operation
          if (txType == 'Remove bonus' && selectedOasisForRemoveBonus) {
            // Close modal immediately
            setRemoveBonusModalOpen(false)

            // Create notification for block confirmation
            const notificationData: NotificationData = {
              type: 'swap',
              chainId: network,
              summary: {
                pending: `Waiting for next block. Withdrawing bonus from ${oasisName} Oasis pool.`,
                completed: `Successfully withdrew bonus from ${oasisName} Oasis pool.`,
                failed: 'Failed to withdraw bonus.',
                info: `Withdrew bonus from ${oasisName} Oasis pool.`,
              },
              status: 'pending',
              txHash: hash,
              groupTimestamp: Math.floor(Date.now() / 1000),
              timestamp: Math.floor(Date.now() / 1000),
              promise: new Promise((resolve) => {
                setTimeout(resolve, 500)
              }),
              account: address,
            }

            // Add notification to notification center
            const notificationGroup: string[] = []
            notificationGroup.push(JSON.stringify(notificationData))
            addNotification(notificationGroup)

            // Create success toast with appropriate message
            createSuccessToast({
              ...notificationData,
              status: 'completed',
              summary: {
                ...notificationData.summary,
                completed: 'Successfully withdrew bonus! (Processing on blockchain)',
              },
            })

            // Important: Update the data in the local state for immediate UI feedback
            utils.getOasis.allUser.setData(
              { address: address },
              (currentData) =>
                editOasisBonusOnWithdraw(currentData, selectedOasisForRemoveBonus.id) as typeof currentData
            )

            // Set flag to prevent auto-refetching while showing optimistic update
            setHasOptimisticUpdate(true)

            // Track this transaction
            setPendingTransactions((prev) => ({
              ...prev,
              [hash]: true,
            }))
          }

          if (txType == 'Remove liquidity' && selectedOasisForRemove) {
            // Close modal immediately
            setRemoveModalOpen(false)

            // Create notification for block confirmation
            const notificationData: NotificationData = {
              type: 'swap',
              chainId: network,
              summary: {
                pending: `Waiting for next block. Withdrawing position from ${oasisName} Oasis pool.`,
                completed: `Successfully withdrew position from ${oasisName} Oasis pool.`,
                failed: 'Failed to withdraw position.',
                info: `Withdrew position from ${oasisName} Oasis pool.`,
              },
              status: 'pending',
              txHash: hash,
              groupTimestamp: Math.floor(Date.now() / 1000),
              timestamp: Math.floor(Date.now() / 1000),
              promise: new Promise((resolve) => {
                setTimeout(resolve, 500)
              }),
              account: address,
            }

            // Add notification to notification center
            const notificationGroup: string[] = []
            notificationGroup.push(JSON.stringify(notificationData))
            addNotification(notificationGroup)

            // Create success toast with appropriate message
            createSuccessToast({
              ...notificationData,
              status: 'completed',
              summary: {
                ...notificationData.summary,
                completed: 'Successfully withdrew position! (Processing on blockchain)',
              },
            })

            // Important: Update the data in the local state for immediate UI feedback
            utils.getOasis.allUser.setData(
              { address: address },
              (currentData) => editOasisOnWithdraw(currentData, selectedOasisForRemove.id) as typeof currentData
            )

            // Set flag to prevent auto-refetching while showing optimistic update
            setHasOptimisticUpdate(true)

            // Track this transaction
            setPendingTransactions((prev) => ({
              ...prev,
              [hash]: true,
            }))
          }

          if (txType == 'Close position' && selectedOasisForClose) {
            // Apply optimistic update for position closing
            utils.getOasis.allUser.setData(
              { address: address },
              (currentData) => editOasisOnClose(currentData, selectedOasisForClose.id) as typeof currentData
            )

            // Set flag to prevent auto-refetching while showing optimistic update
            setHasOptimisticUpdate(true)

            // Track this transaction
            setPendingTransactions((prev) => ({
              ...prev,
              [hash]: true,
            }))
          }
        } else {
          createErrorToast(`Error`, true)
          setAddModalOpen(false)
          setAddingLiquidity(false)
          setAddingToOasisId('')
        }
      }
    }
  }, [rpcResult])

  useEffect(() => {
    const fetchData = async () => {
      setFetchLoading(true)
      const response =
        amount && lockPeriod && oasisId
          ? await utils.getOasis.getFrontQuoteLiquidityIn.fetch({
              id: oasisId,
              amount_in: Math.floor(parseFloat(amount) * 100),
              timelock: lockPeriod,
              now: Math.floor(Date.now()),
              address: address || 'WZhKusv57pvzotZrf4s7yt7P7PXEqyFTHk',
            })
          : {
              bonus: 0,
              htr_amount: 0,
              withdrawal_time: new Date(),
              has_position: false,
              deposit_amount: 0,
            }

      return response
    }

    // call the function
    if (amount && oasisId) {
      fetchData()
        .then((response) => {
          setFetchLoading(false)
          setHtrMatch(response['htr_amount'])
          setUnlockDate(response['withdrawal_time'])
          setBonus(response['bonus'])
          setHasPosition(response['has_position'])
          setDepositAmount(response['deposit_amount'])
        })
        // make sure to catch any error
        .catch((err) => {
          console.error(err)
          setFetchLoading(false)
        })
    } else {
      setHtrMatch(0)
      setUnlockDate(new Date())
      setBonus(0)
      setDepositAmount(0)
      setHasPosition(false)
    }
  }, [amount, lockPeriod])

  return (
    <div className="relative min-h-screen">
      <BlockTracker client={api} className="z-50" />
      <div className="fixed inset-0 z-0">
        <Image
          src={backgroundOasis}
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          priority
          className="opacity-50"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      <div className="relative z-10 min-h-screen px-4 py-2 lg:mx-8 lg:my-4 bg-black/80">
        {/* Title Section */}
        <div className="flex flex-col items-center pt-6 mb-4 lg:pt-10 lg:mb-16">
          <h1 className="relative z-20 text-6xl font-bold text-center text-white sm:text-7xl lg:text-9xl">OASIS</h1>
          <div className="w-full max-w-[40rem] relative px-4">
            <div className="absolute w-full sm:w-3/4 h-[2px] left-1/2 -translate-x-1/2 top-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            </div>
          </div>
          <Typography variant="lg" className="mt-8 text-center text-stone-400">
            The Official Hathor Liquidity Incentive program
          </Typography>
        </div>

        <LayoutGroup>
          {/* Main Content */}
          <motion.div layout className={`w-full mx-auto ${showChart ? 'px-0' : 'max-w-[1200px]'}`}>
            {/* Info Cards and Main Layout */}
            <motion.div
              layout
              className={`flex flex-col lg:${
                showChart ? 'flex flex-col max-w-[1400px] mx-auto px-6' : 'grid grid-cols-[300px_520px_320px]'
              } gap-6 lg:gap-10`}
            >
              <motion.div
                className={`${
                  showChart
                    ? 'grid grid-cols-1 lg:grid-cols-3 gap-4 col-span-full mb-6'
                    : 'flex flex-col col-start-1 order-2 lg:order-none space-y-6'
                }`}
              >
                {/* Card 1 */}
                <motion.div layout className="p-4 rounded-xl bg-[rgba(0,0,0,0.4)] border border-stone-800">
                  <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                    1. Equal HTR Matching
                  </Typography>
                  <Typography variant="sm" className="text-stone-400">
                    For every $1 worth of tokens you provide, Oasis will match with $1 worth of HTR, doubling the
                    effective liquidity you provide to the pool.
                  </Typography>
                </motion.div>

                {/* Card 2 */}
                <motion.div layout className="p-4 rounded-xl bg-[rgba(0,0,0,0.4)] border border-stone-800">
                  <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                    2. Instant Bonus
                  </Typography>
                  <Typography variant="sm" className="text-stone-400">
                    Get an immediate upfront payment of up to 20% of your deposit value in HTR, depending on your chosen
                    lock period.
                  </Typography>
                </motion.div>

                {/* Card 3 */}
                <motion.div layout className="p-4 rounded-xl bg-[rgba(0,0,0,0.4)] border border-stone-800">
                  <Typography variant="lg" weight={500} className="mb-2 text-yellow">
                    3. IL Protection
                  </Typography>
                  <Typography variant="sm" className="text-stone-400">
                    Your deposit is protected against impermanent loss up to a 4x price difference between HTR and your
                    deposited token.
                  </Typography>
                </motion.div>

                {/* Mobile Learn More Button */}
                <div className="flex flex-col gap-4 lg:hidden">
                  <Link href="https://docs.dozer.finance/oasis" target="_blank">
                    <Button
                      variant="outlined"
                      className="w-full border text-yellow hover:text-yellow-600 border-yellow"
                    >
                      <Typography variant="sm" className="text-nowrap" weight={500}>
                        Learn More
                      </Typography>
                      <ArrowTopRightOnSquareIcon width={16} height={16} className="ml-2 text-yellow" />
                    </Button>
                  </Link>
                </div>

                {/* Desktop Buttons */}
                <motion.div
                  layout
                  className={`${
                    showChart ? 'flex flex-row justify-center col-span-full gap-4' : 'flex flex-col gap-4'
                  } `}
                >
                  <Link href="https://docs.dozer.finance/oasis" target="_blank">
                    <Button
                      variant="outlined"
                      className="justify-center hidden w-full border lg:flex text-yellow hover:text-yellow-600 border-yellow"
                    >
                      <Typography variant="sm" className="text-nowrap" weight={500}>
                        Learn More
                      </Typography>
                      <ArrowTopRightOnSquareIcon width={16} height={16} className="ml-2 text-yellow" />
                    </Button>
                  </Link>
                  <Button
                    variant="outlined"
                    className="justify-center hidden border lg:flex text-yellow hover:text-yellow-600 border-yellow"
                    onClick={() => setShowChart(!showChart)}
                  >
                    <Typography variant="sm" weight={500}>
                      {showChart ? 'Hide Simulation' : 'Simulate Gains'}
                    </Typography>
                    <ChartBarIcon width={16} height={16} className="ml-2 text-yellow" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Input Form and Chart */}
              <motion.div
                className={`${
                  showChart
                    ? 'grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 items-start'
                    : 'order-1 lg:order-none col-start-2 w-full lg:w-[520px]'
                }`}
              >
                {/* Input Form */}
                <motion.div layout className="w-full">
                  <Widget id="oasisInput" maxWidth="full" className="py-5 mb-4">
                    <Widget.Content>
                      <div className="grid ">
                        <div className="flex flex-col gap-2">
                          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                            <div>
                              <div className="flex items-center gap-4 mb-6 ml-4 sm:gap-6 sm:ml-8">
                                <Tab
                                  className={({ selected }) =>
                                    classNames(
                                      'transition-colors duration-200 font-medium !outline-none text-sm sm:text-base',
                                      selected
                                        ? 'text-yellow border-b-2 border-yellow'
                                        : 'text-stone-500 hover:text-stone-200'
                                    )
                                  }
                                >
                                  Deposit Now
                                </Tab>
                                <Tab
                                  className={({ selected }) =>
                                    classNames(
                                      'transition-colors duration-200 font-medium !outline-none',
                                      selected
                                        ? 'text-yellow border-b-2 border-yellow'
                                        : 'text-stone-500 hover:text-stone-200'
                                    )
                                  }
                                >
                                  My Position
                                </Tab>
                              </div>

                              <Tab.Panels>
                                <Tab.Panel>
                                  <div className="flex flex-col gap-4 px-4 sm:px-8">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-2 justify-items-end">
                                      <div className="flex flex-col flex-1 gap-2">
                                        <Typography variant="sm" className="text-stone-400">
                                          Amount to lock
                                        </Typography>
                                        <div className="h-[51px] relative">
                                          <Input.Numeric
                                            value={amount}
                                            ref={inputRef}
                                            onUserInput={(val) => setAmount(val)}
                                            className="h-full pl-3 text-2xl"
                                          />
                                          <div className="absolute flex items-center -translate-y-1/2 right-4 top-1/2">
                                            <PricePanel
                                              amount={amount}
                                              tokenSymbol={token}
                                              prices={prices || {}}
                                              loading={fetchLoading}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col w-full sm:w-[180px] gap-2">
                                        <Typography variant="sm" className="text-stone-400">
                                          Choose token
                                        </Typography>

                                        <Select
                                          value={token}
                                          onChange={(val: string) => {
                                            if (val == 'hUSDC') setTokenPriceChange(0)

                                            setToken(val as string)
                                          }}
                                          button={
                                            <Select.Button>
                                              <div className="flex flex-row items-center flex-grow gap-4 mr-8">
                                                <div className="flex-shrink-0 w-7 h-7">
                                                  <Icon
                                                    key={currency}
                                                    currency={toToken(
                                                      oasis ? oasis.token : { symbol: currency, uuid: '00' }
                                                    )}
                                                    width={28}
                                                    height={28}
                                                  />
                                                </div>
                                                <div className="flex flex-col items-start min-w-0">
                                                  <Typography
                                                    variant="sm"
                                                    weight={500}
                                                    className="truncate text-stone-200 group-hover:text-stone-50"
                                                  >
                                                    {token}
                                                  </Typography>
                                                </div>
                                              </div>
                                            </Select.Button>
                                          }
                                        >
                                          <Select.Options>
                                            <Select.Option value="hUSDC">
                                              <TokenOption token={{ symbol: 'hUSDC', uuid: '00' }} />
                                            </Select.Option>
                                            <Select.Option disabled value="hETH">
                                              <TokenOption disabled token={{ symbol: 'hETH', uuid: '00' }} />
                                            </Select.Option>
                                            <Select.Option disabled value="hBTC">
                                              <TokenOption disabled token={{ symbol: 'hBTC', uuid: '00' }} />
                                            </Select.Option>
                                          </Select.Options>
                                        </Select>
                                      </div>
                                    </div>
                                    {/* {showChart && (
                                      <div
                                        className="relative"
                                        onMouseEnter={() => setHover(true)}
                                        onMouseLeave={() => setHover(false)}
                                      >
                                        <Transition
                                          show={Boolean(hover && token == 'hUSDC')}
                                          as={Fragment}
                                          enter="transition duration-300 origin-center ease-out"
                                          enterFrom="transform opacity-0"
                                          enterTo="transform opacity-100"
                                          leave="transition duration-75 ease-out"
                                          leaveFrom="transform opacity-100"
                                          leaveTo="transform opacity-0"
                                        >
                                          <div className="py-6 border border-stone-200/5 flex justify-center items-center z-[100] absolute inset-0 backdrop-blur bg-black bg-opacity-[0.24] ">
                                            <Typography
                                              variant="xs"
                                              weight={600}
                                              className="bg-white bg-opacity-[0.12] rounded-full p-2 px-3"
                                            >
                                              hUSDC has no price change
                                            </Typography>
                                          </div>
                                        </Transition>
                                        <div className="flex flex-col w-full gap-2">
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              {currency} Price Change
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              {tokenPriceChange.toFixed(2)}%
                                            </Typography>
                                          </div>
                                          <Slider
                                            value={[tokenPriceChange]}
                                            onValueChange={(vals: number[]) => {
                                              if (token !== 'hUSDC') setTokenPriceChange(vals[0])
                                            }}
                                            min={-100}
                                            max={100}
                                            step={1}
                                            className="w-full"
                                          />
                                        </div>
                                      </div>
                                    )} */}

                                    <div className="flex flex-col gap-2">
                                      <Typography variant="sm" className="text-stone-400">
                                        Lock up time
                                      </Typography>
                                      <Select
                                        value={lockPeriod.toString()}
                                        onChange={(val: string) => setLockPeriod(Number(val))}
                                        button={
                                          <Select.Button>
                                            {lockPeriod} minutes - Bonus {(bonusRate * 100).toFixed(2)}%
                                          </Select.Button>
                                        }
                                      >
                                        <Select.Options>
                                          <Select.Option value="6">6 minutes - Bonus 10.00%</Select.Option>
                                          <Select.Option value="9">9 minutes - Bonus 15.00%</Select.Option>
                                          <Select.Option value="12">12 minutes - Bonus 20.00%</Select.Option>
                                        </Select.Options>
                                      </Select>
                                    </div>

                                    <div className="p-4 mt-2 sm:mt-4 bg-stone-800 rounded-xl">
                                      {fetchLoading ? (
                                        <div className="hidden gap-4 lg:flex lg:flex-col">
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              Amount deposited
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              -
                                            </Typography>
                                          </div>
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              Bonus you'll get now
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              -
                                            </Typography>
                                          </div>
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              HTR matched
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              -
                                            </Typography>
                                          </div>
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              Unlock date
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              -
                                            </Typography>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={`flex flex-col gap-4`}>
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              Amount deposited
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              {amount ? `${depositAmount.toFixed(2)} ${currency}` : '-'}
                                            </Typography>
                                          </div>
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              Bonus you'll get now
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              {amount ? `${bonus.toFixed(2)} HTR` : '-'}
                                            </Typography>
                                          </div>
                                          <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              HTR matched
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              {amount ? `${htrMatch.toFixed(2)} HTR` : '-'}
                                            </Typography>
                                          </div>
                                          <div className="flex justify-between">
                                            <div className="flex flex-row gap-1">
                                              <Typography variant="sm" className="text-stone-400">
                                                Unlock date
                                              </Typography>
                                              {hasPosition && (
                                                <Tooltip
                                                  panel={
                                                    <Typography variant="xs">
                                                      User already have a position in Oasis, unlock date is calculated
                                                      based on the last deposit and time remaining
                                                    </Typography>
                                                  }
                                                  button={
                                                    <InformationCircleIcon
                                                      width={16}
                                                      height={16}
                                                      className="mt-0.5 text-sm text-yellow-500 "
                                                    />
                                                  }
                                                >
                                                  <></>
                                                </Tooltip>
                                              )}
                                            </div>
                                            <Typography variant="sm" className="text-yellow">
                                              {amount
                                                ? `${unlockDate.toLocaleDateString()} ${unlockDate.toLocaleTimeString()}`
                                                : '-'}
                                            </Typography>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <Checker.Connected fullWidth size="md">
                                      <Checker.Amounts
                                        fullWidth
                                        size="md"
                                        amount={Number(amount)}
                                        token={new Token({ chainId: ChainId.HATHOR, uuid: tokenUuid, decimals: 2 })}
                                      >
                                        <div className="flex flex-col justify-between gap-2">
                                          <Button
                                            size="md"
                                            disabled={isRpcRequestPending || !prices || !prices['00']}
                                            fullWidth
                                            onClick={() => setAddModalOpen(true)}
                                          >
                                            {isRpcRequestPending ? (
                                              <Dots>Confirm transaction in your wallet</Dots>
                                            ) : (
                                              <>Add Liquidity</>
                                            )}
                                          </Button>
                                        </div>
                                      </Checker.Amounts>
                                    </Checker.Connected>
                                  </div>
                                </Tab.Panel>

                                <Tab.Panel>
                                  <div className="flex flex-col gap-4 px-8">
                                    {/* No need for debug info or pending positions sections anymore - all handled through allUserOasis */}

                                    {/* No active positions message */}
                                    {!address ? (
                                      <div className="text-center">
                                        <Typography
                                          variant="xl"
                                          className="my-8 rounded-xl bg-stone-700/20 py-36 text-stone-300"
                                        >
                                          Please connect your wallet to view your positions.
                                        </Typography>
                                        <Checker.Connected fullWidth size="md">
                                          <div />
                                        </Checker.Connected>
                                      </div>
                                    ) : allUserOasis?.length === 0 ? (
                                      <div className="text-center">
                                        <Typography
                                          variant="xl"
                                          className="my-8 rounded-xl bg-stone-700/20 py-36 text-stone-300"
                                        >
                                          No active positions.
                                        </Typography>
                                        <Button fullWidth size="md" onClick={() => setSelectedTab(0)}>
                                          Deposit now
                                        </Button>
                                      </div>
                                    ) : (
                                      <div>
                                        {allUserOasis?.map((oasis: OasisInterface) => (
                                          <UserOasisPosition
                                            address={address}
                                            currentBlockHeight={currentBlockHeight}
                                            oasis={oasis}
                                            key={oasis.id}
                                            prices={prices || {}}
                                            isRpcRequestPending={isRpcRequestPending}
                                            setSelectedTab={setSelectedTab}
                                            buttonClosePosition={
                                              <Button
                                                size="md"
                                                fullWidth
                                                color="gray"
                                                disabled={isRpcRequestPending}
                                                onClick={() => {
                                                  setSelectedOasisForClose(oasis)
                                                  setClosePositionModalOpen(true)
                                                }}
                                              >
                                                Close Position
                                              </Button>
                                            }
                                            buttonWithdraw={
                                              <Button
                                                size="md"
                                                color="gray"
                                                fullWidth
                                                disabled={isRpcRequestPending}
                                                onClick={() => {
                                                  setSelectedOasisForRemove(oasis)
                                                  setRemoveModalOpen(true)
                                                }}
                                              >
                                                Withdraw Position
                                              </Button>
                                            }
                                            buttonWithdrawBonus={
                                              <Button
                                                size="md"
                                                fullWidth
                                                variant="outlined"
                                                disabled={isRpcRequestPending || oasis.user_balance_a <= 0}
                                                onClick={() => {
                                                  setSelectedOasisForRemoveBonus(oasis)
                                                  setRemoveBonusModalOpen(true)
                                                }}
                                              >
                                                Withdraw Bonus
                                              </Button>
                                            }
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </Tab.Panel>
                              </Tab.Panels>
                            </div>
                          </Tab.Group>
                        </div>
                      </div>
                    </Widget.Content>
                  </Widget>

                  {/* Reserve Info Box */}
                  <motion.div layout className="p-4 my-6 rounded-lg ">
                    <Typography className="mb-2 text-stone-200">Bonus Reserve</Typography>
                    <div className="relative h-[30px] w-full overflow-hidden rounded-md">
                      <div className="absolute inset-0 bg-[rgba(255,255,255,0.12)] ring-1 ring-yellow-500" />
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden rounded-md"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="h-full bg-gradient-to-r from-green-700 via-emerald-500 to-green-800 " />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <Typography variant="base" weight={600} className="text-white drop-shadow-md">
                          {availableHTR.toLocaleString()} HTR
                        </Typography>
                        <Typography variant="sm" className="text-white drop-shadow-md">
                          ${(availableHTR * (prices ? prices['00'] : 0)).toLocaleString()}
                        </Typography>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Chart Section */}
                {/* <AnimatePresence mode="wait"> */}
                {showChart && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full col-span-full lg:col-span-1 h-[670px] bg-stone-800/50 rounded-lg overflow-hidden relative p-4 mb-4 order-last"
                  >
                    <OasisChart
                      liquidityValue={Number(amount || 1)}
                      initialPrices={initialPrices}
                      bonusRate={bonusRate}
                      holdPeriod={lockPeriod}
                      currency={currency}
                      tokenPriceChange={tokenPriceChange}
                    />
                  </motion.div>
                )}
                {/* </AnimatePresence> */}
              </motion.div>
            </motion.div>
          </motion.div>
        </LayoutGroup>
      </div>

      <OasisAddModal
        open={addModalOpen}
        setOpen={setAddModalOpen}
        amount={depositAmount.toFixed(2)}
        token={currency}
        bonus={bonus}
        htrMatch={htrMatch}
        unlockDate={unlockDate}
        onConfirm={handleAddLiquidity}
        isRpcRequestPending={isRpcRequestPending}
        onReset={reset}
      />

      <OasisRemoveModal
        open={removeModalOpen}
        setOpen={setRemoveModalOpen}
        oasis={selectedOasisForRemove}
        onConfirm={handleRemoveLiquidity}
        isRpcRequestPending={isRpcRequestPending}
        onReset={reset}
      />

      <OasisRemoveBonusModal
        open={removeBonusModalOpen}
        setOpen={setRemoveBonusModalOpen}
        oasis={selectedOasisForRemoveBonus}
        onConfirm={handleRemoveBonus}
        isRpcRequestPending={isRpcRequestPending}
        onReset={reset}
      />

      <OasisClosePositionModal
        open={closePositionModalOpen}
        setOpen={setClosePositionModalOpen}
        oasis={selectedOasisForClose}
        onConfirm={handleClosePosition}
        isRpcRequestPending={isRpcRequestPending}
        onReset={reset}
      />
    </div>
  )
}

export default OasisProgram
