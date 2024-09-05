/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { HathorWallet } from '@hathor/wallet-lib';
import type { GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import {
  TriggerTypes,
  GetBalanceConfirmationPrompt,
  GetBalanceRpcRequest,
  TriggerHandler,
  RequestMetadata,
  RpcResponseTypes,
  RpcResponse,
} from '../types';
import { NotImplementedError, PromptRejectedError } from '../errors';
import { validateNetwork } from '../helpers';

/**
 * Gets the balance for specified tokens using the provided wallet.
 *
 * @param rpcRequest - The RPC request containing the parameters for getting the balance.
 * @param wallet - The wallet instance to use for retrieving the balance.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - A function to handle prompts for user confirmation.
 *
 * @returns The balances of the specified tokens.
 *
 * @throws {NotImplementedError} - If address indexes are specified, which is not implemented.
 * @throws {PromptRejectedError} - If the user rejects the balance confirmation prompt.
 */
export async function getBalance(
  rpcRequest: GetBalanceRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const { network, tokens, addressIndexes } = rpcRequest.params;

  if (addressIndexes) {
    throw new NotImplementedError();
  }

  validateNetwork(wallet, network);

  const balances: GetBalanceObject[] = await Promise.all(
    tokens.map(token => wallet.getBalance(token)),
  );

  const prompt: GetBalanceConfirmationPrompt = {
    type: TriggerTypes.GetBalanceConfirmationPrompt,
    method: rpcRequest.method,
    data: balances
  };

  const confirmed = await promptHandler(prompt, requestMetadata);

  if (!confirmed) {
    throw new PromptRejectedError();
  }

  return {
    type: RpcResponseTypes.GetBalanceResponse,
    response: balances,
  } as RpcResponse;
}
