import { ChevronLeftIcon } from '@heroicons/react/24/solid'
import { Button, Currency, Dialog, IconButton, NetworkIcon, SlideIn, Typography } from '@dozer/ui'
import React, { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { NotificationGroup } from '../../NotificationCentre'
import { ProfileView } from './Profile'
import { client, toToken } from '@dozer/api'
import { BaseEvent, EventType, useWebSocket } from '../../../systems'
import { TokenBalance, useAccount, useNetwork } from '@dozer/zustand'
import { getTokens, Token } from '@dozer/currency'

interface TokensProps {
  setView: Dispatch<SetStateAction<ProfileView>>
  // notifications: Record<number, string[]>
  // clearNotifications(): void
  // updateNotificationStatus: (txHash: string, state: string, message?: string) => void
  client: typeof client
}

interface BalanceProps {
  balance: number
  balanceUSD: number
  token: Token | undefined
}

export const Tokens: FC<TokensProps> = ({
  setView,
  // notifications,
  // clearNotifications,
  // updateNotificationStatus,
  client,
}) => {
  const { data: tokens } = client.getTokens.all.useQuery()
  const chainId = useNetwork((state) => state.network)
  const balance = useAccount((state) => state.balance)
  const { data: prices } = client.getPrices.all.useQuery()
  const [currencies, setCurrencies] = useState<Token[]>([])

  useEffect(() => {
    const balance_user: BalanceProps[] = balance
      .filter((b: TokenBalance) => {
        const featured_tokens = tokens?.map((t) => t.uuid)
        return featured_tokens?.includes(b.token_uuid)
      })
      .map((b: TokenBalance) => {
        const user_tokens = tokens?.find((t) => t.uuid === b.token_uuid)
        return {
          token: user_tokens && tokens ? toToken(tokens.find((t) => t.uuid === b.token_uuid)) : undefined,
          balance: b.token_balance / 100,
          balanceUSD: prices ? (prices[b.token_uuid] * b.token_balance) / 100 : 0,
        }
      })
      .sort((a: BalanceProps, b: BalanceProps) => b.balanceUSD - a.balanceUSD)
    const user_currencies = balance_user
      .map((b: BalanceProps) => b.token)
      .filter((token): token is Token => token !== undefined)
    setCurrencies(user_currencies)
  }, [balance])
  return (
    <div className="">
      <div className="grid items-center h-12 grid-cols-3 px-2 border-b border-stone-200/20">
        <div className="flex items-center">
          <IconButton onClick={() => setView(ProfileView.Default)}>
            <ChevronLeftIcon width={24} height={24} className="text-stone-400" />
          </IconButton>
        </div>
        <Typography weight={600} className="text-stone-400">
          Tokens
        </Typography>
      </div>
      <div className="flex flex-col  max-h-[300px] scroll">
        {currencies.length != 0 && chainId ? (
          currencies.map((currency) => {
            const currency_balance = (balance?.find((b) => b.token_uuid == currency.uuid)?.token_balance || 0) / 100
            const price = prices?.[currency.uuid]
            return (
              <div
                className="flex items-center justify-between px-1 mx-3 border-b border-stone-600/20"
                key={currency.uuid}
              >
                <div className="flex flex-row items-center gap-3  py-2.5 ">
                  <div className="w-7 h-7">
                    <Currency.Icon currency={currency} width={28} height={28} />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="xs" weight={500} className="text-stone-300">
                      {currency.symbol}
                    </Typography>
                    <Typography variant="xxs" className="text-stone-400">
                      {currency.name}
                    </Typography>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="flex flex-col">
                    <Typography variant="xs" weight={500} className="text-right text-stone-200">
                      {Number(currency_balance?.toFixed(2) || '0').toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                    <Typography variant="xxs" className="text-right text-stone-400">
                      {price ? `$${(parseFloat(currency_balance?.toFixed(2) || '0') * price).toFixed(2)}` : '-'}
                    </Typography>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center justify-center gap-1">
              <Typography variant="xs" className="flex italic text-stone-500">
                No tokens found
              </Typography>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
