import { Amount } from '@dozer/currency'
import { useIsMounted } from '@dozer/hooks'
import { Percent } from '@dozer/math'
import { Button, createErrorToast, createSuccessToast, Dots, NotificationData } from '@dozer/ui'
import { Approve, Checker, useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { FC, useEffect, useMemo, useState } from 'react'

import { TokenBalance, useAccount, useNetwork, useSettings } from '@dozer/zustand'
import { RemoveSectionWidget } from './RemoveSectionWidget'
import { Pair, toToken } from '@dozer/api'
import { dbPoolWithTokens } from '@dozer/api'
import { useUnderlyingTokenBalanceFromPair } from '@dozer/api'
import { usePoolPosition } from '../PoolPositionProvider'
import { api } from '../../utils/api'
import { PoolManager } from '@dozer/nanocontracts'
import { get } from 'lodash'

interface RemoveSectionLegacyProps {
  pair: Pair
  prices: { [key: string]: number }
}

const DEFAULT_REMOVE_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

export const RemoveSectionLegacy: FC<RemoveSectionLegacyProps> = ({ pair, prices }) => {
  const { slippageTolerance } = useSettings()
  const {
    // address,
    addNotification,
    setBalance,
    balance,
  } = useAccount()
  const { walletType, hathorAddress } = useAccount()
  const { accounts } = useWalletConnectClient()
  // Get the appropriate address based on wallet type
  // For WalletConnect: use accounts array
  // For MetaMask Snap: use hathorAddress from useAccount
  const address = walletType === 'walletconnect' 
    ? (accounts.length > 0 ? accounts[0].split(':')[2] : '') 
    : hathorAddress || ''
  const { network } = useNetwork()

  const [sentTX, setSentTX] = useState(false)

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

  // Extract fee from pool key (format: tokenA/tokenB/fee)
  const fee = useMemo(() => {
    if (!pair.id) return 5 // fallback
    const [, , feeStr] = pair.id.split('/')
    return parseInt(feeStr) || 5
  }, [pair.id])

  const poolManager = new PoolManager()

  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

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

  // Calculate currencyBToRemove using the same ratio as the contract's quote function
  // to avoid rounding mismatches. The contract uses: amount_b = (amount_a * reserve_b) // reserve_a
  const currencyBToRemove = useMemo(() => {
    if (!token1 || !percentToRemove || !percentToRemove.greaterThan('0') || !currencyAToRemove || !pair) {
      return token1 ? Amount.fromRawAmount(token1, '0') : undefined
    }

    try {
      // Get reserves from pair (these are in cents as integers)
      const reserveA = BigInt(Math.floor(pair.reserve0 * 100))
      const reserveB = BigInt(Math.floor(pair.reserve1 * 100))

      // Use the contract's quote formula: amount_b = (amount_a * reserve_b) / reserve_a
      // currencyAToRemove.quotient is a JSBI instance, convert to string first
      const amountA = BigInt(currencyAToRemove.quotient.toString())
      const amountB = (amountA * reserveB) / reserveA

      // Return as Amount in cents
      return Amount.fromRawAmount(token1, amountB.toString())
    } catch (error) {
      console.error('Error calculating currencyBToRemove:', error)
      return token1 ? Amount.fromRawAmount(token1, '0') : undefined
    }
  }, [token1, percentToRemove, currencyAToRemove, pair])

  const [minAmount0, minAmount1] = useMemo(() => {
    return [
      currencyAToRemove ? Number(currencyAToRemove.toFixed(2))  : undefined,
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

  const onClick = async () => {
    setSentTX(true)
    if (currencyAToRemove && currencyBToRemove && percentage) {
      // Convert from cents (quotient) to decimal tokens by dividing by 100
      // This avoids precision loss from toFixed(2)
      // Note: quotient is a JSBI instance, convert to string first then to number
      const amountADecimal = Number(currencyAToRemove.quotient.toString()) / 100
      const amountBDecimal = Number(currencyBToRemove.quotient.toString()) / 100

      poolManager.removeLiquidity(
        hathorRpc,
        address,
        token0.uuid,
        amountADecimal,
        token1.uuid,
        amountBDecimal,
        fee
      )
    }
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && sentTX) {
      if (minAmount0 && minAmount1 && percentage) {
        const hash = get(rpcResult, 'result.response.hash') as string
        if (hash) {
          const notificationData: NotificationData = {
            type: 'swap',
            chainId: network,
            summary: {
              pending: `Removing liquidity from ${pair.name}.`,
              completed: `Success! Removed ${Number(currencyAToRemove?.toFixed(2) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${
                token0.symbol
              } and ${Number(currencyBToRemove?.toFixed(2) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${token1.symbol} from ${pair.name} pool.`,
              failed: 'Failed summary',
              info: `Removing Liquidity from ${pair.name} pool: ${Number(currencyAToRemove?.toFixed(2) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${
                token0.symbol
              } and ${Number(currencyBToRemove?.toFixed(2) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${token1.symbol}.`,
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
          setSentTX(false)
        } else {
          createErrorToast(`Error`, true)
          setSentTX(false)
        }
      }
    }
  }, [rpcResult])

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
        hasLiquidity={!!(liquidity && Number(liquidity) > 0)}
      >
        <Checker.Connected fullWidth size="md">
          <div className="flex flex-col justify-between gap-2">
            <Button
              onClick={onClick}
              fullWidth
              size="md"
              variant="filled"
              disabled={!percentage || isRpcRequestPending}
            >
              {!percentage ? (
                'Enter a percentage'
              ) : isRpcRequestPending ? (
                <Dots>Confirm transaction in your wallet</Dots>
              ) : (
                'Remove Liquidity'
              )}
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
          {/* </Checker.Custom>
            </Checker.Network>
          </Checker.Custom> */}
        </Checker.Connected>
      </RemoveSectionWidget>
    </div>
  )
}
