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

export interface IHathorRpc {
  sendNanoContractTx: (ncTxRpcReq: SendNanoContractRpcRequest) => Promise<SendNanoContractTxResponse>
  signOracleData: (signOracleDataReq: SignOracleDataRpcRequest) => Promise<SignOracleDataResponse>
  createToken: (createTokenReq: CreateTokenRpcRequest) => Promise<CreateTokenResponse>
}
