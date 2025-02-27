import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types'
import {
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  sendNanoContractTxRpcRequest,
} from 'hathor-rpc-handler-test'

import { NanoContract } from '../nanocontract'
import { NCAction, NCArgs } from '../nanocontract/types'
import { IHathorRpc } from '../types'

export class Oasis extends NanoContract {
  public token: string
  public pool: string

  public constructor(token: string, pool: string, ncid?: string) {
    if (ncid) super(ncid)
    else super('fake')
    this.token = token
    this.pool = pool
  }

  public async getInfo() {
    // get info from network: it can be done by the ncid or by the tokens
  }

  public async initialize(admin_address: string, amount: number, protocolFee: number) {
    if (!process.env.OASISBLUEPRINT || '') throw new Error('Missing environment variables')
    const actions: NCAction[] = [{ type: 'deposit', token: '00', amount: 100 * amount }]
    const args: NCArgs[] = [this.pool, this.token, protocolFee]
    const response = await this.create(process.env.OASISBLUEPRINT || '', admin_address, actions, args)
    return response
  }

  public async wc_initialize(hathorRpc: IHathorRpc, address: string, token: string, pool: string, amount: number) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'initialize',
      '27db2b0b1a943c2714fb19d190ce87dc0094bba463b26452dd98de21a42e96a1',
      [
        {
          type: NanoContractActionType.DEPOSIT,
          token: '00',
          amount: amount,
          address: address,
          changeAddress: address,
        },
      ],
      [pool, token],
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
    amount: number,
    htr_price: number
  ) {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'user_deposit',
      '27db2b0b1a943c2714fb19d190ce87dc0094bba463b26452dd98de21a42e96a1',
      [
        {
          type: NanoContractActionType.DEPOSIT,
          token: this.token,
          amount: amount,
          address: address,
          changeAddress: address,
        },
      ],
      [timelock, Number(htr_price.toFixed(4))],
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
        amount: amount,
        address: address,
        changeAddress: address,
      },
    ]
    if (amount_htr > 0) {
      actions.push({
        type: NanoContractActionType.WITHDRAWAL,
        token: '00',
        amount: amount_htr,
        address: address,
        changeAddress: address,
      })
    }
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'user_withdraw',
      '27db2b0b1a943c2714fb19d190ce87dc0094bba463b26452dd98de21a42e96a1',
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
      '27db2b0b1a943c2714fb19d190ce87dc0094bba463b26452dd98de21a42e96a1',
      [
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: '00',
          amount: amount,
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
