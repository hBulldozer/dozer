/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { sendNanoContractTx } from '../../src/rpcMethods/sendNanoContractTx';
import { TriggerTypes, RpcMethods, SendNanoContractRpcRequest, TriggerResponseTypes, RpcResponseTypes } from '../../src/types';
import { SendNanoContractTxError } from '../../src/errors';

describe('sendNanoContractTx', () => {
  let rpcRequest: SendNanoContractRpcRequest;
  let wallet: HathorWallet;
  let promptHandler = jest.fn();

  beforeEach(() => {
    rpcRequest = {
      method: RpcMethods.SendNanoContractTx,
      id: '1',
      jsonrpc: '2.0',
      params: {
        method: 'initialize',
        blueprint_id: 'blueprint123',
        nc_id: 'nc123',
        actions: [],
        args: [],
        push_tx: true,
      }
    } as SendNanoContractRpcRequest;

    wallet = {
      createAndSendNanoContractTransaction: jest.fn(),
      createNanoContractTransaction: jest.fn(),
    } as unknown as HathorWallet;

    promptHandler = jest.fn();
  });

  it('should send a nano contract transaction successfully', async () => {
    const pinCode = '1234';
    const address = 'address123';
    const response = {
      id: 'mock-id',
      method: 'mock-method',
      args: [],
      pubkey: Buffer.from('pubkey'),
      signature: Buffer.from('signature'),
    };
    const rpcResponse = {
      type: RpcResponseTypes.SendNanoContractTxResponse,
      response,
    };


    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            caller: address,
            blueprintId: rpcRequest.params.blueprint_id,
            ncId: rpcRequest.params.nc_id,
            args: rpcRequest.params.args,
            actions: rpcRequest.params.actions,
          },
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        }
      });

    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockResolvedValue(response);

    const result = await sendNanoContractTx(rpcRequest, wallet, {}, promptHandler);

    expect(promptHandler).toHaveBeenCalledTimes(4);
    expect(promptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.PinConfirmationPrompt,
      method: rpcRequest.method,
    }, {});

    expect(wallet.createAndSendNanoContractTransaction).toHaveBeenCalledWith(
      rpcRequest.params.method,
      address,
      {
        blueprintId: rpcRequest.params.blueprint_id,
        actions: rpcRequest.params.actions,
        args: rpcRequest.params.args,
        ncId: rpcRequest.params.nc_id,
      },
      { pinCode }
    );
    expect(result).toEqual(rpcResponse);
  });

  it('should throw SendNanoContractTxFailure if the transaction fails', async () => {
    const pinCode = '1234';
    const ncData = {
      method: 'initialize',
      blueprintId: rpcRequest.params.blueprint_id,
      ncId: rpcRequest.params.nc_id,
      args: rpcRequest.params.args,
      actions: rpcRequest.params.actions,
    };

    promptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse,
        data: {
          accepted: true,
          nc: {
            ...ncData,
            address: 'address123',
          }
        }
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        }
      });
    (wallet.createAndSendNanoContractTransaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

    await expect(sendNanoContractTx(rpcRequest, wallet, {}, promptHandler)).rejects.toThrow(SendNanoContractTxError);

    expect(promptHandler).toHaveBeenCalledTimes(3);
    expect(promptHandler).toHaveBeenNthCalledWith(1, {
      type: TriggerTypes.SendNanoContractTxConfirmationPrompt,
      method: rpcRequest.method,
      data: {
        ...ncData,
        pushTx: true,
      }
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(2, {
      type: TriggerTypes.PinConfirmationPrompt,
      method: rpcRequest.method,
    }, {});
    expect(promptHandler).toHaveBeenNthCalledWith(3, {
      type: TriggerTypes.SendNanoContractTxLoadingTrigger,
    }, {});
  });
});
