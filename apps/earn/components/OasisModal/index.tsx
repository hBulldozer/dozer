import React, { useState } from 'react'
import { Dialog, Typography, Button, Input, Currency } from '@dozer/ui'
import { Dots } from '@dozer/ui'
import { OasisAddModalProps, OasisRemoveModalProps, OasisClosePositionModalProps } from './types'
import { toToken } from '@dozer/api'
import Icon from '@dozer/ui/currency/Icon'
import { Oasis } from '@dozer/nanocontracts'

const OasisIcon: React.FC<{ token: string }> = ({ token }) => {
  return (
    <div className="relative flex-shrink-0 -mt-5 mr-2 w-8 h-8">
      <div className="absolute z-10 mt-7">
        <Currency.IconList iconWidth={18} iconHeight={18}>
          <Currency.Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} />
          <Currency.Icon currency={toToken({ symbol: token, uuid: '00' })} />
        </Currency.IconList>
      </div>
      <Typography variant="hero" className="mt-1">
        🏝️
      </Typography>
    </div>
  )
}

export const OasisClosePositionModal: React.FC<OasisClosePositionModalProps> = ({
  open,
  setOpen,
  oasis,
  onConfirm,
  isRpcRequestPending,
  onReset,
}) => {
  if (!oasis) return null
  const max_withdraw_b = oasis?.max_withdraw_b ?? 0
  const position_to_be_closed_htr = (oasis?.max_withdraw_htr ?? 0) - (oasis?.user_balance_a ?? 0)

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Close Position" onClose={() => setOpen(false)} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8">
              <OasisIcon token={oasis.token.symbol} />
            </div>
            <Typography variant="h3" className="ml-3">
              HTR-{oasis.token.symbol}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="p-4 mb-2 rounded-xl bg-stone-700/20">
            <Typography variant="sm" weight={600} className="mb-3 text-stone-300">
              Position details:
            </Typography>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5">
                    <Icon currency={toToken(oasis.token)} />
                  </div>
                  <Typography variant="sm" className="text-stone-300">
                    {oasis.token.symbol}
                  </Typography>
                </div>
                <Typography variant="base" weight={500} className="text-yellow">
                  {max_withdraw_b.toString()}
                </Typography>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5">
                    <Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} />
                  </div>
                  <Typography variant="sm" className="text-stone-300">
                    HTR
                  </Typography>
                </div>
                <Typography variant="base" weight={500} className="text-yellow">
                  {position_to_be_closed_htr.toString()}
                </Typography>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-stone-400 bg-stone-700">
            <Typography variant="xs" weight={400} className="text-stone-200">
              This process ensures you receive any applicable protection against impermanent loss while clearly defining
              which assets (and their quantities) you can withdraw from the protocol.
            </Typography>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="md"
              disabled={isRpcRequestPending}
              fullWidth
              onClick={async () => {
                await onConfirm()
              }}
            >
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Close Position'}
            </Button>
            {isRpcRequestPending && (
              <>
                <Typography variant="xs" className="text-center text-stone-400">
                  This may take up to 20 seconds when using MetaMask Snap
                </Typography>
                <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                  Cancel Transaction
                </Button>
              </>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

export const OasisRemoveModal: React.FC<OasisRemoveModalProps> = ({
  open,
  setOpen,
  oasis,
  onConfirm,
  isRpcRequestPending,
  onReset,
}) => {
  if (!oasis) return null
  const maxAmountB = oasis?.position_closed ? oasis?.max_withdraw_b ?? 0 : oasis?.max_withdraw_b ?? 0
  const maxAmountHTR = oasis?.position_closed ? oasis?.max_withdraw_htr ?? 0 : oasis?.max_withdraw_htr ?? 0

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Withdraw Position" onClose={() => setOpen(false)} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8">
              <OasisIcon token={oasis.token.symbol} />
            </div>
            <Typography variant="h3" className="ml-3">
              HTR-{oasis.token.symbol}
            </Typography>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="p-4 mb-2 rounded-xl bg-stone-700/20">
            <Typography variant="sm" weight={600} className="mb-3 text-stone-300">
              You will receive:
            </Typography>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5">
                    <Icon currency={toToken(oasis.token)} />
                  </div>
                  <Typography variant="sm" className="text-stone-300">
                    {oasis.token.symbol}
                  </Typography>
                </div>
                <Typography variant="base" weight={500} className="text-yellow">
                  {maxAmountB.toString()}
                </Typography>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <div className="w-5 h-5">
                    <Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} />
                  </div>
                  <Typography variant="sm" className="text-stone-300">
                    HTR
                  </Typography>
                </div>
                <Typography variant="base" weight={500} className="text-yellow">
                  {maxAmountHTR.toString()}
                </Typography>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="md"
              disabled={isRpcRequestPending}
              fullWidth
              onClick={async () => {
                await onConfirm(maxAmountB, maxAmountHTR)
              }}
            >
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Withdraw Position'}
            </Button>
            {isRpcRequestPending && (
              <>
                <Typography variant="xs" className="text-center text-stone-400">
                  This may take up to 20 seconds when using MetaMask Snap
                </Typography>
                <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                  Cancel Transaction
                </Button>
              </>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

export const OasisRemoveBonusModal: React.FC<OasisRemoveModalProps> = ({
  open,
  setOpen,
  oasis,
  onConfirm,
  isRpcRequestPending,
  onReset,
}) => {
  if (!oasis) return null
  const maxAmount = oasis?.user_balance_a ?? 0

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Withdraw Bonus" onClose={() => setOpen(false)} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-4 items-center">
            <OasisIcon token={oasis.token.symbol} />
            <Typography variant="h3">HTR-{oasis.token.symbol}</Typography>
          </div>
          {/* <div className="p-4 mt-2 rounded-xl bg-stone-800">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Typography variant="base" weight={500} className="text-yellow">
                  {maxAmount.toString()} HTR
                </Typography>
              </div>
              <Typography variant="xs" className="text-stone-400">
                From your {oasis.token.symbol} position
              </Typography>
            </div>
          </div> */}
          {oasis.user_balance_a > 0 && (
            <div className="flex justify-between items-center p-4 my-4 rounded-lg bg-stone-700/20">
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6">
                  <Icon currency={toToken({ symbol: 'HTR', uuid: '00' })} width={24} height={24} />
                </div>
                <Typography variant="sm" className="text-stone-300">
                  HTR Bonus
                </Typography>
              </div>
              <Typography variant="sm" weight={600} className="text-yellow">
                {oasis.user_balance_a}
              </Typography>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              size="md"
              disabled={isRpcRequestPending || maxAmount <= 0}
              fullWidth
              onClick={async () => {
                await onConfirm(maxAmount, 0)
              }}
            >
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Withdraw Bonus'}
            </Button>
            {isRpcRequestPending && (
              <>
                <Typography variant="xs" className="text-center text-stone-400">
                  This may take up to 20 seconds when using MetaMask Snap
                </Typography>
                <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                  Cancel Transaction
                </Button>
              </>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}

export const OasisAddModal: React.FC<OasisAddModalProps> = ({
  open,
  setOpen,
  amount,
  token,
  bonus,
  htrMatch,
  unlockDate,
  onConfirm,
  isRpcRequestPending,
  onReset,
}) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Add Liquidity" onClose={() => setOpen(false)} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8">
              <OasisIcon token={token} />
            </div>
            <Typography variant="h3" className="ml-3">
              HTR-{token}
            </Typography>
          </div>

          <div className="p-4 my-2 rounded-xl bg-stone-700/20">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Amount to Lock
                </Typography>
                <Typography variant="sm">
                  {amount} {token}
                </Typography>
              </div>
              {/* <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  HTR matched
                </Typography>
                <Typography variant="sm">{htrMatch.toString()} HTR</Typography>
              </div> */}
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Bonus
                </Typography>
                <Typography variant="sm">{bonus.toString()} HTR</Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Unlock Date
                </Typography>
                <Typography variant="sm">{unlockDate.toLocaleDateString()}</Typography>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="md" disabled={isRpcRequestPending} fullWidth onClick={onConfirm}>
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Add Liquidity'}
            </Button>
            {isRpcRequestPending && (
              <>
                <Typography variant="xs" className="text-center text-stone-400">
                  This may take up to 20 seconds when using MetaMask Snap
                </Typography>
                <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                  Cancel Transaction
                </Button>
              </>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
