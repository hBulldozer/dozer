/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  RpcMethods,
  SignOracleDataRpcRequest,
} from '../types';

export function signOracleDataRpcRequest(
  network: string,
  data: string,
  oracle: string,
): SignOracleDataRpcRequest {
  return {
    method: RpcMethods.SignOracleData,
    params: {
      network,
      data,
      oracle,
    }
  };
}
