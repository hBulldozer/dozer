import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData } from '@dozer/ui'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useNetwork, useTempTxStore } from '@dozer/zustand'
import { PoolManager } from '@dozer/nanocontracts'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { api } from '../../utils/api'

interface AddSectionReviewModalSingleTokenProps {
  chainId: ChainId
  token: Type | undefined
  otherToken: Type | undefined
  input: string
  fee: number
  prices?: { [key: string]: number }
  children: ({ setOpen }: { setOpen: (open: boolean) => void }) => ReactNode
}

export const AddSectionReviewModalSingleToken: FC<AddSectionReviewModalSingleTokenProps> = ({
  chainId,
  token,
  otherToken,
  input,
  fee,
  prices,
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
  const { data: quoteData } = api.getPools.quoteSingleTokenLiquidity.useQuery(
    {
      tokenIn: token?.uuid || '',
      amountIn: parseFloat(input) || 0,
      tokenOut: otherToken?.uuid || '',
      fee: fee,
    },
    {
      enabled: !!token && !!otherToken && parseFloat(input) > 0 && open,
      refetchInterval: 5000,
    }
  )

  const formatAmount = (amount: number) => {
    return amount.toFixed(2).replace(/\\.?0+$/, '')
  }

  const handleAddLiquidity = async () => {
    if (!quoteData || !token || !otherToken || !networkData || !address) return

    setIsSubmitting(true)
    try {
      const response = await poolManager.addLiquiditySingleToken(
        hathorRpc,
        address,
        token.uuid,
        parseFloat(input),
        otherToken.uuid,
        fee * 10 // Convert fee to basis points
      )

      if (response.response && typeof response.response === 'object' && 'hash' in response.response) {
        createSuccessToast({
          type: 'approval',
          chainId: chainId,
          summary: {
            pending: `Adding ${parseFloat(input).toFixed(2)} ${token.symbol} as liquidity...`,
            completed: `Successfully added ${parseFloat(input).toFixed(2)} ${token.symbol} as liquidity`,
            failed: 'Failed to add liquidity',
          },
          status: 'completed',
          txHash: response.response.hash || '',
          timestamp: Math.floor(Date.now() / 1000),
          groupTimestamp: Math.floor(Date.now() / 1000),
        })

        // Add to temp transactions for UI feedback
        addTempTx(
          `${token.uuid}/${otherToken.uuid}/${fee * 10}`,
          address,
          parseFloat(input) * 100,
          parseFloat(input) * 100,
          true,
          networkData.number
        )

        setOpen(false)
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Add liquidity error:', error)
      createErrorToast('Failed to add liquidity', true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {children({ setOpen })}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="mx-auto max-w-md">
          <Dialog.Header onClose={() => setOpen(false)} title="Confirm Add Liquidity" />

          {quoteData && (
            <div className="px-6 pt-6 -mb-6 space-y-4">
              {/* Transaction Details */}
              <div className="space-y-3">
                <div className="text-sm text-stone-400">You will deposit:</div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-stone-800/50">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-medium text-stone-200">{parseFloat(input).toFixed(2)}</div>
                    <div className="text-stone-400">{token?.symbol}</div>
                  </div>
                  <div className="text-stone-500">
                    {prices && token && prices[token.uuid]
                      ? `$${(parseFloat(input) * prices[token.uuid]).toFixed(2)}`
                      : ''}
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="p-3 space-y-2 text-xs rounded-lg bg-stone-800/50">
                <div className="mb-2 text-stone-400">Transaction breakdown:</div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Swap amount:</span>
                  <span className="text-blue-300">
                    {formatAmount(quoteData.swap_amount)} → {formatAmount(quoteData.swap_output)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{token?.symbol} used:</span>
                  <span className="text-green-300">{formatAmount(quoteData.token_a_used)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{otherToken?.symbol} used:</span>
                  <span className="text-green-300">{formatAmount(quoteData.token_b_used)}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button fullWidth size="lg" onClick={handleAddLiquidity} disabled={isSubmitting} loading={isSubmitting}>
                {isSubmitting ? 'Adding Liquidity...' : 'Confirm Add Liquidity'}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </>
  )
}
