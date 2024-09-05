/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import {
  TriggerTypes,
  PinConfirmationPrompt,
  PinRequestResponse,
  TriggerHandler,
  RequestMetadata,
  SignMessageWithAddressConfirmationPrompt,
  SignMessageWithAddressConfirmationResponse,
  SignWithAddressRpcRequest,
  RpcResponseTypes,
  SignWithAddressResponse,
} from '../types';
import { PromptRejectedError } from '../errors';
import { validateNetwork } from '../helpers';
import { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';

/**
 * Handles the 'htr_signWithAddress' RPC request by prompting the user for confirmation
 * and signing the message if confirmed.
 * 
 * @param rpcRequest - The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to sign the message.
 * @param requestMetadata - Metadata related to the dApp that sent the RPC
 * @param promptHandler - The function to handle prompting the user for confirmation.
 *
 * @returns The signed message if the user confirms.
 *
 * @throws {PromptRejectedError} If the user rejects any of the prompts.
 */
export async function signWithAddress(
  rpcRequest: SignWithAddressRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  promptHandler: TriggerHandler,
) {
  const { message, addressIndex, network } = rpcRequest.params;

  validateNetwork(wallet, network);

  const base58: string = await wallet.getAddressAtIndex(addressIndex);
  const addressPath: string = await wallet.getAddressPathForIndex(addressIndex);

  const address: AddressInfoObject = {
    address: base58,
    index: addressIndex,
    addressPath,
    info: undefined, // The type must be updated in the lib to make this optional
  };

  const prompt: SignMessageWithAddressConfirmationPrompt = {
    type: TriggerTypes.SignMessageWithAddressConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      address,
      message: rpcRequest.params.message,
    }
  };

  const signResponse = await promptHandler(prompt, requestMetadata) as SignMessageWithAddressConfirmationResponse;

  if (!signResponse.data) {
    throw new PromptRejectedError('User rejected sign message prompt');
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const pinResponse = await promptHandler(pinPrompt, requestMetadata) as PinRequestResponse;

  if (!pinResponse.data.accepted) {
    throw new PromptRejectedError('User rejected PIN prompt');
  }

  const signature = await wallet.signMessageWithAddress(
    message,
    addressIndex,
    pinResponse.data.pinCode,
  );

  return {
    type: RpcResponseTypes.SendWithAddressResponse,
    response: {
      message,
      signature,
      address,
    }
  } as SignWithAddressResponse;
}
