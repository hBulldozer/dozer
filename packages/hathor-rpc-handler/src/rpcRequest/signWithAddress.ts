/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  RpcMethods,
  SignWithAddressRpcRequest,
} from '../types';

export function signWithAddressRpcRequest(
  network: string,
  message: string,
  addressIndex: number,
): SignWithAddressRpcRequest {
  return {
    method: RpcMethods.SignWithAddress,
    params: {
      network,
      message,
      addressIndex,
    }
  };
}
