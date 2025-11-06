import { Button, createErrorToast, createSuccessToast, Dialog, Dots, NotificationData } from '@dozer/ui'
import { useAccount, useNetwork, useSettings, useTrade } from '@dozer/zustand'
import { TradeType } from 'components/utils/TradeType'
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import { SwapReviewModalBase } from './SwapReviewModalBase'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { api } from 'utils/api'
import { TokenBalance } from '@dozer/zustand'
import { PoolManager } from '@dozer/nanocontracts'
import { useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { get } from 'lodash'

interface SwapReviewModalLegacy {
  chainId: number | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  onSuccess(): void
}

export const SwapReviewModalLegacy: FC<SwapReviewModalLegacy> = ({ chainId, children, onSuccess }) => {
  const { amountSpecified, outputAmount, pool, tradeType, mainCurrency, otherCurrency, routeInfo } = useTrade()
  const [sentTX, setSentTX] = useState(false)
  const { addNotification, setBalance, balance, walletType, hathorAddress } = useAccount()
  const { accounts } = useWalletConnectClient()
  const wcAddress = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { network } = useNetwork()
  const [open, setOpen] = useState(false)
  const [card, setCard] = useState(false)
  const { slippageTolerance } = useSettings()

  const poolManager = new PoolManager()

  // Use unified RPC context that handles both WalletConnect and MetaMask Snap
  const { hathorRpc, rpcResult, isRpcRequestPending, reset, isWalletConnected } = useJsonRpc()

  // Get the appropriate address based on wallet type
  const address = hathorAddress || wcAddress

  const onCloseCard = useCallback(() => {
    onSuccess()
  }, [onSuccess])

  const editBalanceOnSwap = (amount_in: number, token_in: string, amount_out: number, token_out: string) => {
    const balance_tokens = balance.map((t) => {
      return t.token_uuid
    })
    if (balance_tokens.includes(token_out))
      setBalance(
        balance.map((token: TokenBalance) => {
          if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
          else if (token.token_uuid == token_out)
            return { ...token, token_balance: token.token_balance + Number(amount_out.toFixed(2)) * 100 }
          else return token
        })
      )
    else {
      const token_out_balance: TokenBalance = {
        token_balance: amount_out * 100,
        token_symbol: otherCurrency?.symbol || 'DZR',
        token_uuid: token_out,
      }
      const new_balance: TokenBalance[] = balance.map((token: TokenBalance) => {
        if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
        else return token
      })
      new_balance.push(token_out_balance)
      setBalance(new_balance)
    }
  }

  const onClick = async () => {
    setSentTX(true)

    // if (!isWalletConnected) {
    //   console.error('Wallet not connected')
    //   createErrorToast('Wallet not connected properly', true)
    //   setSentTX(false)
    //   return
    // }

    if (!hathorRpc) {
      createErrorToast('Unable to connect to wallet', true)
      setSentTX(false)
      return
    }

    if (!address) {
      createErrorToast('No wallet address available', true)
      setSentTX(false)
      return
    }

    if (amountSpecified && outputAmount && mainCurrency && otherCurrency && routeInfo) {
      try {
        // Use poolPath from routeInfo, fallback to constructing from path if needed
        const swapPath = routeInfo.poolPath || routeInfo.path.join(',')

        if (tradeType === TradeType.EXACT_INPUT) {
          await poolManager.swapExactTokensForTokens(
            hathorRpc,
            address,
            mainCurrency.uuid,
            amountSpecified,
            otherCurrency.uuid,
            outputAmount * (1 - slippageTolerance),
            swapPath
          )
        } else {
          await poolManager.swapTokensForExactTokens(
            hathorRpc,
            address,
            mainCurrency.uuid,
            amountSpecified * (1 + slippageTolerance),
            otherCurrency.uuid,
            outputAmount,
            swapPath
          )
        }
      } catch (error) {
        createErrorToast(error instanceof Error ? error.message : 'Swap failed', true)
        setSentTX(false)
      }
    }
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Swapping ${amountSpecified.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${mainCurrency.symbol} for ${outputAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${otherCurrency.symbol}.`,
              completed: `Success! Traded ${amountSpecified.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${mainCurrency.symbol} for ${outputAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${otherCurrency.symbol}.`,
              failed: 'Failed summary',
              info: `Trading ${amountSpecified.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${mainCurrency.symbol} for ${outputAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${otherCurrency.symbol}.`,
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
          editBalanceOnSwap(
            amountSpecified * (tradeType === TradeType.EXACT_OUTPUT ? 1 + slippageTolerance : 1),
            mainCurrency.uuid,
            outputAmount * (tradeType === TradeType.EXACT_INPUT ? 1 - slippageTolerance : 1),
            otherCurrency.uuid
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
  }, [rpcResult])

  return (
    <>
      {children({ setOpen })}
      <SwapReviewModalBase chainId={chainId} open={open} setOpen={setOpen}>
        <div className="flex flex-col gap-2 justify-between">
          <Button
            size="md"
            testdata-id="swap-review-confirm-button"
            disabled={isRpcRequestPending}
            fullWidth
            onClick={() => onClick()}
          >
            {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Swap'}
          </Button>
          {isRpcRequestPending && (
            <Button
              size="md"
              testdata-id="swap-review-reset-button"
              fullWidth
              variant="outlined"
              color="red"
              onClick={() => reset()}
            >
              Cancel Transaction
            </Button>
          )}
        </div>
      </SwapReviewModalBase>

      <Dialog open={card} onClose={onCloseCard}>
        <div className="relative">
          <div
            role="button"
            onClick={onCloseCard}
            className=" absolute right-[-12px] top-[-12px] z-10 bg-stone-700 p-2 rounded-full flex items-center justify-center hover:bg-stone-600 cursor-pointer"
          >
            <XMarkIcon width={20} height={20} />
          </div>
        </div>
      </Dialog>
    </>
  )
}
