import { Amount } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { Percent } from '@dozer/math'
import { Button, createErrorToast, createSuccessToast, Dots, NotificationData } from '@dozer/ui'
import { Approve, Checker } from '@dozer/higmi'
import { FC, useMemo, useState } from 'react'

import { TokenBalance, useAccount, useNetwork, useSettings } from '@dozer/zustand'
import { RemoveSectionWidget } from './RemoveSectionWidget'
import { Pair, toToken } from '@dozer/api'
import { dbPoolWithTokens } from '@dozer/api'
import { useUnderlyingTokenBalanceFromPair } from '@dozer/api'
import { usePoolPosition } from '../PoolPositionProvider'
import { api } from '../../utils/api'

interface RemoveSectionLegacyProps {
  pair: Pair
  prices: { [key: string]: number }
}

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

export const RemoveSectionLegacy: FC<RemoveSectionLegacyProps> = ({ pair, prices }) => {
  const { slippageTolerance } = useSettings()
  const { address, addNotification, setBalance, balance } = useAccount()
  const { network } = useNetwork()
  const [isWritePending, setIsWritePending] = useState<boolean>(false)

  const slippagePercent = useMemo(
    () =>
      slippageTolerance
        ? new Percent(
            // slippageTolerance * 100, 10_000
            10
          )
        : DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE,
    [slippageTolerance]
  )

  const [percentage, setPercentage] = useState<string>('')
  const percentToRemove = useMemo(() => new Percent(percentage), [percentage])

  const poolState = 1

  const { max_withdraw_a, max_withdraw_b, liquidity, value0, value1, isLoading, isError } = usePoolPosition()

  const token0 = toToken(pair.token0)
  const token1 = toToken(pair.token1)

  const liquidityAmount = Amount.fromFractionalAmount(
    token0,
    Math.floor(Number(liquidity?.toFixed(5)) * 100000) || 0,
    100000
  )

  const currencyAToRemove = useMemo(
    () =>
      token0
        ? percentToRemove && percentToRemove.greaterThan('0') && max_withdraw_a
          ? Amount.fromFractionalAmount(token0, percentToRemove.multiply(max_withdraw_a.quotient).quotient || '0', 100)
          : Amount.fromRawAmount(token0, '0')
        : undefined,
    [percentToRemove, token0, max_withdraw_a]
  )

  const currencyBToRemove = useMemo(
    () =>
      token1
        ? percentToRemove && percentToRemove.greaterThan('0') && max_withdraw_b
          ? Amount.fromFractionalAmount(token1, percentToRemove.multiply(max_withdraw_b.quotient).quotient || '0', 100)
          : Amount.fromRawAmount(token1, '0')
        : undefined,
    [percentToRemove, token1, max_withdraw_b]
  )

  const [minAmount0, minAmount1] = useMemo(() => {
    return [
      currencyAToRemove ? Number(currencyAToRemove.toFixed(2)) * (1 - slippageTolerance) : undefined,
      currencyBToRemove ? Number(currencyBToRemove.toFixed(2)) * (1 - slippageTolerance) : undefined,
    ]
  }, [currencyAToRemove, slippageTolerance, currencyBToRemove])

  const editBalanceOnRemoveLiquidity = (amount_in: number, token_in: string, amount_out: number, token_out: string) => {
    const balance_tokens = balance.map((t) => {
      return t.token_uuid
    })
    if (balance_tokens.includes(token_out))
      setBalance(
        balance.map((token: TokenBalance) => {
          if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance - amount_in * 100 }
          else if (token.token_uuid == token_out)
            return { ...token, token_balance: token.token_balance + amount_out * 100 }
          else return token
        })
      )
    else {
      const token_out_balance: TokenBalance = {
        token_balance: amount_out * 100,
        token_symbol: token1?.symbol || 'DZR',
        token_uuid: token_out,
      }
      const new_balance: TokenBalance[] = balance.map((token: TokenBalance) => {
        if (token.token_uuid == token_in) return { ...token, token_balance: token.token_balance + amount_in * 100 }
        else return token
      })
      new_balance.push(token_out_balance)
      setBalance(new_balance)
    }
  }

  const mutation = api.getPools.remove_liquidity.useMutation({
    onSuccess: (res) => {
      console.log(res)
      if (minAmount0 && minAmount1 && percentage) {
        if (res.hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Waiting for next block`,
              completed: `Success! Removed ${currencyAToRemove?.toFixed(2)} ${
                token0.symbol
              } and ${currencyBToRemove?.toFixed(2)} ${token1.symbol} from ${pair.name} pool.`,
              failed: 'Failed summary',
              info: `Removing Liquidity from ${pair.name} pool: ${currencyAToRemove?.toFixed(2)} ${
                token0.symbol
              } and ${currencyBToRemove?.toFixed(2)} ${token1.symbol}.`,
            },
            status: 'pending',
            txHash: res.hash,
            groupTimestamp: Math.floor(Date.now() / 1000),
            timestamp: Math.floor(Date.now() / 1000),
            promise: new Promise((resolve) => {
              setTimeout(resolve, 500)
            }),
          }
          editBalanceOnRemoveLiquidity(
            Number(currencyAToRemove?.toFixed(2) || 0),
            token0.uuid,
            Number(currencyBToRemove?.toFixed(2) || 0),
            token1.uuid
          )
          const notificationGroup: string[] = []
          notificationGroup.push(JSON.stringify(notificationData))
          addNotification(notificationGroup)
          createSuccessToast(notificationData)
          setIsWritePending(false)
        } else {
          createErrorToast(`${res.error}`, true)
          setIsWritePending(false)
        }
      }
    },
    onError: (error) => {
      createErrorToast(`Error sending TX. \n${error}`, true)
      setIsWritePending(false)
    },
  })

  const onClick = async () => {
    if (currencyAToRemove && currencyBToRemove && percentage) {
      setIsWritePending(true)
      mutation.mutate({
        amount_a: Number(currencyAToRemove?.toFixed(2) || 0),
        token_a: token0.uuid,
        amount_b: Number(currencyBToRemove?.toFixed(2) || 0),
        ncid: pair.id,
        token_b: token1.uuid,
        address,
      })
    }
  }
  return (
    <div>
      <RemoveSectionWidget
        chainId={pair.chainId}
        percentage={percentage}
        token0={token0}
        token1={token1}
        token0Minimum={minAmount0}
        token1Minimum={minAmount1}
        currency0={currencyAToRemove?.currency}
        currency1={currencyBToRemove?.currency}
        setPercentage={setPercentage}
        prices={prices}
      >
        <Checker.Connected fullWidth size="md">
          <Button onClick={onClick} fullWidth size="md" variant="filled" disabled={!percentage}>
            {!percentage ? 'Enter a percentage' : isWritePending ? <Dots>Removing Liquidity</Dots> : 'Remove Liquidity'}
          </Button>

          {/* </Checker.Custom>
            </Checker.Network>
          </Checker.Custom> */}
        </Checker.Connected>
      </RemoveSectionWidget>
    </div>
  )
}
