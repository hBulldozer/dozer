/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { NanoContractAction } from '@hathor/wallet-lib/lib/nano_contracts/types';
import {
  RpcMethods,
  SendNanoContractRpcRequest,
} from '../types';

export function sendNanoContractTxRpcRequest(
  method: string,
  blueprintId: string,
  actions: NanoContractAction[],
  args: unknown[],
  pushTx: boolean,
  ncId: string | null,
): SendNanoContractRpcRequest {
  return {
    method: RpcMethods.SendNanoContractTx,
    params: {
      method,
      blueprint_id: blueprintId,
      actions,
      args,
      push_tx: pushTx,
      nc_id: ncId,
    }
  };
}
