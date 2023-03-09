import { Token } from '@dozer/currency'
import { Button } from '@dozer/ui'
import { FC, useMemo } from 'react'
import { useAccount } from '@dozer/zustand'

import { CheckerButton } from './types'

export interface AmountsProps extends CheckerButton {
  token: Token | undefined
  amount: number | undefined
}

export const Amounts: FC<AmountsProps> = ({ amount, token, children, className, variant, fullWidth, as, size }) => {
  const amountsAreDefined = useMemo(() => (amount ? true : false), [amount])

  const balance = useAccount((state) => state.balance)

  const token_balance = useMemo(
    () =>
      balance.find((obj) => {
        return obj.token_uuid == token?.uuid
      })?.token_balance,
    [balance, token?.uuid]
  )

  const sufficientBalance = useMemo(() => {
    return token && amount && token_balance && token_balance / 100 > amount
  }, [amount, token, token_balance])

  return useMemo(() => {
    if (!amountsAreDefined)
      return (
        <Button
          id="amount-checker"
          disabled
          className={className}
          variant={variant}
          as={as}
          fullWidth={fullWidth}
          size={size}
        >
          Enter Amount
        </Button>
      )

    if (!sufficientBalance)
      return (
        <Button disabled className={className} variant={variant} as={as} fullWidth={fullWidth} size={size}>
          Insufficient Balance
        </Button>
      )

    return <>{children}</>
  }, [amountsAreDefined, as, children, className, fullWidth, size, sufficientBalance, variant])
}
