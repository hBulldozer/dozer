import { FC, useEffect, useState } from 'react'
import { Button, createErrorToast, createSuccessToast, Dots, NotificationData, Typography } from '@dozer/ui'
import { Currency } from '@dozer/ui'
import { Checker, useJsonRpc, useWalletConnectClient, getErrorMessage } from '@dozer/higmi'
import { formatUSD } from '@dozer/format'
import { Pair, toToken } from '@dozer/api'
import { usePoolPosition } from '../PoolPositionProvider'
import { useAccount, useNetwork } from '@dozer/zustand'
import { PoolManager } from '@dozer/nanocontracts'
import { api } from '../../utils/api'
import { get } from 'lodash'

interface PoolCashbackSectionProps {
  pair: Pair
  prices: { [key: string]: number }
}

export const PoolCashbackSection: FC<PoolCashbackSectionProps> = ({ pair, prices }) => {
  const { balanceA, balanceB } = usePoolPosition()
  const { walletType, hathorAddress, addNotification, selectedNetwork } = useAccount()
  const { accounts } = useWalletConnectClient()
  const { network } = useNetwork()
  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()
  const utils = api.useUtils()

  const [sentTX, setSentTX] = useState(false)

  const address =
    walletType === 'walletconnect' ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') : hathorAddress || ''

  const token0 = toToken(pair.token0)
  const token1 = toToken(pair.token1)

  // balanceA/B come from the contract in cents (integer), divide by 100 for display
  const amountA = (balanceA ?? 0) / 100
  const amountB = (balanceB ?? 0) / 100

  const valueA = amountA * (prices[pair.token0.uuid] ?? 0)
  const valueB = amountB * (prices[pair.token1.uuid] ?? 0)
  const totalUSD = valueA + valueB

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      const hash = get(rpcResult, 'result.response.hash') as string
      if (hash) {
        const claimedParts: string[] = []
        if (amountA > 0) claimedParts.push(`${amountA.toFixed(2)} ${pair.token0.symbol}`)
        if (amountB > 0) claimedParts.push(`${amountB.toFixed(2)} ${pair.token1.symbol}`)
        const claimedStr = claimedParts.join(' and ')

        const notificationData: NotificationData = {
          type: 'swap',
          chainId: network,
          summary: {
            pending: `Claiming cashback from ${pair.name}.`,
            completed: `Claimed ${claimedStr} from ${pair.name}.`,
            failed: 'Failed to claim cashback.',
            info: `Claiming cashback from ${pair.name}: ${claimedStr}.`,
          },
          status: 'pending',
          txHash: hash,
          groupTimestamp: Math.floor(Date.now() / 1000),
          timestamp: Math.floor(Date.now() / 1000),
          promise: new Promise((resolve) => setTimeout(resolve, 500)),
          account: address,
        }

        const notificationGroup: string[] = [JSON.stringify(notificationData)]
        addNotification(notificationGroup)
        createSuccessToast(notificationData)
        setSentTX(false)

        // Refetch after a short delay to give the node time to reflect the
        // confirmed TX, then the card will hide itself once balances are zero.
        setTimeout(() => {
          utils.getProfile.userPositionByPool.invalidate({ address, poolKey: pair.id })
        }, 2000)
      } else {
        createErrorToast('Error claiming cashback', true)
        setSentTX(false)
      }
    }
  }, [rpcResult])

  const handleClaim = async () => {
    if (!address || isRpcRequestPending) return
    setSentTX(true)
    try {
      const poolManager = new PoolManager()
      await poolManager.withdrawCashback(
        hathorRpc,
        address,
        pair.id,
        pair.token0.uuid,
        amountA,
        pair.token1.uuid,
        amountB,
        selectedNetwork,
      )
    } catch (error) {
      console.error('Error claiming cashback:', error)
      createErrorToast(getErrorMessage(error), true)
      setSentTX(false)
    }
  }

  // Don't render if no cashback
  if (amountA === 0 && amountB === 0) return null

  return (
    <div className="flex flex-col shadow-md bg-stone-800 rounded-2xl shadow-black/30">
      {/* Header — title + inline claim button + total value */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200/5">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm">✦</span>
          <Typography weight={600} className="text-stone-50">
            Cashback Available
          </Typography>
        </div>
        <div className="flex items-center gap-3">
          <Checker.Connected size="xs">
            <Button
              size="xs"
              variant="outlined"
              color="yellow"
              onClick={handleClaim}
              disabled={isRpcRequestPending}
            >
              {isRpcRequestPending ? <Dots>Claiming</Dots> : 'Claim'}
            </Button>
          </Checker.Connected>
          <Typography variant="sm" weight={600} className="text-yellow-400">
            {formatUSD(totalUSD)}
          </Typography>
        </div>
      </div>

      {/* Token rows */}
      <div className="flex flex-col gap-3 px-5 py-4">
        {amountA > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token0} width={20} height={20} />
              <Typography variant="sm" weight={600} className="text-stone-300">
                {amountA.toFixed(2)} {pair.token0.symbol}
              </Typography>
            </div>
            <Typography variant="xs" className="text-stone-400">
              {formatUSD(valueA)}
            </Typography>
          </div>
        )}
        {amountB > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Currency.Icon currency={token1} width={20} height={20} />
              <Typography variant="sm" weight={600} className="text-stone-300">
                {amountB.toFixed(2)} {pair.token1.symbol}
              </Typography>
            </div>
            <Typography variant="xs" className="text-stone-400">
              {formatUSD(valueB)}
            </Typography>
          </div>
        )}

        {/* Pending state footer — only shown while waiting for wallet confirmation */}
        {isRpcRequestPending && (
          <div className="flex flex-col gap-2 pt-1 border-t border-stone-200/5">
            <Typography variant="xs" className="text-center text-stone-400">
              This may take up to 20 seconds when using MetaMask Snap
            </Typography>
            <Button
              size="sm"
              fullWidth
              variant="outlined"
              color="red"
              onClick={() => {
                reset()
                setSentTX(false)
              }}
            >
              Cancel Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
