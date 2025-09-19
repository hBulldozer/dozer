import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData } from '@dozer/ui'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useNetwork, useTempTxStore } from '@dozer/zustand'
import { PoolManager } from '@dozer/nanocontracts'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { api } from '../../utils/api'

interface RemoveSectionReviewModalSingleTokenProps {
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  selectedToken: Type | undefined
  fee: number
  userAddress?: string
  children: ({ setOpen }: { setOpen: (open: boolean) => void }) => ReactNode
}

export const RemoveSectionReviewModalSingleToken: FC<RemoveSectionReviewModalSingleTokenProps> = ({
  chainId,
  token0,
  token1,
  selectedToken,
  fee,
  userAddress,
  children,
}) => {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { network } = useNetwork()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { hathorRpc } = useJsonRpc()
  const addTempTx = useTempTxStore((state) => state.addTempTx)
  const poolManager = new PoolManager()
  const { data: networkData } = api.getNetwork.getBestBlock.useQuery()

  // Fetch quote for the modal
  const { data: quoteData } = api.getPools.quoteSingleTokenRemoval.useQuery(
    {
      address: userAddress || address,
      tokenA: token0?.uuid || '',
      tokenB: token1?.uuid || '',
      tokenOut: selectedToken?.uuid || '',
      fee: fee,
    },
    {
      enabled: !!userAddress && !!selectedToken && !!token0 && !!token1 && open,
      refetchInterval: 5000,
    }
  )

  const formatAmount = (amount: number) => {
    return amount.toFixed(6).replace(/\\.?0+$/, '')
  }

  const handleRemoveLiquidity = async () => {
    if (!quoteData || !selectedToken || !networkData || !address) return

    setIsSubmitting(true)
    try {
      const response = await poolManager.removeLiquiditySingleToken(
        hathorRpc,
        address,
        selectedToken.uuid,
        fee * 10 // Convert fee to basis points
      )

      if (response.response && typeof response.response === 'object' && 'hash' in response.response) {
        createSuccessToast({
          type: 'approval',
          chainId: chainId,
          summary: {
            pending: `Removing liquidity and receiving ${selectedToken.symbol}...`,
            completed: `Successfully removed liquidity and received ${formatAmount(quoteData.amount_out)} ${
              selectedToken.symbol
            }`,
            failed: 'Failed to remove liquidity',
          },
          status: 'completed',
          txHash: response.response.hash || '',
          timestamp: Math.floor(Date.now() / 1000),
          groupTimestamp: Math.floor(Date.now() / 1000),
        })

        // Add to temp transactions for UI feedback
        addTempTx(
          `${token0?.uuid}/${token1?.uuid}/${fee * 10}`,
          address,
          0, // No input amount for removal
          0,
          false, // isAdding = false for removal
          networkData.number
        )

        setOpen(false)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Remove liquidity error:', error)
      createErrorToast('Failed to remove liquidity', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {children({ setOpen })}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="mx-auto max-w-md">
          <Dialog.Header onClose={() => setOpen(false)} title="Confirm Remove Liquidity" />

          {quoteData && (
            <div className="p-6 space-y-4">
              {/* Transaction Details */}
              <div className="space-y-3">
                <div className="text-sm text-stone-400">You will receive:</div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-stone-800/50">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-medium text-stone-200">{formatAmount(quoteData.amount_out)}</div>
                    <div className="text-stone-400">{selectedToken?.symbol}</div>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="p-3 space-y-2 text-xs rounded-lg bg-stone-800/50">
                <div className="mb-2 text-stone-400">Transaction breakdown:</div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{token0?.symbol} withdrawn:</span>
                  <span className="text-green-300">{formatAmount(quoteData.token_a_withdrawn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{token1?.symbol} withdrawn:</span>
                  <span className="text-green-300">{formatAmount(quoteData.token_b_withdrawn)}</span>
                </div>
                {quoteData.swap_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Swap amount:</span>
                    <span className="text-blue-300">
                      {formatAmount(quoteData.swap_amount)} → {formatAmount(quoteData.swap_output)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleRemoveLiquidity}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Removing Liquidity...' : 'Confirm Remove Liquidity'}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </>
  )
}
