import { NCTokenBalance } from '../types'
import { Token } from '@dozer/currency'
import { NCAction, NCArgs } from './types'

export class NanoContract {
  public ncid: string
  public reserves: NCTokenBalance[]

  public constructor(ncid: string) {
    this.ncid = ncid
    this.reserves = []
  }
  public deposit(token: typeof Token, amount: number) {
    const existingToken = this.reserves.find((reserve) => reserve.token === token)
    if (existingToken) {
      existingToken.balance += amount
    } else {
      this.reserves.push({ token, balance: amount })
    }
  }
  public withdraw(token: typeof Token, amount: number) {
    const existingToken = this.reserves.find((reserve) => reserve.token === token)
    if (existingToken) {
      if (existingToken.balance >= amount) {
        existingToken.balance -= amount
      } else {
        throw new Error('Insufficient balance')
      }
    } else {
      throw new Error('Token not found')
    }
  }
}

export async function createNCHeadless(
  blueprint: string,
  address: string,
  actions: NCAction[],
  args: NCArgs[]
): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (!process.env.LOCAL_WALLET_URL || !process.env.WALLET_ID) {
    // If Wallet URL is not given, returns fake data
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  try {
    const localWalletUrl = `${process.env.LOCAL_WALLET_URL}/create`
    if (localWalletUrl) {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-id': process.env.WALLET_ID },
        body: JSON.stringify({
          blueprint: blueprint,
          address: address,
          data: { actions: actions, args: args },
        }),
      }
      try {
        const response = await fetch(localWalletUrl, requestOptions)
        return await response.json()
      } catch {
        throw new Error('Failed to post data to local wallet')
      }
    }
  } catch (error: any) {
    throw new Error('Error posting data: ' + error.message)
  }
}

export async function executeNCHeadless(
  blueprint: string,
  address: string,
  method: string,
  actions: NCAction[],
  args: NCArgs[]
): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (!process.env.LOCAL_WALLET_URL || !process.env.WALLET_ID) {
    // If Wallet URL is not given, returns fake data
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
  try {
    const localWalletUrl = `${process.env.LOCAL_WALLET_URL}/execute`
    if (localWalletUrl) {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-id': process.env.WALLET_ID },
        body: JSON.stringify({
          blueprint: blueprint,
          address: address,
          method: method,
          data: { actions: actions, args: args },
        }),
      }
      try {
        const response = await fetch(localWalletUrl, requestOptions)
        return await response.json()
      } catch {
        throw new Error('Failed to post data to local wallet')
      }
    }
  } catch (error: any) {
    throw new Error('Error posting data: ' + error.message)
  }
}
