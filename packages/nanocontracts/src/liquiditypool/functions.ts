import {
  SendNanoContractRpcRequest,
  sendNanoContractTxRpcRequest,
  SignOracleDataResponse,
  SignOracleDataRpcRequest,
} from 'hathor-rpc-handler-test'
import { SendNanoContractTxResponse } from 'hathor-rpc-handler-test'
import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types'

export const swap_exact_tokens_for_tokens = async (
  hathorRpc: IHathorRpc,
  address: string,
  ncId: string,
  token_in: string,
  amount_in: number,
  token_out: string,
  amount_out: number
) => {
  const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
    'swap_exact_tokens_for_tokens',
    process.env.LP_BLUEPRINT || '',
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

export interface IHathorRpc {
  sendNanoContractTx: (ncTxRpcReq: SendNanoContractRpcRequest) => Promise<SendNanoContractTxResponse>
  signOracleData: (signOracleDataReq: SignOracleDataRpcRequest) => Promise<SignOracleDataResponse>
}
