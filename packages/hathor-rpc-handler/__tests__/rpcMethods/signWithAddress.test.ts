/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { HathorWallet } from '@hathor/wallet-lib';
import { PromptRejectedError } from '../../src/errors';
import { signWithAddress } from '../../src/rpcMethods/signWithAddress';
import { TriggerTypes, TriggerResponseTypes, RpcResponseTypes } from '../../src/types';
import { mockPromptHandler, mockSignWithAddressRequest } from '../mocks';
import { AddressInfoObject } from '@hathor/wallet-lib/lib/wallet/types';

const mockedAddressInfo: AddressInfoObject = {
  address: 'address1',
  addressPath: 'm/123/123',
  index: 0,
  info: undefined,
};

describe('signWithAddress', () => {
  let wallet: jest.Mocked<HathorWallet>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    wallet = {
      getAddressAtIndex: jest.fn().mockResolvedValue(mockedAddressInfo.address),
      signMessageWithAddress: jest.fn().mockResolvedValue('signed_message'),
      getNetwork: jest.fn().mockReturnValue('mainnet'),
      getAddressIndex: jest.fn().mockResolvedValue(mockedAddressInfo.index),
      getAddressPathForIndex: jest.fn().mockResolvedValue(mockedAddressInfo.addressPath),
    } as unknown as HathorWallet;
  });

  it('should return signed message if user confirms and provides PIN', async () => {
    mockPromptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse,
        data: true,
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode: 'mock_pin',
        },
      });

    const result = await signWithAddress(mockSignWithAddressRequest, wallet, {}, mockPromptHandler);

    expect(wallet.getAddressAtIndex).toHaveBeenCalledWith(0);

    expect(mockPromptHandler).toHaveBeenNthCalledWith(1, {
      type: TriggerTypes.SignMessageWithAddressConfirmationPrompt,
      method: mockSignWithAddressRequest.method,
      data: {
        address: mockedAddressInfo,
        message: 'Test message',
      },
    }, {});

    expect(mockPromptHandler).toHaveBeenNthCalledWith(2, {
      type: TriggerTypes.PinConfirmationPrompt,
      method: mockSignWithAddressRequest.method,
    }, {});

    expect(wallet.signMessageWithAddress).toHaveBeenCalledWith('Test message', 0, 'mock_pin');
    expect(result).toStrictEqual({
      type: RpcResponseTypes.SendWithAddressResponse,
      response: {
        address: mockedAddressInfo,
        message: 'Test message',
        signature: 'signed_message',
      },
    });
  });

  it('should throw PromptRejectedError if user rejects address confirmation', async () => {
    mockPromptHandler.mockResolvedValueOnce(false);

    await expect(signWithAddress(mockSignWithAddressRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(wallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.SignMessageWithAddressConfirmationPrompt,
      method: mockSignWithAddressRequest.method,
      data: {
        address: mockedAddressInfo,
        message: 'Test message',
      },
    }, {});
    expect(mockPromptHandler).not.toHaveBeenCalledWith({
      method: mockSignWithAddressRequest.method,
    });
    expect(wallet.signMessageWithAddress).not.toHaveBeenCalled();
  });

  it('should throw PromptRejectedError if user rejects PIN prompt', async () => {
    mockPromptHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.SignMessageWithAddressConfirmationResponse,
        data: true,
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: false,
        },
      }); 

    await expect(signWithAddress(mockSignWithAddressRequest, wallet, {}, mockPromptHandler)).rejects.toThrow(PromptRejectedError);
    expect(wallet.getAddressAtIndex).toHaveBeenCalledWith(0);
    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.SignMessageWithAddressConfirmationPrompt,
      method: mockSignWithAddressRequest.method,
      data: {
        address: mockedAddressInfo,
        message: 'Test message',
      },
    }, {});
    expect(mockPromptHandler).toHaveBeenCalledWith({
      type: TriggerTypes.PinConfirmationPrompt,
      method: mockSignWithAddressRequest.method,
    }, {});
    expect(wallet.signMessageWithAddress).not.toHaveBeenCalled();
  });
});
