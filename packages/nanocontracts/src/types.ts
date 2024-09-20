import { Token } from '@dozer/database'
import {
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  SignOracleDataRpcRequest,
  SignOracleDataResponse,
  CreateTokenRpcRequest,
  CreateTokenResponse,
} from 'hathor-rpc-handler-test'

export declare class NCTokenBalance {
  readonly token: Token
  balance: number
}

export interface IHathorRpc {
  sendNanoContractTx: (ncTxRpcReq: SendNanoContractRpcRequest) => Promise<SendNanoContractTxResponse>
  signOracleData: (signOracleDataReq: SignOracleDataRpcRequest) => Promise<SignOracleDataResponse>
  createToken: (createTokenReq: CreateTokenRpcRequest) => Promise<CreateTokenResponse>
}
