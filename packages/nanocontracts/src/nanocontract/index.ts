import { Token } from '@dozer/database'

import { NCTokenBalance } from '../types'
import { NCAction, NCArgs } from './types'

export class NanoContract {
  public ncid: string
  public reserves: NCTokenBalance[]

  public constructor(ncid: string) {
    this.ncid = ncid
    this.reserves = []
  }
  public deposit(token: Token, amount: number) {
    const existingToken = this.reserves.find((reserve) => reserve.token === token)
    if (existingToken) {
      existingToken.balance += amount
    } else {
      this.reserves.push({ token, balance: amount })
    }
  }
  public withdraw(token: Token, amount: number) {
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

  public async create(blueprint_id: string, address: string, actions: NCAction[], args: NCArgs[]) {
    // TODO: Create a validator for Hathor valid address?
    if (!process.env.LOCAL_WALLET_MASTER_URL || !process.env.WALLET_ID || !process.env.WALLET_API_KEY) {
      // If Wallet URL is not given, returns fake data
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    try {
      const localWalletUrl = `${process.env.LOCAL_WALLET_MASTER_URL}/wallet/nano-contracts/create`
      if (localWalletUrl) {
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wallet-id': process.env.WALLET_ID,
            'X-API-Key': process.env.WALLET_API_KEY,
          },
          body: JSON.stringify({
            blueprint_id: blueprint_id,
            address: address,
            data: { args: args, actions: actions },
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

  public async execute(
    address: string,
    method: string,
    actions: NCAction[],
    args: NCArgs[],
    wallet?: string
  ): Promise<any> {
    // TODO: Create a validator for Hathor valid address?
    if (
      !process.env.LOCAL_WALLET_MASTER_URL ||
      !process.env.LOCAL_WALLET_USERS_URL ||
      !process.env.WALLET_ID ||
      !process.env.WALLET_API_KEY
    ) {
      // If Wallet URL is not given, returns fake data
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    try {
      const localWalletUrl = `${
        wallet == 'users' ? process.env.LOCAL_WALLET_USERS_URL : process.env.LOCAL_WALLET_MASTER_URL
      }/wallet/nano-contracts/execute`
      if (localWalletUrl) {
        const requestOptions = {
          method: 'POST',
          headers: {
            'X-API-Key': process.env.WALLET_API_KEY,
            'Content-Type': 'application/json',
            'x-wallet-id': wallet == 'users' ? 'default' : process.env.WALLET_ID,
          },
          body: JSON.stringify({
            nc_id: this.ncid,
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

  public async state(ncid: string, balances: string[], fields: string[], calls: string[]): Promise<any> {
    if (!process.env.LOCAL_WALLET_MASTER_URL || !process.env.WALLET_ID || !process.env.WALLET_API_KEY) {
      // If Wallet URL is not given, returns fake data
      return {}
    }
    try {
      const localWalletUrl = `${process.env.LOCAL_WALLET_MASTER_URL}/wallet/nano-contracts/state`
      if (localWalletUrl) {
        const balances_string = balances.map((token) => `balances[]=${token}&`)
        const fields_string = fields.map((field) => `fields[]=${field}&`)
        const calls_string = calls.map((call) => `calls[]=${call}&`)
        const requestOptions = {
          method: 'GET',
          headers: { 'x-wallet-id': process.env.WALLET_ID, 'X-API-Key': process.env.WALLET_API_KEY },
          params: `id=${ncid}&${balances_string}${fields_string}${calls_string}`,
        }
        try {
          const response = await fetch(localWalletUrl, requestOptions)
          return await response.json()
        } catch {
          throw new Error('Failed to get data from local wallet')
        }
      }
    } catch (error: any) {
      throw new Error('Error getting nc state: ' + error.message)
    }
  }

  public async history(ncid: string): Promise<any> {
    if (!process.env.LOCAL_WALLET_MASTER_URL || !process.env.WALLET_ID || !process.env.WALLET_API_KEY) {
      // If Wallet URL is not given, returns fake data
      return {}
    }
    try {
      const localWalletUrl = `${process.env.LOCAL_WALLET_MASTER_URL}/wallet/nano-contracts/history`
      if (localWalletUrl) {
        const requestOptions = {
          method: 'GET',
          headers: { 'x-wallet-id': process.env.WALLET_ID, 'X-API-Key': process.env.WALLET_API_KEY },
          params: `id=${ncid}`,
        }
        try {
          const response = await fetch(localWalletUrl, requestOptions)
          return await response.json()
        } catch {
          throw new Error('Failed to get data from local wallet')
        }
      }
    } catch (error: any) {
      throw new Error('Error getting nc state: ' + error.message)
    }
  }
}
