import React, { FC, ReactNode, useState, useEffect } from 'react'
import { PlusIcon, Square2StackIcon } from '@heroicons/react/24/solid'
import { ChainId } from '@dozer/chain'
import { Type } from '@dozer/currency'
import {
  Button,
  createErrorToast,
  createSuccessToast,
  Dots,
  NotificationData,
  Dialog,
  Typography,
  Currency,
  IconButton,
  CopyHelper,
} from '@dozer/ui'
import { useAccount, useNetwork, useTrade, TokenBalance, useSettings } from '@dozer/zustand'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { LiquidityPool } from '@dozer/nanocontracts'
import { get } from 'lodash'
import { api } from '../../utils/api'
import { Rate } from '../Rate'

interface CreatePoolReviewModalProps {
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  input0: string
  input1: string
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  prices: { [key: string]: number }
}

export const CreatePoolReviewModal: FC<CreatePoolReviewModalProps> = ({
  chainId,
  token0,
  token1,
  input0,
  input1,
  children,
  prices,
}) => {
  const [open, setOpen] = useState(false)
  const [sentTX, setSentTX] = useState(false)
  const { addNotification, setBalance, balance } = useAccount()
  const { network } = useNetwork()
  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()
  const slippageTolerance = useSettings((state) => state.slippageTolerance)
  const { pool } = useTrade()

  const createPoolMutation = api.getPools.createPool.useMutation()

  const liquidityPool = new LiquidityPool(token0?.uuid || '', token1?.uuid || '', 5, 50)

  const onClick = async () => {
    setSentTX(true)
    if (token0 && token1 && input0 && input1) {
      try {
        const response = await liquidityPool.wc_initialize(
          hathorRpc,
          address,
          token0.uuid,
          token1.uuid,
          parseFloat(input0),
          parseFloat(input1),
          0,
          0
        )
        console.log(response)
      } catch (error) {
        console.error('Error initializing pool:', error)
        createErrorToast('Failed to initialize pool', true)
        setSentTX(false)
      }
    }
  }

  const editBalanceOnCreatePool = (amount0: number, token0: string, amount1: number, token1: string) => {
    setBalance(
      balance.map((token: TokenBalance) => {
        if (token.token_uuid === token0) {
          return { ...token, token_balance: token.token_balance - amount0 * 100 }
        } else if (token.token_uuid === token1) {
          return { ...token, token_balance: token.token_balance - amount1 * 100 }
        }
        return token
      })
    )
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      console.log(rpcResult)
      if (token0 && token1 && input0 && input1) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          // Create pool in database
          createPoolMutation.mutate({
            name: `${token0.symbol}-${token1.symbol}`,
            chainId: network,
            token0Uuid: token0.uuid,
            token1Uuid: token1.uuid,
            reserve0: input0,
            reserve1: input1,
            id: hash,
          })

          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Creating pool ${token0.symbol}/${token1.symbol}...`,
              completed: `Successfully created pool ${token0.symbol}/${token1.symbol}!`,
              failed: 'Failed to create pool',
              info: `Creating pool ${token0.symbol}/${token1.symbol}: ${input0} ${token0.symbol} and ${input1} ${token1.symbol}.`,
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

          editBalanceOnCreatePool(parseFloat(input0), token0.uuid, parseFloat(input1), token1.uuid)

          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setOpen(false)
          setSentTX(false)
        } else {
          createErrorToast(`Error creating pool`, true)
          setOpen(false)
          setSentTX(false)
        }
      }
    }
  }, [rpcResult])

  return (
    <>
      {children({ setOpen })}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Content className="max-w-sm !pb-4">
          <Dialog.Header border={false} title="Create Pool" onClose={() => setOpen(false)} />
          <div className="!my-0 grid grid-cols-12 items-center">
            <div className="relative flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-between w-full gap-2">
                  <Typography variant="h3" weight={500} className="truncate text-stone-50">
                    {input0}
                  </Typography>
                  <div className="flex items-center justify-end gap-2 text-right">
                    {token0 && (
                      <div className="w-5 h-5">
                        <Currency.Icon currency={token0} width={20} height={20} />
                      </div>
                    )}
                    <Typography variant="h3" weight={500} className="text-right text-stone-50">
                      {token0?.symbol}
                    </Typography>
                  </div>
                </div>
              </div>
              <Typography variant="sm" weight={500} className="text-stone-500">
                {prices[token0?.uuid || ''] ? `$${(prices[token0?.uuid || ''] * Number(input0)).toFixed(2)}` : '-'}
              </Typography>
            </div>
            <div className="flex items-center justify-center col-span-12 -mt-2.5 -mb-2.5">
              <div className="p-0.5 bg-stone-700 border-2 border-stone-800 ring-1 ring-stone-200/5 z-10 rounded-full">
                <PlusIcon width={18} height={18} className="text-stone-200" />
              </div>
            </div>
            <div className="flex flex-col col-span-12 gap-1 p-2 border sm:p-4 rounded-2xl bg-stone-700/40 border-stone-200/5">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-between w-full gap-2">
                  <Typography variant="h3" weight={500} className="truncate text-stone-50">
                    {input1}
                  </Typography>
                  <div className="flex items-center justify-end gap-2 text-right">
                    {token1 && (
                      <div className="w-5 h-5">
                        <Currency.Icon currency={token1} width={20} height={20} />
                      </div>
                    )}
                    <Typography variant="h3" weight={500} className="text-right text-stone-50">
                      {token1?.symbol}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button size="md" disabled={isRpcRequestPending} fullWidth onClick={onClick}>
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : <>Create Pool</>}
            </Button>
            {isRpcRequestPending && (
              <Button size="md" fullWidth variant="outlined" color="red" onClick={() => reset()}>
                Cancel Transaction
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
