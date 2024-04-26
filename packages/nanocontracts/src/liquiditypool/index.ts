import sanitizedConfig from '../config'
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
    // TODO: Create the initialize method if it turns to be important. Right now, it will be done manually.
    console.log('entered initialize')
    if (!sanitizedConfig.LPBLUEPRINT) throw new Error('Missing environment variables')
    const actions: NCAction[] = [
      { type: 'deposit', token: this.token0, amount: amount0 },
      { type: 'deposit', token: this.token1, amount: amount1 },
    ]
    const args: NCArgs[] = [this.token0, this.token1, this.fee.toString()]
    const response = this.create(sanitizedConfig.LPBLUEPRINT, admin_address, actions, args)
    return await response
  }

  public async swap_tokens_for_exact_tokens(
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number,
    address: string
  ) {
    if (!process.env.LPBLUEPRINT) throw new Error('Missing environment variables')
    const actions: NCAction[] = [
      { type: 'deposit', token: token_in, amount: amount_in },
      { type: 'withdrawal', token: token_out, amount: amount_out },
    ]
    const args: NCArgs[] = []
    const response = await this.execute(process.env.LPBLUEPRINT, address, 'swap_tokens_for_exact_tokens', actions, args)
    return response['hash']
  }
  public async swap_exact_tokens_for_tokens(
    token_in: string,
    amount_in: number,
    token_out: string,
    amount_out: number,
    address: string
  ) {
    if (!process.env.LPBLUEPRINT) throw new Error('Missing environment variables')
    const actions: NCAction[] = [
      { type: 'deposit', token: token_in, amount: amount_in },
      { type: 'withdrawal', token: token_out, amount: amount_out },
    ]
    const args: NCArgs[] = []
    const response = await this.execute(process.env.LPBLUEPRINT, address, 'swap_exact_tokens_for_tokens', actions, args)
    return response['hash']
  }
}
