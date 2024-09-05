/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { AddressInfoObject, GetBalanceObject } from '@hathor/wallet-lib/lib/wallet/types';
import { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { RequestMetadata } from './rpcRequest';

export enum TriggerTypes {
  GetBalanceConfirmationPrompt,
  SignMessageWithAddressConfirmationPrompt,
  PinConfirmationPrompt,
  AddressRequestPrompt,
  GenericConfirmationPrompt,
  AddressRequestClientPrompt,
  GetUtxosConfirmationPrompt,
  SendNanoContractTxConfirmationPrompt,
  GenericLoadingTrigger,
  SendNanoContractTxLoadingTrigger,
  SendNanoContractTxErrorTrigger,
  SendNanoContractTxSuccessTrigger,
  SendNanoContractTxLoadingFinishedTrigger,
  CreateTokenLoadingFinishedTrigger,
  LoadingFinishedTrigger,
  CreateTokenConfirmationPrompt,
  CreateTokenLoadingTrigger,
  SignOracleDataConfirmationPrompt,
}

export enum TriggerResponseTypes {
  AddressRequestClientResponse,
  PinRequestResponse,
  GetUtxosConfirmationResponse,
  SignMessageWithAddressConfirmationResponse,
  SendNanoContractTxConfirmationResponse,
  CreateTokenConfirmationResponse,
  SignOracleDataConfirmationResponse,
}

export type Trigger =
  GetAddressConfirmationPrompt
  | AddressRequestClientPrompt
  | GetBalanceConfirmationPrompt
  | GetUtxosConfirmationPrompt
  | PinConfirmationPrompt
  | AddressRequestPrompt
  | GenericConfirmationPrompt
  | SignMessageWithAddressConfirmationPrompt
  | SendNanoContractTxConfirmationPrompt
  | SendNanoContractTxLoadingTrigger
  | SendNanoContractTxLoadingFinishedTrigger
  | SendNanoContractTxSuccessTrigger
  | SendNanoContractTxErrorTrigger
  | LoadingFinishedTrigger
  | CreateTokenConfirmationPrompt
  | CreateTokenLoadingTrigger
  | CreateTokenLoadingFinishedTrigger
  | SignOracleDataConfirmationPrompt;

export interface BaseLoadingTrigger {
  type: TriggerTypes;
}

export interface SendNanoContractTxLoadingTrigger {
  type: TriggerTypes.SendNanoContractTxLoadingTrigger;
}

export interface SendNanoContractTxErrorTrigger {
  type: TriggerTypes.SendNanoContractTxErrorTrigger;
}

export interface SendNanoContractTxSuccessTrigger {
  type: TriggerTypes.SendNanoContractTxSuccessTrigger;
}

export interface CreateTokenLoadingTrigger {
  type: TriggerTypes.CreateTokenLoadingTrigger;
}

export interface SendNanoContractTxLoadingFinishedTrigger {
  type: TriggerTypes.SendNanoContractTxLoadingFinishedTrigger;
}

export interface CreateTokenLoadingFinishedTrigger {
  type: TriggerTypes.CreateTokenLoadingFinishedTrigger;
}

export interface LoadingFinishedTrigger {
  type: TriggerTypes.LoadingFinishedTrigger;
}

export interface BaseConfirmationPrompt {
  type: TriggerTypes;
  method: string;
}

export interface GetAddressConfirmationPrompt extends BaseConfirmationPrompt {
  data: {
    address: string;
  }
}

export interface GetBalanceConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.GetBalanceConfirmationPrompt;
  data: GetBalanceObject[];
}

export interface GetUtxosConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.GetUtxosConfirmationPrompt;
  data: UtxoDetails[];
}

export interface SignOracleDataConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.SignOracleDataConfirmationPrompt;
  data: {
    oracle: string;
    data: string;
  }
}

export interface SignMessageWithAddressConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.SignMessageWithAddressConfirmationPrompt;
  data: {
    address: AddressInfoObject;
    message: string;
  }
}

export interface PinConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.PinConfirmationPrompt;
}

export interface AddressRequestPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.AddressRequestPrompt;
  data?: {
    address: string;
  }
}

export interface AddressRequestClientPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.AddressRequestClientPrompt;
}

export interface NanoContractParams {
  blueprintId: string;
  ncId: string | null;
  actions: NanoContractAction[],
  method: string;
  args: unknown[];
  pushTx: boolean;
}

export interface CreateTokenParams {
  name: string,
  symbol: string,
  amount: number,
  address: string | null,
  changeAddress: string | null,
  createMint: boolean,
  mintAuthorityAddress: string | null,
  allowExternalMintAuthorityAddress: boolean,
  createMelt: boolean,
  meltAuthorityAddress: string | null,
  allowExternalMeltAuthorityAddress: boolean,
  data: string[] | null,
}

export interface CreateTokenConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.CreateTokenConfirmationPrompt;
  data: CreateTokenParams;
}

export interface SendNanoContractTxConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.SendNanoContractTxConfirmationPrompt;
  data: NanoContractParams;
}

export interface GenericConfirmationPrompt extends BaseConfirmationPrompt {
  type: TriggerTypes.GenericConfirmationPrompt;
  data: unknown;
}

export interface AddressRequestClientResponse {
  type: TriggerResponseTypes.AddressRequestClientResponse;
  data: {
    address: string;
  }
}

export interface SendNanoContractTxConfirmationResponse {
  type: TriggerResponseTypes.SendNanoContractTxConfirmationResponse;
  data: {
    accepted: true;
    nc: NanoContractParams & {
      caller: string;
    } 
  } | {
    accepted: false;
  }
}

export interface CreateTokenConfirmationResponse {
  type: TriggerResponseTypes.CreateTokenConfirmationResponse;
  data: {
    accepted: true;
    token: CreateTokenParams;
  } | {
    accepted: false;
  }
}

export interface PinRequestResponse {
  type: TriggerResponseTypes.PinRequestResponse;
  data: {
    accepted: true;
    pinCode: string;
  } | {
    accepted: false;
  }
}

export interface GetUtxosConfirmationResponse {
  type: TriggerResponseTypes.GetUtxosConfirmationResponse;
  data: boolean;
}

export interface SignMessageWithAddressConfirmationResponse {
  type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse;
  data: boolean;
}

export interface SignOracleDataConfirmationResponse {
  type: TriggerResponseTypes.SignOracleDataConfirmationResponse;
  data: boolean;
}

export type TriggerResponse =
  AddressRequestClientResponse
  | GetUtxosConfirmationResponse
  | PinRequestResponse
  | SignMessageWithAddressConfirmationResponse
  | SendNanoContractTxConfirmationResponse
  | CreateTokenConfirmationResponse
  | SignOracleDataConfirmationResponse;

export type TriggerHandler = (prompt: Trigger, requestMetadata: RequestMetadata) => Promise<TriggerResponse | void>;

// TODO: These should come from the lib after we implement the method to
// be common for both facades.
export interface UtxoInfo {
  address: string;
  amount: number;
  tx_id: string;
  locked: boolean;
  index: number;
}

export interface UtxoDetails {
  total_amount_available: number;
  total_utxos_available: number;
  total_amount_locked: number;
  total_utxos_locked: number;
  utxos: UtxoInfo[];
}
