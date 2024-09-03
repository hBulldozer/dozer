import React, { FC, ReactNode, useState, useEffect } from 'react'
import { ChainId } from '@dozer/chain'
import { Amount, Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dots, NotificationData, Dialog } from '@dozer/ui'
import { useAccount, useNetwork, useTrade, TokenBalance, useSettings } from '@dozer/zustand'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { LiquidityPool } from '@dozer/nanocontracts'
import { get } from 'lodash'
import { api } from '../../utils/api'

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
          5,
          50
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
        <Dialog.Content>
          <Dialog.Header title="Create Pool" onClose={() => setOpen(false)} />
          <div className="flex flex-col gap-4 p-4">
            <div className="flex justify-between">
              <span>Token 0:</span>
              <span>{`${input0} ${token0?.symbol}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Token 1:</span>
              <span>{`${input1} ${token1?.symbol}`}</span>
            </div>
            <div className="flex flex-col justify-between gap-2">
              <Button size="md" disabled={isRpcRequestPending} fullWidth onClick={onClick}>
                {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : <>Create Pool</>}
              </Button>
              {isRpcRequestPending && (
                <Button size="md" fullWidth variant="outlined" color="red" onClick={() => reset()}>
                  Cancel Transaction
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  )
}
