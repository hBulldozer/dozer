/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet, Transaction } from '@hathor/wallet-lib';
import {
  CreateTokenConfirmationPrompt,
  CreateTokenConfirmationResponse,
  CreateTokenLoadingFinishedTrigger,
  CreateTokenLoadingTrigger,
  CreateTokenRpcRequest,
  PinConfirmationPrompt,
  PinRequestResponse,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
  TriggerHandler,
  TriggerTypes,
} from '../types';
import { CreateTokenError, PromptRejectedError } from '../errors';

/**
 * Handles the creation of a new token on the Hathor blockchain.
 *
 * This function orchestrates the entire token creation process, including
 * validating addresses, prompting for user confirmation and PIN code, and 
 * interacting with the wallet library to create the token. It supports 
 * optional parameters for mint and melt authorities, and allows for 
 * customization of the token creation process.
 *
 * @param {CreateTokenRpcRequest} rpcRequest - The RPC request object containing the token details, including
 *   the token name, symbol, amount, and various options related to minting and melting.
 * @param wallet - The wallet instance that will be used to create the token.
 * @param requestMetadata - Metadata associated with the request, such as the request ID 
 *   and other contextual information.
 * @param triggerHandler - A function that handles triggering user prompts, such as
 *   confirmations and PIN entry.
 *
 * @returns An object containing transaction details of the created token.
 */
export async function createToken(
  rpcRequest: CreateTokenRpcRequest,
  wallet: HathorWallet,
  requestMetadata: RequestMetadata,
  triggerHandler: TriggerHandler,
) {
  const { name, symbol, amount } = rpcRequest.params;
  const address = rpcRequest.params.address || null;
  const changeAddress = rpcRequest.params.change_address || null;
  const createMint = rpcRequest.params.create_mint ?? true;
  const mintAuthorityAddress = rpcRequest.params.mint_authority_address || null;
  const allowExternalMintAuthorityAddress = rpcRequest.params.allow_external_mint_authority_address || false;
  const createMelt = rpcRequest.params.create_melt ?? true;
  const meltAuthorityAddress = rpcRequest.params.melt_authority_address || null;
  const allowExternalMeltAuthorityAddress = rpcRequest.params.allow_external_melt_authority_address || false;
  const data = rpcRequest.params.data || null;

  if (changeAddress && !await wallet.isAddressMine(changeAddress)) {
    throw new Error('Change address is not from this wallet');
  }

  const pinPrompt: PinConfirmationPrompt = {
    type: TriggerTypes.PinConfirmationPrompt,
    method: rpcRequest.method,
  };

  const createTokenPrompt: CreateTokenConfirmationPrompt = {
    type: TriggerTypes.CreateTokenConfirmationPrompt,
    method: rpcRequest.method,
    data: {
      name,
      symbol,
      amount,
      address,
      changeAddress,
      createMint,
      mintAuthorityAddress,
      allowExternalMintAuthorityAddress,
      createMelt,
      meltAuthorityAddress,
      allowExternalMeltAuthorityAddress,
      data,
    },
  };

  const createTokeResponse = await triggerHandler(createTokenPrompt, requestMetadata) as CreateTokenConfirmationResponse;

  if (!createTokeResponse.data.accepted) {
    throw new PromptRejectedError();
  }

  const pinCodeResponse: PinRequestResponse = (await triggerHandler(pinPrompt, requestMetadata)) as PinRequestResponse;

  if (!pinCodeResponse.data.accepted) {
    throw new PromptRejectedError('Pin prompt rejected');
  }

  try {
    const createTokenLoadingTrigger: CreateTokenLoadingTrigger = {
      type: TriggerTypes.CreateTokenLoadingTrigger,
    };

    // No need to await as this is a fire-and-forget trigger
    triggerHandler(createTokenLoadingTrigger, requestMetadata);

    const response: Transaction = await wallet.createNewToken(
      name,
      symbol,
      amount,
      {
        changeAddress,
        address,
        createMint,
        mintAuthorityAddress,
        allowExternalMintAuthorityAddress,
        createMelt,
        meltAuthorityAddress,
        allowExternalMeltAuthorityAddress,
        data,
        pinCode: pinCodeResponse.data.pinCode,
      }
    );

    const createTokenLoadingFinished: CreateTokenLoadingFinishedTrigger = {
      type: TriggerTypes.CreateTokenLoadingFinishedTrigger,
    };
    triggerHandler(createTokenLoadingFinished, requestMetadata);

    return {
      type: RpcResponseTypes.CreateTokenResponse,
      response,
    } as RpcResponse;

  } catch (err) {
    if (err instanceof Error) {
      throw new CreateTokenError(err.message);
    } else {
      throw new CreateTokenError('An unknown error occurred');
    }
  }
}
