import { NanoContract } from '../nanocontract'
import { NCAction, NCArgs } from '../nanocontract/types'

export class LiquidityPool extends NanoContract {
  public readonly token0: string
  public readonly token1: string
  public fee: number

  public constructor(token0: string, token1: string, fee: number, ncid?: string) {
    if (ncid) super(ncid)
    else super('fake')
    this.token0 = token0
    this.token1 = token1
    this.fee = fee
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
    const args: NCArgs[] = [this.token0, this.token1, this.fee]
    const response = await this.create(process.env.LPBLUEPRINT, admin_address, actions, args)
    return response
  }

  public async swap_tokens_for_exact_tokens(
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number,
    address: string,
    wallet?: string
  ) {
    const actions: NCAction[] = [
      {
        type: 'deposit',
        token: token_in,
        amount: Math.ceil(amount_in * 100),
        address: address,
        changeAddress: address,
      },
      { type: 'withdrawal', token: token_out, amount: Math.ceil(amount_out * 100), address: address },
    ]
    const args: NCArgs[] = []
    // console.log('actions', actions)
    const response = await this.execute(address, 'swap_tokens_for_exact_tokens', actions, args, wallet)
    return response
  }
  public async swap_exact_tokens_for_tokens(
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number,
    address: string,
    wallet?: string
  ) {
    const actions: NCAction[] = [
      {
        type: 'deposit',
        token: token_in,
        amount: Math.ceil(amount_in * 100),
        address: address,
        changeAddress: address,
      },
      { type: 'withdrawal', token: token_out, amount: Math.ceil(amount_out * 100), address: address },
    ]
    const args: NCArgs[] = []
    // console.log('actions', actions)
    const response = await this.execute(address, 'swap_exact_tokens_for_tokens', actions, args, wallet)
    return response
  }

  public async add_liquidity(
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number,
    address: string,
    wallet?: string
  ) {
    const actions: NCAction[] = [
      {
        type: 'deposit',
        token: token_in,
        amount: Math.ceil(amount_in * 100),
        address: address,
        changeAddress: address,
      },
      {
        type: 'deposit',
        token: token_out,
        amount: Math.ceil(amount_out * 100),
        address: address,
        changeAddress: address,
      },
    ]
    const args: NCArgs[] = []
    // console.log('actions', actions)
    const response = await this.execute(address, 'add_liquidity', actions, args, wallet)
    return response
  }
}
