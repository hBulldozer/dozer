import { LiquidityPool } from './liquiditypool'
import { Oasis } from './oasis'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function check_wallet(wallet: string) {
  let response, statusCode
  while (!(statusCode == 3)) {
    await delay(1000)
    try {
      response = await GetHeadless(
        wallet,
        '/wallet/status',
        {
          'x-wallet-id': wallet == 'master' ? process.env.WALLET_ID : 'default',
          'X-API-Key': process.env.WALLET_API_KEY,
        },
        {}
      ).then((res) => {
        console.log('Waiting wallet to be ready...')
        statusCode = res.statusCode
      })
    } catch (e) {
      console.log(e)
    }
  }

  return response
}

async function wait_next_block() {
  const response = await fetchNodeData('status', [])
  const height = response.dag.best_block.height
  console.log('Waiting for next block, last block height:', height)
  for (let i = 0; i < 120; i++) {
    const new_height = await fetchNodeData('status', [])
    if (new_height.dag.best_block.height > height) {
      console.log('Next block arrived!')
      return
    }
    await delay(1000)
  }
  throw new Error('Timeout waiting for next block')
}

export async function fetchNodeData(endpoint: string, queryParams: string[]): Promise<any> {
  if (!process.env.NEXT_PUBLIC_LOCAL_NODE_URL && !process.env.NEXT_PUBLIC_PUBLIC_NODE_URL) {
    // If Node URL is not given, returns fake data
    throw new Error(`Failed to fetch node, inform the NEXT_PUBLIC_LOCAL_NODE_URL or NEXT_PUBLIC_PUBLIC_NODE_URL`)
  }
  try {
    const localNodeUrl = `${process.env.NEXT_PUBLIC_LOCAL_NODE_URL}${endpoint}?${queryParams.join('&')}`
    if (localNodeUrl) {
      try {
        const response = await fetch(localNodeUrl)
        return await response.json()
      } catch {
        const publicNodeUrl = `${process.env.NEXT_PUBLIC_PUBLIC_NODE_URL}${endpoint}?${queryParams.join('&')}`
        if (publicNodeUrl) {
          const response = await fetch(publicNodeUrl)
          return await response.json()
        }

        throw new Error('Failed to fetch data from both local and public nodes')
      }
    }
  } catch (error: any) {
    throw new Error('Error fetching data: ' + error.message)
  }
}

async function PostHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (
    !process.env.LOCAL_WALLET_MASTER_URL ||
    !process.env.WALLET_ID ||
    !process.env.LOCAL_WALLET_USERS_URL ||
    !process.env.WALLET_API_KEY
  ) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL, Wallet ID or Wallet API Key is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? process.env.LOCAL_WALLET_MASTER_URL : process.env.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'X-API-Key': process.env.WALLET_API_KEY },
      body: JSON.stringify(body),
    }
    const response = await fetch(localWalletUrl, requestOptions)
    return await response.json()
  } catch (error: any) {
    throw new Error('Error posting data: ' + error.message)
  }
}

async function GetHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (
    !process.env.LOCAL_WALLET_MASTER_URL ||
    !process.env.WALLET_ID ||
    !process.env.LOCAL_WALLET_USERS_URL ||
    !process.env.WALLET_API_KEY
  ) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL, Wallet ID or Wallet API Key is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? process.env.LOCAL_WALLET_MASTER_URL : process.env.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'GET',
      headers: { ...headers, 'Content-Type': 'application/json', 'X-API-Key': process.env.WALLET_API_KEY },
    }
    try {
      const response = await fetch(localWalletUrl, requestOptions)
      return await response.json()
    } catch {
      throw new Error('Failed to get data from local wallet')
    }
  } catch (error: any) {
    throw new Error('Error getting data: ' + error.message)
  }
}
export interface TokenConfig {
  name: string
  symbol: string
  totalSupply: number
  about: string
}

export interface PoolConfig {
  tokenSymbol: string
  htrQuantity: number
  tokenQuantity: number
  fee: number
  protocolFee: number
}

export interface OasisConfig {
  tokenSymbol: string
  htrQuantity: number
}

export interface SeedConfig {
  tokens: TokenConfig[]
  pools: PoolConfig[]
  oasis: OasisConfig[]
}

export async function seed_nc(n_users = 5, seedConfig: SeedConfig) {
  // write the script to initialize wallet and create the contract
  let USDT_uuid, admin_address
  console.log('*** Starting to seed NanoContracts... ***')
  // 1. Start the master wallet
  console.log('Starting wallet...')
  await PostHeadless('master', '/start', {}, { 'wallet-id': process.env.WALLET_ID, seedKey: 'genesis' }).then(
    async (data) => {
      if (data.success || data.errorCode == 'WALLET_ALREADY_STARTED') {
        console.log(data.success ? 'Wallet started!' : 'Wallet was already started')
      } else {
        throw new Error(`Failed to start wallet. ${data.message}`)
      }
    }
  )
  await check_wallet('master')

  const config = seedConfig

  const tokenUUIDs: { [key: string]: string } = {}
  const poolNCIDs: { [key: string]: string } = {}
  const oasisNCIDs: { [key: string]: string } = {}

  // Create tokens
  for (const token of config.tokens) {
    console.log(`Creating ${token.name} Token...`)
    await PostHeadless(
      'master',
      '/wallet/create-token',
      { 'x-wallet-id': process.env.WALLET_ID },
      { name: token.name, symbol: token.symbol, amount: token.totalSupply }
    ).then((data) => {
      if (data.success) {
        tokenUUIDs[`${token.symbol}_uuid`] = data.configurationString.split(':')[2]
        console.log(`Token ${token.symbol} Created - UUID: ${tokenUUIDs[`${token.symbol}_uuid`]}`)
      } else {
        throw new Error(`Failed to create ${token.symbol} token. ${data.error}`)
      }
    })
    await check_wallet('master')
  }

  // 4. Get Wallet admin address
  console.log('Getting Wallet admin address...')
  await GetHeadless('master', '/wallet/address', { 'x-wallet-id': process.env.WALLET_ID }, {}).then((data) => {
    if (data.address) {
      admin_address = data.address
      console.log(`Wallet admin address: ${admin_address}`)
    } else {
      throw new Error(`Failed to get admin address. ${data.message}`)
    }
  })

  // Create pools
  for (const pool of config.pools) {
    console.log(`Creating ${pool.tokenSymbol}-HTR Pool...`)
    if (pool.tokenSymbol && tokenUUIDs[`${pool.tokenSymbol}_uuid`] && admin_address) {
      const newPool = new LiquidityPool(
        '00',
        tokenUUIDs[`${pool.tokenSymbol}_uuid`] || '',
        pool.fee * 100,
        pool.protocolFee * 100
      )
      const response = await newPool.initialize(admin_address, pool.htrQuantity, pool.tokenQuantity)
      newPool.ncid = response.hash
      poolNCIDs[`${pool.tokenSymbol}_HTR_ncid`] = response.hash
      console.log(`${pool.tokenSymbol}-HTR Pool created. ncid: ${newPool.ncid}`)
    } else throw new Error(`${pool.tokenSymbol} UUID and/or admin_address not found.`)
    await check_wallet('master')
  }

  await wait_next_block()

  // Create oasis
  for (const oasis of config.oasis) {
    console.log(`Creating ${oasis.tokenSymbol}-HTR Oasis...`)
    if (oasis.tokenSymbol && tokenUUIDs[`${oasis.tokenSymbol}_uuid`] && admin_address) {
      const newOasis = new Oasis(
        tokenUUIDs[`${oasis.tokenSymbol}_uuid`] || '',
        poolNCIDs[`${oasis.tokenSymbol}_HTR_ncid`] || ''
      )
      const response = await newOasis.initialize(admin_address, oasis.htrQuantity)
      newOasis.ncid = response.hash
      oasisNCIDs[`${oasis.tokenSymbol}_HTR_oasisncid`] = response.hash
      console.log(`${oasis.tokenSymbol}-HTR Oasis created. ncid: ${newOasis.ncid}`)
    } else throw new Error(`${oasis.tokenSymbol} UUID and/or admin_address not found.`)
    await check_wallet('master')
  }

  await wait_next_block()

  // 7. Start the users wallet
  console.log('Starting users wallet...')
  await PostHeadless('users', '/start', {}, { 'wallet-id': 'default', seedKey: 'default' }).then(async (data) => {
    if (data.success || data.errorCode == 'WALLET_ALREADY_STARTED') {
      console.log(data.success ? 'Wallet started!' : 'Wallet was already started')
    } else {
      throw new Error(`Failed to start wallet. ${data.message}`)
    }
  })
  await check_wallet('users')

  // 8. Sending 50 HTR for each user
  console.log('Sending funds to users...')
  for (let i = 0; i < n_users; i++) {
    // Get user address
    console.log(`Get address of #${i + 1} user...`)
    let address = ''
    await GetHeadless('users', `/wallet/address?index=${i}`, { 'x-wallet-id': 'default' }, {}).then((data) => {
      if (data.address) {
        address = 'WX6vyaJ1Xs2NWVbfV9eCiNYpnNLD7HRBQZ'
        console.log(`User #${i + 1} address: ${address}`)
      } else {
        throw new Error(`Failed to get user address. ${data.message}`)
      }
    })
    console.log(`Sending 5k USDT to ${address}...`)
    await PostHeadless(
      'master',
      '/wallet/simple-send-tx',
      { 'x-wallet-id': process.env.WALLET_ID },
      {
        address: address,
        value: 5_000_00,
        token: tokenUUIDs['USDT'],
      }
    ).then(async (data) => {
      if (data.success) {
        console.log(`Sent 5k USDT to ${address}.`)
      } else {
        throw new Error(`Failed to send USDT to ${address}.` + data)
      }
    })
    await delay(2000)
  }

  console.log('Users funding complete!')
  console.log('Seed Complete!')

  return {
    ...tokenUUIDs,
    ...poolNCIDs,
    ...oasisNCIDs,
  }
}
