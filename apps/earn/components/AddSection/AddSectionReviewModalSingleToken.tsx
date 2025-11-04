import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData, Typography, Currency } from '@dozer/ui'
import { FC, ReactNode, useEffect, useState, useMemo } from 'react'
import { useNetwork, useTempTxStore, useAccount } from '@dozer/zustand'
import { PoolManager } from '@dozer/nanocontracts'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { warningSeverity } from '@dozer/math'
import { api } from '../../utils/api'
import { get } from 'lodash'

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
  token,
  otherToken,
  input,
  fee,
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

  // Calculate price impact severity and color
  const priceImpactSeverity = useMemo(() => {
    if (!quoteData) return 0
    return warningSeverity(quoteData.price_impact)
  }, [quoteData])

  const priceImpactColor = useMemo(() => {
    if (priceImpactSeverity === 0 || priceImpactSeverity === 1) return 'text-green-400'
    if (priceImpactSeverity === 2) return 'text-yellow-400'
    if (priceImpactSeverity === 3) return 'text-orange-400'
    return 'text-red-400'
  }, [priceImpactSeverity])

  const handleAddLiquidity = async () => {
    if (!quoteData || !token || !otherToken || !networkData?.number || !address) return

    setSentTX(true)
    await poolManager.addLiquiditySingleToken(
      hathorRpc,
      address,
      token.uuid,
      parseFloat(input),
      otherToken.uuid,
      fee * 10 // Convert fee to basis points
    )
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      console.log(rpcResult)
      if (quoteData && token && otherToken && networkData) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          const notificationData: NotificationData = {
            type: 'add_liquidity_single_token',
            chainId: network,
            summary: {
              pending: `Waiting for next block. Adding ${parseFloat(input).toFixed(2)} ${token.symbol} as single token liquidity.`,
              completed: `Success! Added ${parseFloat(input).toFixed(2)} ${token.symbol} as single token liquidity.`,
              failed: 'Failed to add single token liquidity',
              info: `Adding ${parseFloat(input).toFixed(2)} ${token.symbol} as single token liquidity.`,
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
            `${token.uuid}/${otherToken.uuid}/${fee * 10}`,
            address,
            parseFloat(input) * 100,
            parseFloat(input) * 100,
            true,
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
  }, [rpcResult, sentTX, quoteData, token, otherToken, networkData, network, input, address, fee, addTempTx, addNotification])

  return (
    <>
      {children({ setOpen })}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="max-w-sm !pb-4">
          <Dialog.Header border={false} title="Confirm Add Liquidity" onClose={() => setOpen(false)} />

          {quoteData && (
            <>
              <div className="!my-0 grid grid-cols-12 items-center">
                <div className="flex relative flex-col col-span-12 gap-1 p-2 rounded-2xl border sm:p-4 bg-stone-700/40 border-stone-200/5">
                  <div className="flex gap-2 items-center">
                    <div className="flex gap-2 justify-between items-center w-full">
                      <Typography variant="h3" weight={500} className="truncate text-stone-50">
                        {parseFloat(input).toFixed(2)}
                      </Typography>
                      <div className="flex gap-2 justify-end items-center text-right">
                        {token && (
                          <div className="w-5 h-5">
                            <Currency.Icon currency={token} width={20} height={20} />
                          </div>
                        )}
                        <Typography variant="h3" weight={500} className="text-right text-stone-50">
                          {token?.symbol}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  <Typography variant="sm" weight={500} className="text-stone-500">
                    {prices && token && prices[token.uuid]
                      ? `$${(parseFloat(input) * prices[token.uuid]).toFixed(2)}`
                      : '-'}
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
                        LP Position
                      </Typography>
                      <div className="flex gap-2 justify-end items-center text-right">
                        {token && otherToken && (
                          <Currency.IconList iconWidth={20} iconHeight={20}>
                            <Currency.Icon currency={token} width={20} height={20} />
                            <Currency.Icon currency={otherToken} width={20} height={20} />
                          </Currency.IconList>
                        )}
                      </div>
                    </div>
                  </div>
                  <Typography variant="sm" weight={500} className="text-stone-500">
                    {prices && token && otherToken && prices[token.uuid] && prices[otherToken.uuid]
                      ? `$${(quoteData.token_a_used * prices[token.uuid] + quoteData.token_b_used * prices[otherToken.uuid]).toFixed(2)}`
                      : 'Liquidity Position'}
                  </Typography>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                {/* Transaction Details */}
                <div className="p-3 space-y-2 text-xs rounded-lg bg-stone-800/20 border border-stone-200/5">
                  <div className="mb-2 text-stone-400">Transaction breakdown:</div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Swap amount:</span>
                    <span className="text-blue-300">
                      {formatAmount(quoteData.swap_amount)} → {formatAmount(quoteData.swap_output)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Price Impact:</span>
                    <span className={priceImpactColor}>
                      {quoteData.price_impact < 0.01
                        ? '< 0.01%'
                        : `${quoteData.price_impact.toFixed(2)}%`}
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
                <div className="flex flex-col gap-2">
                  <Button
                    size="md"
                    fullWidth
                    onClick={handleAddLiquidity}
                    disabled={isRpcRequestPending}
                  >
                    {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Add Liquidity'}
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
