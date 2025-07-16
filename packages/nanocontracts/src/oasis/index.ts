import {
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  sendNanoContractTxRpcRequest,
} from '@hathor/hathor-rpc-handler'
import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types'

import { NanoContract } from '../nanocontract'
import { NCAction, NCArgs } from '../nanocontract/types'
import { IHathorRpc } from '../types'


export class Oasis extends NanoContract {
  public token: string
  public poolManagerId: string
  public poolFee: number

  public constructor(token: string, poolManagerId: string, poolFee: number = 100, ncid?: string) {
    if (ncid) super(ncid)
    else super('fake')
    this.token = token
    this.poolManagerId = poolManagerId
    this.poolFee = poolFee
  }

  public async getInfo() {
    // get info from network: it can be done by the ncid or by the tokens
  }

  public async initialize(admin_address: string, amount: number, protocolFee: number) {
    if (!process.env.OASISBLUEPRINT || '') throw new Error('Missing environment variables')

    const actions: NCAction[] = [{ type: 'deposit', token: '00', amount: 100 * amount }]
    const args: NCArgs[] = [
      this.poolManagerId, // dozer_pool_manager
      this.token, // token_b
      this.poolFee, // pool_fee
      protocolFee, // protocol_fee
    ]
    const response = await this.create(process.env.OASISBLUEPRINT || '', admin_address, actions, args)
    return response
  }

  public async wc_initialize(
    hathorRpc: IHathorRpc,
    address: string,
    token: string,
    poolManagerId: string,
    poolFee: number,
    protocolFee: number,
    amount: number
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'initialize',
      process.env.NEXT_PUBLIC_OASIS_BLUEPRINT_ID || '',
      [
        //@ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: '00',
          amount: Math.floor(amount * 100).toString(),
          address: address,
          changeAddress: address,
        },
      ],
      [poolManagerId, token, poolFee, protocolFee], // Updated args for new contract
      true,
      null
    )
    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async user_deposit(
    hathorRpc: IHathorRpc,
    address: string,
    timelock: number,
    ncId: string,
    amount: number
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'user_deposit',
      process.env.NEXT_PUBLIC_OASIS_BLUEPRINT_ID || '',
      [
        //@ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: this.token,
          amount: Math.floor(amount * 100).toString(),
          address: address,
          changeAddress: address,
        },
      ],
      [timelock], // HTR price will be fetched automatically from DozerPoolManager
      true,
      ncId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async close_position(hathorRpc: IHathorRpc, address: string, ncId: string) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'close_position',
      process.env.NEXT_PUBLIC_OASIS_BLUEPRINT_ID || '',
      [],
      [],
      true,
      ncId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async user_withdraw(hathorRpc: IHathorRpc, address: string, ncId: string, amount: number, amount_htr: number) {
    const actions = [
      {
        type: NanoContractActionType.WITHDRAWAL,
        token: this.token,
        amount: Math.floor(amount * 100).toString(),
        address: address,
        changeAddress: address,
      },
    ]
    if (amount_htr > 0) {
      actions.push({
        type: NanoContractActionType.WITHDRAWAL,
        token: '00',
        amount: Math.floor(amount_htr * 100).toString(),
        address: address,
        changeAddress: address,
      })
    }
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'user_withdraw',
      process.env.NEXT_PUBLIC_OASIS_BLUEPRINT_ID || '',
      // @ts-ignore
      actions,
      [],
      true,
      ncId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)

    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)

    return rpcResponse
  }

  public async user_withdraw_bonus(hathorRpc: IHathorRpc, address: string, ncId: string, amount: number) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'user_withdraw_bonus',
      process.env.NEXT_PUBLIC_OASIS_BLUEPRINT_ID || '',
      [
        //@ts-ignore
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: '00',
          amount: Math.floor(amount * 100).toString(),
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
