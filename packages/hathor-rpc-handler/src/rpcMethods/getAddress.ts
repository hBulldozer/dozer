/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { HathorWallet } from '@hathor/wallet-lib';
import {
  AddressRequestClientResponse,
  TriggerTypes,
  GetAddressRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
} from '../types';
import { NotImplementedError, PromptRejectedError } from '../errors';
import { validateNetwork } from '../helpers';
import type { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';

/**
 * Gets an address based on the provided rpcRequest and wallet.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting an address.
 * @param wallet - The wallet instance to use for retrieving the address.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The address retrieved based on the request parameters.
 *
 * @throws {NotImplementedError} - If the request type is 'full_path', which is not implemented.
 * @throws {PromptRejectedError} - If the user rejects the address confirmation prompt.
 */
export async function getAddress(
  rpcRequest: GetAddressRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  validateNetwork(wallet, rpcRequest.params.network);

  const { type, index } = rpcRequest.params;
  let address: string;

  switch (type) {
    case 'first_empty':
      address = await wallet.getCurrentAddress();
    break;
    case 'full_path':
      throw new NotImplementedError();
    case 'index':
      address = await wallet.getAddressAtIndex(index);
    break;
    case 'client': {
      const response = (await promptHandler({
        type: TriggerTypes.AddressRequestClientPrompt,
        method: rpcRequest.method,
      }, requestMetadata)) as AddressRequestClientResponse;

      address = response.data.address;
    }
    break;
  }

  // We already confirmed with the user and he selected the address he wanted
  // to share. No need to double check
  if (type !== 'client') {
    const confirmed = await promptHandler({
      type: TriggerTypes.AddressRequestPrompt,
      method: rpcRequest.method,
      data: {
        address,
      }
    }, requestMetadata);

    if (!confirmed) {
      throw new PromptRejectedError();
    }
  }

  return {
    type: RpcResponseTypes.GetAddressResponse,
    response: address as unknown as AddressInfoObject,
  } as RpcResponse;
}
