import { constants } from '@hathor/wallet-lib';
import {
  GetAddressRpcRequest,
  GetBalanceRpcRequest,
  GetConnectedNetworkRpcRequest,
  GetUtxosRpcRequest,
  RpcMethods,
  SignOracleDataRpcRequest,
  SignWithAddressRpcRequest,
} from '../../src/types';

export const mockGetBalanceRequest: GetBalanceRpcRequest = {
  method: RpcMethods.GetBalance,
  params: {
    network: 'mainnet',
    tokens: [constants.NATIVE_TOKEN_UID],
  },
};

export const mockGetAddressRequest: GetAddressRpcRequest = {
  method: RpcMethods.GetAddress,
  params: {
    network: 'mainnet',
    type: 'index',
    index: 1,
  }
};

export const mockGetUtxosRequest: GetUtxosRpcRequest = {
  method: RpcMethods.GetUtxos,
  params: {
    network: 'mainnet',
    token: 'mock_token',
    maxUtxos: 10,
    filterAddress: 'mock_address',
    amountSmallerThan: 1000,
    amountBiggerThan: 10,
    maximumAmount: 10000,
    onlyAvailableUtxos: true,
  },
};

export const mockSignWithAddressRequest: SignWithAddressRpcRequest = {
  method: RpcMethods.SignWithAddress,
  params: {
    network: 'mainnet',
    addressIndex: 0,
    message: 'Test message',
  },
};

export const mockSignOracleDataRequest: SignOracleDataRpcRequest = {
  method: RpcMethods.SignOracleData,
  params: {
    network: 'mainnet',
    oracle: 'address1',
    data: 'Test oracle data',
  },
};

export const mockGetConnectedNetworkRequest: GetConnectedNetworkRpcRequest = {
  method: RpcMethods.GetConnectedNetwork,
};

export const mockPromptHandler = jest.fn();
