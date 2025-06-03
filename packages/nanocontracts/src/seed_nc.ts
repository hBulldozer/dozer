import { LiquidityPool } from './liquiditypool'
import { Oasis } from './oasis'
import { NanoContract } from './nanocontract'

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
  bridged?: boolean
  sourceChain?: string
  targetChain?: string
  originalAddress?: string
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
  const poolKeys: string[] = []
  let admin_address: string = ''
  let manager_ncid: string = ''

  // 1. Create tokens
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

  // 2. Get Wallet admin address
  console.log('Getting Wallet admin address...')
  await GetHeadless('master', '/wallet/address', { 'x-wallet-id': process.env.WALLET_ID }, {}).then((data) => {
    if (data.address) {
      admin_address = data.address
      console.log(`Wallet admin address: ${admin_address}`)
    } else {
      throw new Error(`Failed to get admin address. ${data.message}`)
    }
  })

  // 3. Deploy the singleton DozerPoolManager contract
  console.log('Deploying DozerPoolManager contract...')
  // TODO: Replace with actual blueprint ID for DozerPoolManager
  const manager_blueprint_id = process.env.POOL_MANAGER_BLUEPRINT_ID || 'DOZER_POOL_MANAGER_BLUEPRINT_ID'
  const managerContract = new NanoContract('fake')
  const managerInitResp = await managerContract.create(manager_blueprint_id, admin_address, [], [])
  manager_ncid = managerInitResp.hash
  managerContract.ncid = manager_ncid
  console.log(`DozerPoolManager deployed. Contract ID: ${manager_ncid}`)

  // 4. Create HTR-token pools and at least one non-HTR pool
  const HTR_UUID = '00'
  const createdPools: { key: string; tokenA: string; tokenB: string; fee: number }[] = []
  // HTR-token pools
  for (const token of config.tokens) {
    if (token.symbol === 'HTR') continue
    const token_uuid = tokenUUIDs[`${token.symbol}_uuid`]
    if (!token_uuid) throw new Error(`Token UUID for ${token.symbol} is undefined`)
    const actions = [
      {
        type: 'deposit' as const,
        token: HTR_UUID,
        amount: 100000 * 100,
        address: admin_address,
        changeAddress: admin_address,
      },
      {
        type: 'deposit' as const,
        token: token_uuid,
        amount: 70000 * 100,
        address: admin_address,
        changeAddress: admin_address,
      },
    ]
    const args = [5, 1] // Example: fee=5, protocolFee=1 (adjust as needed)
    const createResp = await managerContract.execute(admin_address, 'create_pool', actions, args)
    const pool_key = createResp.value // Should be the returned pool key string
    poolKeys.push(pool_key)
    createdPools.push({ key: pool_key, tokenA: HTR_UUID, tokenB: token_uuid, fee: 5 })
    console.log(`Created pool: ${pool_key}`)
    await check_wallet('master')
  }
  // At least one non-HTR pool (multi-hop)
  if (config.tokens.length > 2) {
    const token1 = config.tokens[1]
    const token2 = config.tokens[2]
    if (!token1 || !token2) throw new Error('Not enough tokens for non-HTR pool creation')
    const tokenA = tokenUUIDs[`${token1.symbol}_uuid`]
    const tokenB = tokenUUIDs[`${token2.symbol}_uuid`]
    if (!tokenA || !tokenB) throw new Error('Non-HTR token UUIDs are undefined')
    const actions = [
      {
        type: 'deposit' as const,
        token: tokenA,
        amount: 50000 * 100,
        address: admin_address,
        changeAddress: admin_address,
      },
      {
        type: 'deposit' as const,
        token: tokenB,
        amount: 50000 * 100,
        address: admin_address,
        changeAddress: admin_address,
      },
    ]
    const args = [5, 1]
    const createResp = await managerContract.execute(admin_address, 'create_pool', actions, args)
    const pool_key = createResp.value
    poolKeys.push(pool_key)
    createdPools.push({ key: pool_key, tokenA, tokenB, fee: 5 })
    console.log(`Created non-HTR pool: ${pool_key}`)
    await check_wallet('master')
  }

  await wait_next_block()

  // 5. Sign all but one pool
  for (let i = 0; i < createdPools.length; i++) {
    if (i === 0) continue // Leave the first pool unsigned for testing
    const pool = createdPools[i]
    if (!pool) continue
    const { tokenA, tokenB, fee } = pool
    if (!tokenA || !tokenB || fee === undefined) continue
    const args = [tokenA, tokenB, fee]
    await managerContract.execute(admin_address, 'sign_pool', [], args)
    console.log(`Signed pool: ${pool.key}`)
    await check_wallet('master')
  }

  await wait_next_block()

  // 6. Output manager contract ID and pool keys
  console.log('--- POOL MANAGER CONTRACT ID ---')
  console.log(manager_ncid)
  console.log('--- POOL KEYS ---')
  for (const key of poolKeys) {
    console.log(key)
  }

  // 7. Return token UUIDs and pool keys
  return {
    manager_ncid,
    ...tokenUUIDs,
    poolKeys,
  }
}
