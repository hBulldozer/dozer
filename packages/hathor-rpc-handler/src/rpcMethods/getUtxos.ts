/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { HathorWallet } from '@hathor/wallet-lib';
import {
  GetUtxosConfirmationResponse,
  GetUtxosRpcRequest,
  TriggerHandler,
  RequestMetadata,
  UtxoDetails,
  RpcResponseTypes,
  RpcResponse,
} from '../types';
import { PromptRejectedError } from '../errors';
import { TriggerTypes } from '../types';
import { validateNetwork } from '../helpers';

/**
 * Handles the 'htr_getUtxos' RPC request by prompting the user for confirmation
 * and returning the UTXO details if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the UTXOs.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The UTXO details from the wallet if the user confirms.
 *
 * @throws {InvalidRpcMethod} If the RPC request method is not 'htr_getUtxos'.
 * @throws {Error} If the method is not implemented in the wallet-service facade.
 * @throws {PromptRejectedError} If the user rejects the prompt.
 */
export async function getUtxos(
  rpcRequest: GetUtxosRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  validateNetwork(wallet, rpcRequest.params.network);

  const options = {
    'token': rpcRequest.params.token,
     // Defaults to 0 otherwise the lib fails
    'authorities': rpcRequest.params.authorities || 0,
    'max_utxos': rpcRequest.params.maxUtxos,
    'filter_address': rpcRequest.params.filterAddress,
    'amount_smaller_than': rpcRequest.params.amountSmallerThan,
    'amount_bigger_than': rpcRequest.params.amountBiggerThan,
    'max_amount': rpcRequest.params.maximumAmount,
    'only_available_utxos': rpcRequest.params.onlyAvailableUtxos,
  };

  // We have the same issues here that we do have in the headless wallet:
  // TODO: Memory usage enhancements are required here as wallet.getUtxos can cause issues on
  // wallets with a huge amount of utxos.
  // TODO: This needs to be paginated.
  const utxoDetails: UtxoDetails[] = await wallet.getUtxos(options);

  const confirmed = await promptHandler({
    type: TriggerTypes.GetUtxosConfirmationPrompt,
    method: rpcRequest.method,
    data: utxoDetails
  }, requestMetadata) as GetUtxosConfirmationResponse;

  if (!confirmed.data) {
    throw new PromptRejectedError();
  }

  return {
    type: RpcResponseTypes.GetUtxosResponse,
    response: utxoDetails,
  } as RpcResponse;
}
