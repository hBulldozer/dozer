import { HathorWallet } from '@hathor/wallet-lib';
import { createToken } from '../../src/rpcMethods/createToken';
import {
  TriggerTypes,
  RpcMethods,
  CreateTokenRpcRequest,
  TriggerResponseTypes,
  RpcResponseTypes,
} from '../../src/types';
import { CreateTokenError, PromptRejectedError } from '../../src/errors';

function toCamelCase(params: Pick<CreateTokenRpcRequest, 'params'>['params']) {
  return {
    name: params.name,
    symbol: params.symbol,
    changeAddress: params.change_address,
    address: params.address,
    amount: params.amount,
    createMint: params.create_mint,
    mintAuthorityAddress: params.mint_authority_address,
    allowExternalMintAuthorityAddress: params.allow_external_mint_authority_address,
    createMelt: params.create_melt,
    meltAuthorityAddress: params.melt_authority_address,
    allowExternalMeltAuthorityAddress: params.allow_external_melt_authority_address,
    data: params.data,
  };
}

describe('createToken', () => {
  let rpcRequest: CreateTokenRpcRequest;
  let wallet: HathorWallet;
  let triggerHandler = jest.fn();

  beforeEach(() => {
    rpcRequest = {
      method: RpcMethods.CreateToken,
      params: {
        name: 'mytoken',
        symbol: 'mtk',
        amount: 1000,
        address: 'address123',
        change_address: 'changeAddress123',
        create_mint: true,
        mint_authority_address: null,
        allow_external_mint_authority_address: false,
        create_melt: true,
        melt_authority_address: null,
        allow_external_melt_authority_address: false,
        data: null,
        push_tx: true,
        network: 'mainnet',
      },
    } as unknown as CreateTokenRpcRequest;

    wallet = {
      isAddressMine: jest.fn(),
      createNewToken: jest.fn(),
    } as unknown as HathorWallet;

    triggerHandler = jest.fn();
  });

  it('should create a token successfully', async () => {
    const pinCode = '1234';
    const transaction = { tx_id: 'transaction-id' };
    const rpcResponse = {
      type: RpcResponseTypes.CreateTokenResponse,
      response: transaction,
    };

    (wallet.isAddressMine as jest.Mock).mockResolvedValue(true);
    triggerHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateTokenConfirmationResponse,
        data: {
          accepted: true,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    (wallet.createNewToken as jest.Mock).mockResolvedValue(transaction);

    const result = await createToken(rpcRequest, wallet, {}, triggerHandler);

    expect(triggerHandler).toHaveBeenCalledTimes(4);
    expect(triggerHandler).toHaveBeenCalledWith(
      {
        type: TriggerTypes.CreateTokenConfirmationPrompt,
        method: rpcRequest.method,
        data: toCamelCase(rpcRequest.params),
      },
      {}
    );
    expect(triggerHandler).toHaveBeenCalledWith(
      {
        type: TriggerTypes.PinConfirmationPrompt,
        method: rpcRequest.method,
      },
      {}
    );

    expect(wallet.createNewToken).toHaveBeenCalledWith(
      rpcRequest.params.name,
      rpcRequest.params.symbol,
      rpcRequest.params.amount,
      {
        ...toCamelCase(rpcRequest.params),
        amount: undefined,
        name: undefined,
        symbol: undefined,
        pinCode,
      }
    );
    expect(result).toEqual(rpcResponse);
  });

  it('should throw PromptRejectedError if the user rejects the confirmation prompt', async () => {
    (wallet.isAddressMine as jest.Mock).mockResolvedValue(true);

    triggerHandler.mockResolvedValueOnce({
      type: TriggerResponseTypes.CreateTokenConfirmationResponse,
      data: {
        accepted: false,
      },
    });

    await expect(createToken(rpcRequest, wallet, {}, triggerHandler)).rejects.toThrow(PromptRejectedError);

    expect(triggerHandler).toHaveBeenCalledTimes(1);
    expect(triggerHandler).toHaveBeenCalledWith(
      {
        type: TriggerTypes.CreateTokenConfirmationPrompt,
        method: rpcRequest.method,
        data: toCamelCase(rpcRequest.params),
      },
      {}
    );
  });

  it('should throw CreateTokenError if the wallet transaction fails', async () => {
    const pinCode = '1234';

    (wallet.isAddressMine as jest.Mock).mockResolvedValue(true);
    triggerHandler
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.CreateTokenConfirmationResponse,
        data: {
          accepted: true,
        },
      })
      .mockResolvedValueOnce({
        type: TriggerResponseTypes.PinRequestResponse,
        data: {
          accepted: true,
          pinCode,
        },
      });

    (wallet.createNewToken as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

    await expect(createToken(rpcRequest, wallet, {}, triggerHandler)).rejects.toThrow(CreateTokenError);

    expect(triggerHandler).toHaveBeenCalledTimes(3);
  });

  it('should throw an error if the change address is not owned by the wallet', async () => {
    (wallet.isAddressMine as jest.Mock).mockResolvedValue(false);

    await expect(createToken(rpcRequest, wallet, {}, triggerHandler)).rejects.toThrow(Error);

    expect(wallet.isAddressMine).toHaveBeenCalledWith('changeAddress123');
  });
});

