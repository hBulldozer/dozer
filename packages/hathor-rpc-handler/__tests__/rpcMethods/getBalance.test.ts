/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { NotImplementedError, PromptRejectedError } from '../../src/errors';
import { getBalance } from '../../src/rpcMethods/getBalance';
import { HathorWallet } from '@hathor/wallet-lib';
import { TriggerTypes, GetBalanceRpcRequest, RpcMethods } from '../../src/types';

const mockedTokenBalance: GetBalanceObject[] = [{
  token: {
    id: 'moon-id',
    name: 'MOON TOKEN',
    symbol: 'MOON',
  },
  balance: {
    unlocked: 0,
    locked: 0,
  },
  tokenAuthorities: {
    unlocked: {
      mint: false,
      melt: false,
    },
    locked: {
      mint: false,
      melt: false,
    }
  },
  transactions: 0,
  lockExpires: null,
}];

const BaseRpcCall = {
  jsonrpc: '2.0',
  id: '3',
};

describe('getBalance', () => {
  let wallet: jest.Mocked<HathorWallet>;
  let promptHandler: jest.Mock;

  beforeEach(() => {
    wallet = {
      getBalance: jest.fn().mockReturnValue(Promise.resolve(mockedTokenBalance)),
      getNetwork: jest.fn().mockReturnValue('mainnet')
    } as unknown as HathorWallet;
    promptHandler = jest.fn();
  });

  it('should throw NotImplementedError if addressIndexes are specified', async () => {
    const rpcRequest: GetBalanceRpcRequest = {
      ...BaseRpcCall,
      params: {
        network: 'mainnet',
        tokens: ['token1'],
        addressIndexes: [0],
      },
      method: RpcMethods.GetBalance,
    };

    await expect(getBalance(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(NotImplementedError);
  });

  it('should return balances of specified tokens', async () => {
    const rpcRequest: GetBalanceRpcRequest = {
      ...BaseRpcCall,
      params: { network: 'mainnet', tokens: ['token1', 'token2'], addressIndexes: undefined },
      method: RpcMethods.GetBalance,
    };

    promptHandler.mockResolvedValue(true);

    const balances = await getBalance(rpcRequest, wallet, {}, promptHandler);

    expect(balances.response).toEqual([mockedTokenBalance, mockedTokenBalance]);
    expect(wallet.getBalance).toHaveBeenCalledWith('token1');
    expect(wallet.getBalance).toHaveBeenCalledWith('token2');
    expect(promptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.GetBalanceConfirmationPrompt,
      method: RpcMethods.GetBalance,
      data: [mockedTokenBalance, mockedTokenBalance],
    }, {});
  });

  it('should throw PromptRejectedError if balance confirmation is rejected', async () => {
    const rpcRequest: GetBalanceRpcRequest = {
      ...BaseRpcCall,
      params: {
        network: 'mainnet',
        tokens: ['token1'],
        addressIndexes: undefined,
      },
      method: RpcMethods.GetBalance,
    };
    wallet.getBalance.mockResolvedValue({ token: 'token1', balance: 100 });
    promptHandler.mockResolvedValue(false);

    await expect(getBalance(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(PromptRejectedError);
  });
});
