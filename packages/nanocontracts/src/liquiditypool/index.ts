import { z } from 'zod'
import { Token } from '@dozer/database'
import { createNCHeadless, executeNCHeadless, NanoContract } from '../nanocontract'
import { NCAction, NCArgs } from '../nanocontract/types'

export class LiquidityPool extends NanoContract {
  public readonly token0: Token //will we really use this type? or can we simplify and use the uuid directly?
  public readonly token1: Token
  public fee: number

  public constructor(token0: Token, token1: Token, fee: number, ncid?: string) {
    if (ncid) super(ncid)
    else super('fake')
    this.token0 = token0
    this.token1 = token1
    this.fee = fee
  }

  public async getInfo() {
    // get info from network: it can be done by the ncid or by the tokens
  }

  public async initialize(token0: Token, token1: Token, fee: number) {
    // TODO: Create the initialize method if it turns to be important. Right now, it will be done manually.
    if (!process.env.LPBLUEPRINT || !process.env.ADMIN_ADDRESS) throw new Error('Missing environment variables')
    const actions: NCAction[] = []
    const args: NCArgs[] = []
    const response = await createNCHeadless(process.env.LPBLUEPRINT, process.env.ADMIN_ADDRESS, actions, args)
    return response['hash']
  }

  public async swap(token_in: Token, amount_in: number, token_out: Token, amount_out: number) {
    if (!process.env.LPBLUEPRINT || !process.env.ADMIN_ADDRESS) throw new Error('Missing environment variables')
    const actions: NCAction[] = [
      { type: 'deposit', token: token_in.uuid, data: { amount: amount_in } },
      { type: 'withdraw', token: token_out.uuid, data: { amount: amount_out } },
    ]
    const args: NCArgs[] = []
    const response = await executeNCHeadless(process.env.LPBLUEPRINT, process.env.ADMIN_ADDRESS, 'swap', actions, args)
    return response['hash']
  }
}
