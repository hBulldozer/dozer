/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { HathorWallet } from '@hathor/wallet-lib';
import { DifferentNetworkError } from '../errors';

export function validateNetwork(wallet: HathorWallet, network: string) {
  const currentNetwork = wallet.getNetwork();

  if (currentNetwork !== network) {
    throw new DifferentNetworkError();
  }
}
