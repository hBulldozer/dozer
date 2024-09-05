/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { HathorWallet } from '@hathor/wallet-lib';
import { 
  GetConnectedNetworkRpcRequest,
  RequestMetadata,
  RpcResponse,
  RpcResponseTypes,
  TriggerHandler,
} from '../types';

/**
 * Handles the 'get_connected_network' RPC request by retrieving the network information
 * from the wallet and returning the network name and genesis hash.
 * 
 * @param _rpcRequest - (unused) The RPC request object containing the method and parameters.
 * @param wallet - The Hathor wallet instance used to get the network information.
 *
 * @returns An object containing the network name and genesis hash.
 */
export async function getConnectedNetwork(
  _rpcRequest: GetConnectedNetworkRpcRequest,
  wallet: HathorWallet,
  _requestMetadata: RequestMetadata,
  _promptHandler: TriggerHandler,
) {
  const network: string = wallet.getNetwork();

  const result = {
    network,
    genesisHash: '', // TODO
  };

  return {
    type: RpcResponseTypes.GetConnectedNetworkResponse,
    response: result,
  } as RpcResponse;
}
