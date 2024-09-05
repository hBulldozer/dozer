/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  HathorWallet,
  nanoUtils,
  bufferUtils,
  NanoContractSerializer,
} from '@hathor/wallet-lib';
import {
  TriggerHandler,
  RequestMetadata,
  SignOracleDataRpcRequest,
  PinRequestResponse,
  PinConfirmationPrompt,
  TriggerTypes,
  RpcResponseTypes,
  SignOracleDataResponse,
  SignOracleDataConfirmationPrompt,
  SignOracleDataConfirmationResponse,
} from '../types';
import { validateNetwork } from '../helpers';
import { PromptRejectedError } from '../errors';

export async function signOracleData(
  rpcRequest: SignOracleDataRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const { network, oracle, data } = rpcRequest.params;

  validateNetwork(wallet, network);

  const prompt: SignOracleDataConfirmationPrompt = {
    type: TriggerTypes.SignOracleDataConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      oracle,
      data,
    }
  };

  const signResponse = await promptHandler(prompt, requestMetadata) as SignOracleDataConfirmationResponse;

  if (!signResponse.data) {
    throw new PromptRejectedError('User rejected sign oracle data prompt');
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  const oracleData = nanoUtils.getOracleBuffer(oracle, wallet.getNetworkObject());
  const nanoSerializer = new NanoContractSerializer();
  const dataSerialized = nanoSerializer.serializeFromType(data, 'str');

  // TODO getOracleInputData method should be able to receive the PIN as optional parameter as well
  wallet.pinCode = pinResponse.data.pinCode;
  const inputData = await nanoUtils.getOracleInputData(oracleData, dataSerialized, wallet);
  const signature = `${bufferUtils.bufferToHex(inputData)},${data},str`;

  return {
    type: RpcResponseTypes.SignOracleDataResponse,
    response: {
      data,
      signature,
      oracle,
    }
  } as SignOracleDataResponse;
}
