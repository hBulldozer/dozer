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
  const [amount, setAmount] = useState<string>('')
  const maxAmount = oasis?.user_deposit_b ?? 0

  if (!oasis) return null

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Dialog.Content className="max-w-sm !pb-4">
        <Dialog.Header border={false} title="Remove Liquidity" onClose={() => setOpen(false)} />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8">
              <img src={`/logos/${oasis.token.symbol}.svg`} alt={oasis.token.symbol} />
            </div>
            <Typography variant="h3">{oasis.token.symbol}</Typography>
          </div>

          <div className="flex flex-col gap-2">
            <Typography variant="sm" className="text-stone-400">
              Amount to remove (max: {maxAmount} {oasis.token.symbol})
            </Typography>
            <Input.Numeric value={amount} onUserInput={(val: string) => setAmount(val)} className="w-full" />
          </div>

          <div className="p-4 mt-2 bg-stone-800 rounded-xl">
            <div className="flex justify-between mb-2">
              <Typography variant="sm" className="text-stone-400">
                Current Position:
              </Typography>
              <Typography variant="sm">
                {oasis.user_deposit_b} {oasis.token.symbol}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="sm" className="text-stone-400">
                Position After Removal:
              </Typography>
              <Typography variant="sm">
                {(oasis.user_deposit_b - Number(amount || 0)).toFixed(2)} {oasis.token.symbol}
              </Typography>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="md"
              disabled={isRpcRequestPending || !amount || Number(amount) > maxAmount}
              fullWidth
              onClick={async () => {
                await onConfirm(amount)
                setAmount('')
              }}
            >
              {isRpcRequestPending ? <Dots>Confirm transaction in your wallet</Dots> : 'Remove Liquidity'}
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
                  HTR Match:
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
