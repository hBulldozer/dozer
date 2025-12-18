import React, { useEffect, useState, useRef } from 'react'
import {
  Widget,
  Select,
  Input,
  Button,
  Typography,
  classNames,
  NotificationData,
  createSuccessToast,
  createErrorToast,
  Dots,
  Tooltip,
} from '@dozer/ui'
import Image from 'next/legacy/image'
import { Token } from '@dozer/currency'
import { ArrowTopRightOnSquareIcon, ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import backgroundOasis from '../public/background_oasis.jpeg'
import { Tab } from '@headlessui/react'
import { api } from '@dozer/higmi/utils/api'
import { Checker, useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { get } from 'lodash'
import { Oasis } from '@dozer/nanocontracts'
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
import { motion, LayoutGroup } from 'framer-motion'
import Link from 'next/link'
import { OasisChart } from '../components/OasisChart'
import PricePanel from '../components/PricePanel'
import Icon from '@dozer/ui/currency/Icon'
import { toToken } from '@dozer/api'
import UserOasisPosition, { OasisInterface } from '../components/OasisUserPosition'
import { editOasisBonusOnWithdraw, editOasisOnWithdraw, editOasisOnAdd, editOasisOnClose } from '../utils'
import { PRICE_PRECISION } from '@dozer/api/src/router/constants'

const TokenOption = ({ token, disabled }: { token: { symbol: string; uuid: string }; disabled?: boolean }) => {
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
  const { data: prices } = api.getPrices.allUSD.useQuery()
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
  const oasisName = oasis?.token.symbol || ''
  const tokenUuid = oasis?.token.uuid || ''
  const oasisObj = new Oasis(tokenUuid, oasis?.pool_manager || '', oasis?.pool_fee || 100)
  const handleAddLiquidity = async (): Promise<void> => {
    setAddingLiquidity(true)
    setTxType('Add liquidity')
    if (amount && lockPeriod && oasisId && prices && prices['00']) {
      // If user has existing position, mark it as pending
      const existingPosition = allUserOasis?.find((o) => o?.token.symbol === currency)
      if (existingPosition) {
        setAddingToOasisId(existingPosition.id)
      }

      await oasisObj.user_deposit(hathorRpc, address, lockPeriod, oasisId, parseFloat(amount))

      // Do not clear the addingLiquidity state here - let it be cleared in the useEffect
      // This ensures the loading overlay remains visible until confirmation
    }
  }

  const handleRemoveLiquidity = async (removeAmount: number, removeAmountHtr: number): Promise<void> => {
    if (!selectedOasisForRemove?.id) return
    setTxType('Remove liquidity')

    // Send the transaction first - user will confirm in wallet
    await oasisObj.user_withdraw(hathorRpc, address, selectedOasisForRemove.id, removeAmount, removeAmountHtr)
  }

  const handleRemoveBonus = async (removeAmount: number): Promise<void> => {
    if (!selectedOasisForRemoveBonus?.id) return
    setTxType('Remove bonus')

    // Send the transaction first - user will confirm in wallet
    await oasisObj.user_withdraw_bonus(hathorRpc, address, selectedOasisForRemoveBonus.id, removeAmount)
  }

  const handleClosePosition = async (): Promise<void> => {
    if (!selectedOasisForClose?.id) return
    setTxType('Close position')

    await oasisObj.close_position(hathorRpc, address, selectedOasisForClose.id)
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
                pending: `${txType} in ${oasisName} Oasis pool.`,
                completed: `${txType} in ${oasisName} Oasis pool.`,
                failed: 'Failed summary',
                info: `${txType} in ${oasisName} Oasis pool: ${parseFloat(amount).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })} ${token}.`,
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
            const existingPosition = allUserOasis?.find((o) => o?.token.symbol === currency)

            if (existingPosition) {
              // Apply optimistic update for existing position
              utils.getOasis.allUser.setData({ address: address }, (currentData) => {
                const filteredData = (currentData || [])
                  .filter((item) => item !== null)
                  .map(
                    (item) =>
                      ({
                        id: item.id,
                        user_deposit_b: item.user_deposit_b,
                        user_balance_a: item.user_balance_a,
                        user_withdrawal_time: item.user_withdrawal_time,
                        max_withdraw_htr: item.max_withdraw_htr,
                        max_withdraw_b: item.max_withdraw_b,
                        token: item.token,
                        user_lp_htr: item.user_lp_htr,
                        user_lp_b: item.user_lp_b,
                        htr_price_in_deposit: item.htr_price_in_deposit,
                        token_price_in_htr_in_deposit: item.token_price_in_htr_in_deposit,
                        position_closed: item.position_closed,
                        closed_balance_a: item.closed_balance_a,
                        closed_balance_b: item.closed_balance_b,
                      } as OasisInterface)
                  )
                return editOasisOnAdd(
                  filteredData,
                  existingPosition.id,
                  parseFloat(amount),
                  bonus,
                  htrMatch,
                  unlockDate,
                  prices ? prices['00'] : 0
                ) as typeof currentData
              })

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
                htr_price_in_deposit: prices ? prices['00'] * PRICE_PRECISION : 0, // Current HTR price
                token_price_in_htr_in_deposit: prices ? prices[token] * PRICE_PRECISION : 0, // Calculate token price in HTR
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
                pending: `Withdrawing bonus from ${oasisName} Oasis pool.`,
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
            utils.getOasis.allUser.setData({ address: address }, (currentData) => {
              const filteredData = (currentData || [])
                .filter((item) => item !== null)
                .map(
                  (item) =>
                    ({
                      id: item.id,
                      user_deposit_b: item.user_deposit_b,
                      user_balance_a: item.user_balance_a,
                      user_withdrawal_time: item.user_withdrawal_time,
                      max_withdraw_htr: item.max_withdraw_htr,
                      max_withdraw_b: item.max_withdraw_b,
                      token: item.token,
                      user_lp_htr: item.user_lp_htr,
                      user_lp_b: item.user_lp_b,
                      htr_price_in_deposit: item.htr_price_in_deposit,
                      token_price_in_htr_in_deposit: item.token_price_in_htr_in_deposit,
                      position_closed: item.position_closed,
                      closed_balance_a: item.closed_balance_a,
                      closed_balance_b: item.closed_balance_b,
                    } as OasisInterface)
                )
              return editOasisBonusOnWithdraw(filteredData, selectedOasisForRemoveBonus.id) as typeof currentData
            })

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
                pending: `Withdrawing position from ${oasisName} Oasis pool.`,
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
            utils.getOasis.allUser.setData({ address: address }, (currentData) => {
              const filteredData = (currentData || [])
                .filter((item) => item !== null)
                .map(
                  (item) =>
                    ({
                      id: item.id,
                      user_deposit_b: item.user_deposit_b,
                      user_balance_a: item.user_balance_a,
                      user_withdrawal_time: item.user_withdrawal_time,
                      max_withdraw_htr: item.max_withdraw_htr,
                      max_withdraw_b: item.max_withdraw_b,
                      token: item.token,
                      user_lp_htr: item.user_lp_htr,
                      user_lp_b: item.user_lp_b,
                      htr_price_in_deposit: item.htr_price_in_deposit,
                      token_price_in_htr_in_deposit: item.token_price_in_htr_in_deposit,
                      position_closed: item.position_closed,
                      closed_balance_a: item.closed_balance_a,
                      closed_balance_b: item.closed_balance_b,
                    } as OasisInterface)
                )
              return editOasisOnWithdraw(filteredData, selectedOasisForRemove.id) as typeof currentData
            })

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
            utils.getOasis.allUser.setData({ address: address }, (currentData) => {
              const filteredData = (currentData || [])
                .filter((item) => item !== null)
                .map(
                  (item) =>
                    ({
                      id: item.id,
                      user_deposit_b: item.user_deposit_b,
                      user_balance_a: item.user_balance_a,
                      user_withdrawal_time: item.user_withdrawal_time,
                      max_withdraw_htr: item.max_withdraw_htr,
                      max_withdraw_b: item.max_withdraw_b,
                      token: item.token,
                      user_lp_htr: item.user_lp_htr,
                      user_lp_b: item.user_lp_b,
                      htr_price_in_deposit: item.htr_price_in_deposit,
                      token_price_in_htr_in_deposit: item.token_price_in_htr_in_deposit,
                      position_closed: item.position_closed,
                      closed_balance_a: item.closed_balance_a,
                      closed_balance_b: item.closed_balance_b,
                    } as OasisInterface)
                )
              return editOasisOnClose(filteredData, selectedOasisForClose.id) as typeof currentData
            })

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
              amount_in: parseFloat(amount),
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
                showChart ? 'flex flex-col px-6 mx-auto max-w-[1400px]' : 'grid grid-cols-[300px_520px_320px]'
              } gap-6 lg:gap-10`}
            >
              <motion.div
                className={`${
                  showChart
                    ? 'grid grid-cols-1 col-span-full gap-4 mb-6 lg:grid-cols-3'
                    : 'flex flex-col order-2 col-start-1 space-y-6 lg:order-none'
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
                  <Link href="https://docs.dozer.finance/yield-farm-oasis/oasis-overview" target="_blank">
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
                    showChart ? 'flex flex-row col-span-full gap-4 justify-center' : 'flex flex-col gap-4'
                  } `}
                >
                  <Link href="https://docs.dozer.finance/yield-farm-oasis/oasis-overview" target="_blank">
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
                    ? 'grid grid-cols-1 gap-6 items-start lg:grid-cols-[1fr_2fr]'
                    : 'order-1 col-start-2 w-full lg:order-none lg:w-[520px]'
                }`}
              >
                {/* Input Form */}
                <motion.div layout className="w-full">
                  <Widget id="oasisInput" maxWidth="full" className="py-5 mb-4">
                    <Widget.Content>
                      <div className="grid">
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
                                    <div className="flex flex-col gap-4 justify-items-end sm:flex-row sm:gap-2">
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
                                            {/* <Select.Option disabled value="hETH">
                                              <TokenOption disabled token={{ symbol: 'hETH', uuid: '00' }} />
                                            </Select.Option>
                                            <Select.Option disabled value="hBTC">
                                              <TokenOption disabled token={{ symbol: 'hBTC', uuid: '00' }} />
                                            </Select.Option> */}
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
                                            {lockPeriod} months - Bonus {(bonusRate * 100).toFixed(2)}%
                                          </Select.Button>
                                        }
                                      >
                                        <Select.Options>
                                          <Select.Option value="6">6 months - Bonus 10.00%</Select.Option>
                                          <Select.Option value="9">9 months - Bonus 15.00%</Select.Option>
                                          <Select.Option value="12">12 months - Bonus 20.00%</Select.Option>
                                        </Select.Options>
                                      </Select>
                                    </div>

                                    <div className="p-4 mt-2 rounded-xl sm:mt-4 bg-stone-800">
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
                                          {/* <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              HTR matched
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              -
                                            </Typography>
                                          </div> */}
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
                                          {/* <div className="flex justify-between">
                                            <Typography variant="sm" className="text-stone-400">
                                              HTR matched
                                            </Typography>
                                            <Typography variant="sm" className="text-yellow">
                                              {amount ? `${htrMatch.toFixed(2)} HTR` : '-'}
                                            </Typography>
                                          </div> */}
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
                                          className="my-8 py-36 rounded-xl bg-stone-700/20 text-stone-300"
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
                                          className="my-8 py-36 rounded-xl bg-stone-700/20 text-stone-300"
                                        >
                                          No active positions.
                                        </Typography>
                                        <Button fullWidth size="md" onClick={() => setSelectedTab(0)}>
                                          Deposit now
                                        </Button>
                                      </div>
                                    ) : (
                                      <div>
                                        {allUserOasis
                                          ?.filter((oasis): oasis is NonNullable<typeof oasis> => oasis !== null)
                                          .map((oasis) => (
                                            <UserOasisPosition
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
                  <motion.div layout className="p-4 my-6 rounded-lg">
                    <Typography className="mb-2 text-stone-200">Bonus Reserve</Typography>
                    <div className="relative h-[30px] w-full overflow-hidden rounded-md">
                      <div className="absolute inset-0 bg-[rgba(255,255,255,0.12)] ring-1 ring-yellow-500" />
                      <div
                        className="absolute inset-y-0 left-0 overflow-hidden rounded-md"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="h-full bg-gradient-to-r from-green-700 via-emerald-500 to-green-800" />
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
