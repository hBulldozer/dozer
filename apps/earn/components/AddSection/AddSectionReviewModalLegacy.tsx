import { ChainId } from '@dozer/chain'
import { Amount, Type } from '@dozer/currency'
import { Button, createErrorToast, createSuccessToast, Dots, NotificationData } from '@dozer/ui'
import { FC, ReactNode, useState } from 'react'
import { useAccount, useNetwork, useTrade, TokenBalance, useSettings } from '@dozer/zustand'
import { AddSectionReviewModal } from './AddSectionReviewModal'
import { api } from '../../utils/api'

interface AddSectionReviewModalLegacyProps {
  poolState: number
  chainId: ChainId
  token0: Type | undefined
  token1: Type | undefined
  input0: Amount<Type> | undefined
  input1: Amount<Type> | undefined
  children({ setOpen }: { setOpen(open: boolean): void }): ReactNode
  prices: { [key: string]: number }
}

export const AddSectionReviewModalLegacy: FC<AddSectionReviewModalLegacyProps> = ({
  poolState,
  chainId,
  input0,
  input1,
  children,
  prices,
}) => {
  const slippageTolerance = useSettings((state) => state.slippageTolerance)
  const [open, setOpen] = useState(false)
  const { amountSpecified, outputAmount, pool, mainCurrency, otherCurrency } = useTrade()
  const { address, addNotification, setBalance, balance } = useAccount()
  const { network } = useNetwork()
  const [isWritePending, setIsWritePending] = useState<boolean>(false)

  const editBalanceOnAddLiquidity = (amount_in: number, token_in: string, amount_out: number, token_out: string) => {
    const balance_tokens = balance.map((t) => {
      return t.token_uuid
    })
    if (balance_tokens.includes(token_out))
      setBalance(
        balance.map((token: TokenBalance) => {
          if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
          else if (token.token_uuid == token_out)
            return { ...token, token_balance: token.token_balance - amount_out * 100 }
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

  const mutation = api.getPools.add_liquidity.useMutation({
    onSuccess: (res) => {
      console.log(res)
      if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
        if (res.hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Waiting for next block`,
              completed: `Success! Added ${amountSpecified} ${mainCurrency.symbol} and ${outputAmount} ${otherCurrency.symbol} in ${pool.name} pool.`,
              failed: 'Failed summary',
              info: `Adding Liquidity in ${pool.name} pool: ${amountSpecified} ${mainCurrency.symbol} and ${outputAmount} ${otherCurrency.symbol}.`,
            },
            status: 'pending',
            txHash: res.hash,
            groupTimestamp: Math.floor(Date.now() / 1000),
            timestamp: Math.floor(Date.now() / 1000),
            promise: new Promise((resolve) => {
              setTimeout(resolve, 500)
            }),
          }
          editBalanceOnAddLiquidity(
            amountSpecified,
            mainCurrency.uuid,
            outputAmount * (1 + slippageTolerance),
            otherCurrency.uuid
          )
          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setOpen(false)
          setIsWritePending(false)
        } else {
          createErrorToast(`${res.error}`, true)
          setIsWritePending(false)
          setOpen(false)
        }
      }
    },
    onError: (error) => {
      createErrorToast(`Error sending TX. \n${error}`, true)
      setIsWritePending(false)
      setOpen(false)
    },
  })
  const onClick = async () => {
    if (amountSpecified && outputAmount && pool && mainCurrency && otherCurrency) {
      setIsWritePending(true)
      mutation.mutate({
        amount_a: amountSpecified,
        token_a: mainCurrency.uuid,
        amount_b: outputAmount * (1 + slippageTolerance),
        ncid: pool.id,
        token_b: otherCurrency.uuid,
        address,
      })
    }
  }

  return (
    <>
      {children({ setOpen })}
      <AddSectionReviewModal
        chainId={chainId}
        input0={input0}
        input1={input1}
        open={open}
        setOpen={setOpen}
        prices={prices}
      >
        <Button
          size="md"
          disabled={isWritePending}
          fullWidth
          onClick={() => {
            onClick()
          }}
        >
          {isWritePending ? <Dots>Confirm transaction</Dots> : <>Add Liquidity</>}
        </Button>
      </AddSectionReviewModal>
    </>
  )
}
