import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData, Typography, Currency } from '@dozer/ui'
import { FC, ReactNode, useEffect, useState } from 'react'
import { useNetwork, useTempTxStore, useAccount } from '@dozer/zustand'
import { PoolManager } from '@dozer/nanocontracts'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { api } from '../../utils/api'
import { get } from 'lodash'

interface RemoveSectionReviewModalSingleTokenProps {
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  selectedToken: Type | undefined
  fee: number
  userAddress?: string
  percentage: string
  poolKey: string
  prices?: { [key: string]: number }
  children: ({ setOpen }: { setOpen: (open: boolean) => void }) => ReactNode
}

export const RemoveSectionReviewModalSingleToken: FC<RemoveSectionReviewModalSingleTokenProps> = ({
  token0,
  token1,
  selectedToken,
  fee,
  userAddress,
  percentage,
  poolKey,
  prices,
  children,
}) => {
  const [open, setOpen] = useState(false)
  const [sentTX, setSentTX] = useState(false)
  const { network } = useNetwork()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()
  const addTempTx = useTempTxStore((state) => state.addTempTx)
  const { addNotification } = useAccount()
  const poolManager = new PoolManager()
  const { data: networkData } = api.getNetwork.getBestBlock.useQuery()

  // Fetch quote for the modal
  const { data: quoteData } = api.getPools.quoteSingleTokenRemovalPercentage.useQuery(
    {
      address: userAddress || address,
      poolKey: poolKey,
      tokenOut: selectedToken?.uuid || '',
      percentage: parseFloat(percentage) || 100,
    },
    {
      enabled: !!userAddress && !!selectedToken && !!poolKey && !!percentage && open,
      refetchInterval: 5000,
    }
  )

  const formatAmount = (amount: number) => {
    return amount.toFixed(6).replace(/\\.?0+$/, '')
  }

  const handleRemoveLiquidity = async () => {
    if (!quoteData || !selectedToken || !networkData?.number || !address) return

    setSentTX(true)
    await poolManager.removeLiquiditySingleToken(
      hathorRpc,
      address,
      poolKey,
      selectedToken.uuid,
      quoteData.amount_out, // The amount user wants to receive
      parseFloat(percentage) || 100 // Percentage of liquidity to remove
    )
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      console.log(rpcResult)
      if (quoteData && selectedToken && networkData) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          const notificationData: NotificationData = {
            type: 'remove_liquidity_single_token',
            chainId: network,
            summary: {
              pending: `Waiting for next block. Removing ${percentage}% liquidity to receive ${selectedToken.symbol}.`,
              completed: `Success! Removed liquidity and received ${formatAmount(quoteData.amount_out)} ${selectedToken.symbol}.`,
              failed: 'Failed to remove single token liquidity',
              info: `Removing ${percentage}% liquidity to receive ${selectedToken.symbol}.`,
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

          // Add to temp transactions for UI feedback
          addTempTx(
            `${token0?.uuid}/${token1?.uuid}/${fee * 10}`,
            address,
            0, // No input amount for removal
            0,
            false, // isAdding = false for removal
            networkData.number
          )

          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setOpen(false)
          setSentTX(false)
        } else {
          createErrorToast(`Error`, true)
          setOpen(false)
          setSentTX(false)
        }
      }
    }
  }, [rpcResult, sentTX, quoteData, selectedToken, networkData, network, percentage, address, token0?.uuid, token1?.uuid, fee, addTempTx, addNotification])

  return (
    <>
      {children({ setOpen })}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="max-w-sm !pb-4">
          <Dialog.Header border={false} title="Confirm Remove Liquidity" onClose={() => setOpen(false)} />

          {quoteData && (
            <>
              <div className="!my-0 grid grid-cols-12 items-center">
                <div className="flex relative flex-col col-span-12 gap-1 p-2 rounded-2xl border sm:p-4 bg-stone-700/40 border-stone-200/5">
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-2 justify-between items-center w-full">
                      <Typography variant="h3" weight={500} className="truncate text-stone-50">
                        LP Position ({percentage}%)
                      </Typography>
                      <div className="flex gap-2 justify-end items-center text-right">
                        {token0 && token1 && (
                          <Currency.IconList iconWidth={20} iconHeight={20}>
                            <Currency.Icon currency={token0} width={20} height={20} />
                            <Currency.Icon currency={token1} width={20} height={20} />
                          </Currency.IconList>
                        )}
                      </div>
                    </div>
                  </div>
                  <Typography variant="sm" weight={500} className="text-stone-500">
                    Removing liquidity position
                  </Typography>
                </div>

                <div className="flex items-center justify-center col-span-12 -mt-2.5 -mb-2.5">
                  <div className="p-0.5 bg-stone-700 border-2 border-stone-800 ring-1 ring-stone-200/5 z-10 rounded-full">
                    <svg width={18} height={18} className="text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="flex flex-col col-span-12 gap-1 p-2 rounded-2xl border sm:p-4 bg-stone-700/40 border-stone-200/5">
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-2 justify-between items-center w-full">
                      <Typography variant="h3" weight={500} className="truncate text-stone-50">
                        {formatAmount(quoteData.amount_out)}
                      </Typography>
                      <div className="flex gap-2 justify-end items-center text-right">
                        {selectedToken && (
                          <div className="w-5 h-5">
                            <Currency.Icon currency={selectedToken} width={20} height={20} />
                          </div>
                        )}
                        <Typography variant="h3" weight={500} className="text-right text-stone-50">
                          {selectedToken?.symbol}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  <Typography variant="sm" weight={500} className="text-stone-500">
                    {(() => {
                      const selectedTokenPrice = selectedToken?.uuid && prices ? prices[selectedToken.uuid] : 0
                      const usdValue = quoteData.amount_out * selectedTokenPrice
                      return selectedTokenPrice > 0 ? `$${usdValue.toFixed(2)}` : '-'
                    })()}
                  </Typography>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                {/* Transaction Details */}
                <div className="p-3 space-y-2 text-xs rounded-lg bg-stone-800/20 border border-stone-200/5">
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
                <div className="flex flex-col gap-2">
                  <Button
                    size="md"
                    fullWidth
                    onClick={handleRemoveLiquidity}
                    disabled={isRpcRequestPending}
                  >
                    {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Remove Liquidity'}
                  </Button>
                  {isRpcRequestPending && (
                    <Button
                      size="md"
                      fullWidth
                      variant="outlined"
                      color="red"
                      onClick={() => reset()}
                    >
                      Cancel Transaction
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog>
    </>
  )
}
