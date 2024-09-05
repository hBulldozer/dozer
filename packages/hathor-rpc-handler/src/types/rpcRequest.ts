/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';

export enum RpcMethods {
  CreateToken = 'htr_createToken',
  GetUtxos = 'htr_getUtxos',
  SignWithAddress = 'htr_signWithAddress',
  GetBalance = 'htr_getBalance',
  GetConnectedNetwork = 'htr_getConnectedNetwork',
  GetAddress = 'htr_getAddress',
  PushTxHex = 'htr_pushTxHex',
  GetOperationStatus = 'htr_getOperationStatus',
  SendNanoContractTx = 'htr_sendNanoContractTx',
  SignOracleData = 'htr_signOracleData',
}

export interface CreateTokenRpcRequest {
  method: RpcMethods.CreateToken,
  params: {
    name: string;
    symbol: string;
    amount: number;
    address?: string;
    change_address?: string;
    create_mint: boolean;
    mint_authority_address?: string;
    allow_external_mint_authority_address?: boolean;
    create_melt: boolean;
    melt_authority_address?: string;
    allow_external_melt_authority_address?: boolean;
    push_tx: boolean;
    network: string;
    data?: string[];
  }
}

export interface GetAddressRpcRequest {
  method: RpcMethods.GetAddress,
  params: {
    type: 'first_empty' | 'full_path' | 'index' | 'client';
    index?: number;
    full_path?: string;
    network: string;
  }
}

export interface GetBalanceRpcRequest {
  method: RpcMethods.GetBalance,
  params: {
    network: string;
    tokens: string[];
    addressIndexes?: number[];
  };
}

export interface GetUtxosRpcRequest {
  method: RpcMethods.GetUtxos,
  params: {
    network: string;
    maxUtxos: number;
    token: string;
    filterAddress: string;
    authorities?: number | null;
    amountSmallerThan?: number | null;
    amountBiggerThan?: number | null;
    maximumAmount?: number | null;
    onlyAvailableUtxos: boolean;
  };
}

export interface SignWithAddressRpcRequest {
  method: RpcMethods.SignWithAddress,
  params: {
    network: string;
    message: string;
    addressIndex: number;
  }
}

export interface SignOracleDataRpcRequest {
  method: RpcMethods.SignOracleData,
  params: {
    network: string;
    data: string;
    oracle: string;
  }
}

export interface SendNanoContractRpcRequest {
  method: RpcMethods.SendNanoContractTx,
  params: {
    method: string;
    blueprint_id: string;
    nc_id: string | null;
    actions: NanoContractAction[],
    args: unknown[];
    push_tx: boolean;
  }
}

export type RequestMetadata = {
  [key: string]: string,
};

export interface GetConnectedNetworkRpcRequest {
  method: RpcMethods.GetConnectedNetwork,
}

export interface GenericRpcRequest {
  method: string;
  params?: unknown | null;
}

export type RpcRequest = GetAddressRpcRequest
  | GetBalanceRpcRequest
  | GetUtxosRpcRequest
  | SignWithAddressRpcRequest
  | SendNanoContractRpcRequest
  | GetConnectedNetworkRpcRequest
  | GenericRpcRequest
  | SignOracleDataRpcRequest;

