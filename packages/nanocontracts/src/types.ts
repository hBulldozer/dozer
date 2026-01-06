import { Token } from '@dozer/database'
import {
  CreateTokenResponse,
  CreateTokenRpcRequest,
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  SignOracleDataResponse,
  SignOracleDataRpcRequest,
} from '@hathor/hathor-rpc-handler'

export declare class NCTokenBalance {
  readonly token: Token
  balance: number
}

export type SendNanoContractRpcRequestCustom = Omit<SendNanoContractRpcRequest, 'params'> & {
  params: SendNanoContractRpcRequest['params'] & {
    network: string
  }
}

export interface IHathorRpc {
  sendNanoContractTx: (ncTxRpcReq: SendNanoContractRpcRequestCustom) => Promise<SendNanoContractTxResponse>
  signOracleData: (signOracleDataReq: SignOracleDataRpcRequest) => Promise<SignOracleDataResponse>
  createToken: (createTokenReq: CreateTokenRpcRequest) => Promise<CreateTokenResponse>
}
