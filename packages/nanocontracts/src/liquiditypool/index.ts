import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types'
import {
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  SignOracleDataRpcRequest,
  SignOracleDataResponse,
  sendNanoContractTxRpcRequest,
} from '@dozer/hathor-rpc-handler'
import { NanoContract } from '../nanocontract'
import { NCAction, NCArgs } from '../nanocontract/types'

export interface IHathorRpc {
  sendNanoContractTx: (ncTxRpcReq: SendNanoContractRpcRequest) => Promise<SendNanoContractTxResponse>
  signOracleData: (signOracleDataReq: SignOracleDataRpcRequest) => Promise<SignOracleDataResponse>
}

export class LiquidityPool extends NanoContract {
  public readonly token0: string
  public readonly token1: string
  public fee: number
  public protocol_fee: number

  public constructor(token0: string, token1: string, fee: number, protocol_fee: number, ncid?: string) {
    if (ncid) super(ncid)
    else super('fake')
    this.token0 = token0
    this.token1 = token1
    this.fee = fee
    this.protocol_fee = protocol_fee
  }

  public async getInfo() {
    // get info from network: it can be done by the ncid or by the tokens
  }

  public async initialize(admin_address: string, amount0: number, amount1: number) {
    if (!process.env.LPBLUEPRINT) throw new Error('Missing environment variables')
    const actions: NCAction[] = [
      { type: 'deposit', token: this.token0, amount: 100 * amount0 },
      { type: 'deposit', token: this.token1, amount: 100 * amount1 },
    ]
    const args: NCArgs[] = [this.token0, this.token1, this.fee, this.protocol_fee]
    const response = await this.create(process.env.LPBLUEPRINT, admin_address, actions, args)
    return response
  }

  // public async swap_tokens_for_exact_tokens(
  //   token_in: string,
  //   amount_in: number,
  //   token_out: string,
  //   amount_out: number,
  //   address: string,
  //   wallet?: string
  // ) {
  //   const actions: NCAction[] = [
  //     {
  //       type: 'deposit',
  //       token: token_in,
  //       amount: Math.ceil(amount_in * 100),
  //       address: address,
  //       changeAddress: address,
  //     },
  //     { type: 'withdrawal', token: token_out, amount: Math.ceil(amount_out * 100), address: address },
  //   ]
  //   const args: NCArgs[] = []
  //   // console.log('actions', actions)
  //   const response = await this.execute(address, 'swap_tokens_for_exact_tokens', actions, args, wallet)
  //   return response
  // }
  // public async swap_exact_tokens_for_tokens(
  //   token_in: string,
  //   amount_in: number,
  //   token_out: string,
  //   amount_out: number,
  //   address: string,
  //   wallet?: string
  // ) {
  //   const actions: NCAction[] = [
  //     {
  //       type: 'deposit',
  //       token: token_in,
  //       amount: Math.ceil(amount_in * 100),
  //       address: address,
  //       changeAddress: address,
  //     },
  //     { type: 'withdrawal', token: token_out, amount: Math.ceil(amount_out * 100), address: address },
  //   ]
  //   const args: NCArgs[] = []
  //   // console.log('actions', actions)
  //   const response = await this.execute(address, 'swap_exact_tokens_for_tokens', actions, args, wallet)
  //   return response
  // }

  public async wc_initialize(
    hathorRpc: IHathorRpc,
    address: string,
    token0: string,
    token1: string,
    amount0: number,
    amount1: number,
    fee: number,
    protocol_fee: number
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'initialize',
      '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771596',
      [
        {
          type: NanoContractActionType.DEPOSIT,
          token: token0,
          amount: Math.ceil(amount0 * 100),
          address: address,
          changeAddress: address,
        },
        {
          type: NanoContractActionType.DEPOSIT,
          token: token1,
          amount: Math.ceil(amount1 * 100),
          address: address,
          changeAddress: address,
        },
      ],
      [token0, token1, fee, protocol_fee],
      true,
      null
    )
    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async swap_exact_tokens_for_tokens(
    hathorRpc: IHathorRpc,
    address: string,
    ncId: string,
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'swap_exact_tokens_for_tokens',
      '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771596',
      [
        {
          type: NanoContractActionType.DEPOSIT,
          token: token_in,
          amount: Math.ceil(amount_in * 100),
          address: address,
          changeAddress: address,
        },
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: token_out,
          amount: Math.ceil(amount_out * 100),
          address: address,
          changeAddress: address,
        },
      ],
      [],
      true,
      ncId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async swap_tokens_for_exact_tokens(
    hathorRpc: IHathorRpc,
    address: string,
    ncId: string,
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'swap_tokens_for_exact_tokens',
      '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771596',
      [
        {
          type: NanoContractActionType.DEPOSIT,
          token: token_in,
          amount: Math.ceil(amount_in * 100),
          address: address,
          changeAddress: address,
        },
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: token_out,
          amount: Math.ceil(amount_out * 100),
          address: address,
          changeAddress: address,
        },
      ],
      [],
      true,
      ncId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async add_liquidity(
    hathorRpc: IHathorRpc,
    ncId: string,
    token_a: string,
    amount_a: number,
    token_b: string,
    amount_b: number,
    address: string
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'add_liquidity',
      '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771596',
      [
        {
          type: NanoContractActionType.DEPOSIT,
          token: token_a,
          amount: Math.ceil(amount_a * 100),
          address: address,
          changeAddress: address,
        },
        {
          type: NanoContractActionType.DEPOSIT,
          token: token_b,
          amount: Math.ceil(amount_b * 100),
          address: address,
          changeAddress: address,
        },
      ],
      [],
      true,
      ncId
    )
    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async remove_liquidity(
    hathorRpc: IHathorRpc,
    ncId: string,
    token_a: string,
    amount_a: number,
    token_b: string,
    amount_b: number,
    address: string
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'remove_liquidity',
      '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771596',
      [
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: token_a,
          amount: Math.ceil(amount_a * 100),
          address: address,
          changeAddress: address,
        },
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: token_b,
          amount: Math.ceil(amount_b * 100),
          address: address,
          changeAddress: address,
        },
      ],
      [],
      true,
      ncId
    )
    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }
}
