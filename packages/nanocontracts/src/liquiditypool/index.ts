import {
  SendNanoContractRpcRequest,
  SendNanoContractTxResponse,
  sendNanoContractTxRpcRequest,
} from '@hathor/hathor-rpc-handler'
import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types'

import { NanoContract } from '../nanocontract'
import { NCAction, NCArgs } from '../nanocontract/types'
import { IHathorRpc } from '../types'

export class PoolManager extends NanoContract {
  private readonly poolManagerContractId: string
  private readonly poolManagerBlueprintId: string

  public constructor(poolManagerContractId?: string, poolManagerBlueprintId?: string) {
    super(poolManagerContractId || process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || 'fake')
    this.poolManagerContractId = poolManagerContractId || process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID || ''
    this.poolManagerBlueprintId = poolManagerBlueprintId || process.env.NEXT_PUBLIC_POOL_MANAGER_BLUEPRINT_ID || ''

    if (!this.poolManagerContractId || this.poolManagerContractId === 'fake') {
      console.warn('PoolManager: NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID environment variable not set')
    }
    if (!this.poolManagerBlueprintId) {
      console.warn('PoolManager: NEXT_PUBLIC_POOL_MANAGER_BLUEPRINT_ID environment variable not set')
    }
  }

  /**
   * Create a new pool in the manager
   */
  public async createPool(
    hathorRpc: IHathorRpc,
    address: string,
    tokenA: string,
    tokenB: string,
    amountA: number,
    amountB: number,
    fee: number
  ): Promise<SendNanoContractTxResponse> {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'create_pool',
      this.poolManagerContractId,
      [
        // @ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: tokenA,
          amount: Math.floor(amountA * 100).toString(),
          address: address,
          changeAddress: address,
        },
        // @ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: tokenB,
          amount: Math.floor(amountB * 100).toString(),
          address: address,
          changeAddress: address,
        } as any,
      ],
      [fee], // Only fee is needed as argument
      true,
      this.poolManagerContractId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)
    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)
    return rpcResponse
  }

  /**
   * Swap with exact input through the best path
   */
  public async swapExactTokensForTokens(
    hathorRpc: IHathorRpc,
    address: string,
    tokenIn: string,
    amountIn: number,
    tokenOut: string,
    amountOut: number,
    path: string // Mandatory path (single pool_key for single-hop, comma-separated for multi-hop)
  ): Promise<SendNanoContractTxResponse> {
    // Parse path to determine if single-hop or multi-hop
    const pathSegments = path.split(',')
    const isSingleHop = pathSegments.length === 1

    // Extract fee from the first pool key (format: tokenA/tokenB/fee)
    const firstPoolKey = pathSegments[0]
    if (!firstPoolKey) throw new Error('Invalid path')
    const poolKeyParts = firstPoolKey.split('/')
    const fee = parseInt(poolKeyParts[2] || '0') // Fee is the third part of pool_key

    // Choose method based on path length
    const method = isSingleHop ? 'swap_exact_tokens_for_tokens' : 'swap_exact_tokens_for_tokens_through_path'
    const args = isSingleHop ? [fee] : [path]
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      method,
      this.poolManagerBlueprintId,
      [
        // @ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: tokenIn,
          amount: Math.floor(amountIn * 100).toString(),
          address: address,
          changeAddress: address,
        },
        // @ts-ignore
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: tokenOut,
          amount: Math.ceil(amountOut * 100).toString(),
          address: address,
          changeAddress: address,
        } as any,
      ],
      args,
      true,
      this.poolManagerContractId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)
    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)
    return rpcResponse
  }

  /**
   * Swap with exact output through the best path
   */
  public async swapTokensForExactTokens(
    hathorRpc: IHathorRpc,
    address: string,
    tokenIn: string,
    amountIn: number,
    tokenOut: string,
    amountOut: number,
    path: string // Mandatory path (single pool_key for single-hop, comma-separated for multi-hop)
  ): Promise<SendNanoContractTxResponse> {
    // Parse path to determine if single-hop or multi-hop
    const pathSegments = path.split(',')
    const isSingleHop = pathSegments.length === 1

    // Extract fee from the first pool key (format: tokenA/tokenB/fee)
    const firstPoolKey = pathSegments[0]
    if (!firstPoolKey) throw new Error('Invalid path')
    const poolKeyParts = firstPoolKey.split('/')
    const fee = parseInt(poolKeyParts[2] || '0') // Fee is the third part of pool_key

    // Choose method based on path length
    const method = isSingleHop ? 'swap_tokens_for_exact_tokens' : 'swap_tokens_for_exact_tokens_through_path'
    const args = isSingleHop ? [fee] : [path]

    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      method,
      this.poolManagerBlueprintId,
      [
        // @ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: tokenIn,
          amount: Math.ceil(amountIn * 100).toString(),
          address: address,
          changeAddress: address,
        },
        // @ts-ignore
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: tokenOut,
          amount: Math.floor(amountOut * 100).toString(),
          address: address,
          changeAddress: address,
        } as any,
      ],
      args,
      true,
      this.poolManagerContractId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)
    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)
    return rpcResponse
  }

  /**
   * Add liquidity to a pool
   */
  public async addLiquidity(
    hathorRpc: IHathorRpc,
    address: string,
    tokenA: string,
    amountA: number,
    tokenB: string,
    amountB: number,
    fee: number
  ): Promise<SendNanoContractTxResponse> {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'add_liquidity',
      this.poolManagerBlueprintId,
      [
        // @ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: tokenA,
          amount: Math.floor(amountA * 100).toString(),
          address: address,
          changeAddress: address,
        },
        // @ts-ignore
        {
          type: NanoContractActionType.DEPOSIT,
          token: tokenB,
          amount: Math.floor(amountB * 100).toString(),
          address: address,
          changeAddress: address,
        } as any,
      ],
      [fee],
      true,
      this.poolManagerContractId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)
    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)
    return rpcResponse
  }

  /**
   * Remove liquidity from a pool
   */
  public async removeLiquidity(
    hathorRpc: IHathorRpc,
    address: string,
    tokenA: string,
    amountA: number,
    tokenB: string,
    amountB: number,
    fee: number
  ): Promise<SendNanoContractTxResponse> {
    const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
      'remove_liquidity',
      this.poolManagerBlueprintId,
      [
        // @ts-ignore
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: tokenA,
          amount: Math.ceil(amountA * 100).toString(),
          address: address,
          changeAddress: address,
        },
        // @ts-ignore
        {
          type: NanoContractActionType.WITHDRAWAL,
          token: tokenB,
          amount: Math.ceil(amountB * 100).toString(),
          address: address,
          changeAddress: address,
        } as any,
      ],
      [fee],
      true,
      this.poolManagerContractId
    )

    console.log('Will send rpc req: ', ncTxRpcReq)
    const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq)
    return rpcResponse
  }
}

/**
 * @deprecated LiquidityPool is deprecated. Use PoolManager instead.
 * This class is kept for backward compatibility.
 */
export class LiquidityPool extends PoolManager {
  public readonly token0: string
  public readonly token1: string
  public fee: number
  public protocol_fee: number

  public constructor(token0: string, token1: string, fee: number, protocol_fee: number, ncid?: string) {
    console.warn('LiquidityPool is deprecated. Use PoolManager instead.')
    super(ncid || process.env.NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID)
    this.token0 = token0
    this.token1 = token1
    this.fee = fee
    this.protocol_fee = protocol_fee
  }

  public async getInfo() {
    // get info from network: it can be done by the ncid or by the tokens
    console.warn('getInfo() is deprecated and not implemented in PoolManager')
  }

  /**
   * @deprecated Use PoolManager.createPool() instead
   */
  public async initialize(admin_address: string, amount0: number, amount1: number) {
    console.warn('initialize() is deprecated. Use PoolManager.createPool() instead.')
    return this.createPool(
      {} as IHathorRpc, // This will fail, but maintains the interface
      admin_address,
      this.token0,
      this.token1,
      amount0,
      amount1,
      this.fee
    )
  }

  /**
   * @deprecated Use PoolManager.createPool() instead
   */
  public async wc_initialize(
    hathorRpc: IHathorRpc,
    address: string,
    token0: string,
    token1: string,
    amount0: number,
    amount1: number,
    fee: number,
    protocol_fee: number
  ): Promise<SendNanoContractTxResponse> {
    console.warn('wc_initialize() is deprecated. Use PoolManager.createPool() instead.')
    return this.createPool(hathorRpc, address, token0, token1, amount0, amount1, fee)
  }

  /**
   * Legacy method signature for backward compatibility
   */
  public async swap_exact_tokens_for_tokens(
    hathorRpc: IHathorRpc,
    address: string,
    ncId: string, // This parameter is ignored in the new implementation
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number
  ): Promise<SendNanoContractTxResponse> {
    // Construct a single-hop path using the legacy fee (5 basis points)
    const path = `${token_in}/${token_out}/5`
    return this.swapExactTokensForTokens(hathorRpc, address, token_in, amount_in, token_out, amount_out, path)
  }

  /**
   * Legacy method signature for backward compatibility
   */
  public async swap_tokens_for_exact_tokens(
    hathorRpc: IHathorRpc,
    address: string,
    ncId: string, // This parameter is ignored in the new implementation
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number
  ): Promise<SendNanoContractTxResponse> {
    // Construct a single-hop path using the legacy fee (5 basis points)
    const path = `${token_in}/${token_out}/5`
    return this.swapTokensForExactTokens(hathorRpc, address, token_in, amount_in, token_out, amount_out, path)
  }

  /**
   * Legacy method signature for backward compatibility
   */
  public async add_liquidity(
    hathorRpc: IHathorRpc,
    ncId: string, // This parameter is ignored in the new implementation
    token_a: string,
    amount_a: number,
    token_b: string,
    amount_b: number,
    address: string
  ): Promise<SendNanoContractTxResponse> {
    // Default fee of 0.3% (3 basis points) for backward compatibility
    return this.addLiquidity(hathorRpc, address, token_a, amount_a, token_b, amount_b, 3)
  }

  /**
   * Legacy method signature for backward compatibility
   */
  public async remove_liquidity(
    hathorRpc: IHathorRpc,
    ncId: string, // This parameter is ignored in the new implementation
    token_a: string,
    amount_a: number,
    token_b: string,
    amount_b: number,
    address: string
  ): Promise<SendNanoContractTxResponse> {
    // Default fee of 0.3% (3 basis points) for backward compatibility
    return this.removeLiquidity(hathorRpc, address, token_a, amount_a, token_b, amount_b, 3)
  }
}
