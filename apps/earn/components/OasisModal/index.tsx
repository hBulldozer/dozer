import React, { useState } from 'react'
import { Dialog, Typography, Button, Input } from '@dozer/ui'
import { Dots } from '@dozer/ui'
import { OasisAddModalProps, OasisRemoveModalProps } from './types'

export const OasisRemoveModal: React.FC<OasisRemoveModalProps> = ({
  open,
  setOpen,
  oasis,
  onConfirm,
  isRpcRequestPending,
  onReset,
}) => {
  if (!oasis) return null
  const maxAmountB = oasis?.max_withdraw_b ?? 0
  const maxAmountHTR = oasis?.max_withdraw_htr ?? 0

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Withdraw Position" onClose={() => setOpen(false)} />
        <div className="flex flex-col gap-4 p-4">
          <div className="mb-2 bg-stone-800 rounded-xl">
            <Typography variant="sm" weight={600} className="mb-3 text-stone-300">
              You will receive:
            </Typography>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    <img src={`/logos/${oasis.token.symbol}.svg`} alt={oasis.token.symbol} />
                  </div>
                  <Typography variant="sm" className="text-stone-300">
                    {oasis.token.symbol}:
                  </Typography>
                </div>
                <Typography variant="base" weight={500} className="text-yellow">
                  {maxAmountB.toFixed(2)}
                </Typography>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    <img src="/logos/HTR.svg" alt="HTR" />
                  </div>
                  <Typography variant="sm" className="text-stone-300">
                    HTR:
                  </Typography>
                </div>
                <Typography variant="base" weight={500} className="text-yellow">
                  {maxAmountHTR.toFixed(2)}
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
                await onConfirm(maxAmountB.toFixed(2), maxAmountHTR.toFixed(2))
              }}
            >
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Withdraw Position'}
            </Button>
            {isRpcRequestPending && (
              <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                Cancel Transaction
              </Button>
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
          <div className="flex items-center gap-4">
            <div className="w-8 h-8">
              <img src="/logos/HTR.svg" alt="HTR" />
            </div>
            <Typography variant="h3">HTR Bonus</Typography>
          </div>

          <div className="p-4 mt-2 bg-stone-800 rounded-xl">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Typography variant="base" weight={500} className="text-yellow">
                  {maxAmount.toFixed(2)} HTR
                </Typography>
              </div>
              <Typography variant="xs" className="text-stone-400">
                From your {oasis.token.symbol} position
              </Typography>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="md"
              disabled={isRpcRequestPending || maxAmount <= 0}
              fullWidth
              onClick={async () => {
                await onConfirm(maxAmount.toFixed(2), '0')
              }}
            >
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Withdraw Bonus'}
            </Button>
            {isRpcRequestPending && (
              <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                Cancel Transaction
              </Button>
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
          <div className="flex items-center gap-4">
            <div className="w-8 h-8">
              <img src={`/logos/${token}.svg`} alt={token} />
            </div>
            <Typography variant="h3">{token}</Typography>
          </div>

          <div className="p-4 bg-stone-800 rounded-xl">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Amount to Lock:
                </Typography>
                <Typography variant="sm">
                  {amount} {token}
                </Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  HTR matched:
                </Typography>
                <Typography variant="sm">{htrMatch.toFixed(2)} HTR</Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Bonus:
                </Typography>
                <Typography variant="sm">{bonus.toFixed(2)} HTR</Typography>
              </div>
              <div className="flex justify-between">
                <Typography variant="sm" className="text-stone-400">
                  Unlock Date:
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
              <Button size="md" fullWidth variant="outlined" color="red" onClick={onReset}>
                Cancel Transaction
              </Button>
            )}
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
