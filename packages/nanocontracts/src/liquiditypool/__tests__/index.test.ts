import { sendNanoContractTxRpcRequest } from '@hathor/hathor-rpc-handler'
import { describe, expect, it, jest } from '@jest/globals'

import { IHathorRpc } from '../../types'
import { PoolManager } from '..'

jest.mock('@hathor/hathor-rpc-handler', () => ({
  sendNanoContractTxRpcRequest: jest.fn(() => ({ params: {} })),
}))

describe('PoolManager.withdrawCashback', () => {
  it('preserves contract balances when converting token amounts back to cents', async () => {
    const hathorRpc = {
      sendNanoContractTx: jest.fn(async () => ({})),
    } as unknown as IHathorRpc
    const poolManager = new PoolManager('contract-id', 'blueprint-id')

    await poolManager.withdrawCashback(
      hathorRpc,
      'address',
      'token-a/token-b/8',
      'token-a',
      258.85,
      'token-b',
      0.76,
      'mainnet'
    )

    const actions = jest.mocked(sendNanoContractTxRpcRequest).mock.calls[0]?.[2]

    expect(actions).toEqual([
      expect.objectContaining({ token: 'token-a', amount: '25885' }),
      expect.objectContaining({ token: 'token-b', amount: '76' }),
    ])
  })
})
