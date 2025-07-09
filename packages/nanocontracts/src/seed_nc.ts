import { PoolManager } from './liquiditypool'
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
  // Optional fields for non-HTR pools
  dzrQuantity?: number
  isNonHTRPool?: boolean
  pairTokenSymbol?: string
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
  const manager_blueprint_id =
    process.env.NEXT_PUBLIC_POOL_MANAGER_BLUEPRINT_ID || 'DOZER_NEXT_PUBLIC_POOL_MANAGER_BLUEPRINT_ID'
  const managerContract = new NanoContract('fake')
  const managerInitResp = await managerContract.create(manager_blueprint_id, admin_address, [], [])
  manager_ncid = managerInitResp.hash
  managerContract.ncid = manager_ncid
  console.log(`DozerPoolManager deployed. Contract ID: ${manager_ncid}`)
  await check_wallet('master')

  // 4. Create pools based on configuration
  const HTR_UUID = '00'
  const createdPools: { key: string; tokenA: string; tokenB: string; fee: number }[] = []

  // Create pools from configuration
  for (const poolConfig of config.pools) {
    if (poolConfig.isNonHTRPool) {
      // Handle non-HTR pools
      console.log(`Creating non-HTR pool: ${poolConfig.pairTokenSymbol}/${poolConfig.tokenSymbol}...`)
      
      const tokenA_uuid = tokenUUIDs[`${poolConfig.pairTokenSymbol}_uuid`]
      const tokenB_uuid = tokenUUIDs[`${poolConfig.tokenSymbol}_uuid`]
      
      if (!tokenA_uuid || !tokenB_uuid) {
        console.log(`Skipping non-HTR pool - token UUIDs not found for ${poolConfig.pairTokenSymbol}/${poolConfig.tokenSymbol}`)
        continue
      }

      // Convert fee from percentage to basis points
      const fee = Math.round(poolConfig.fee * 1000)

      const actions = [
        {
          type: 'deposit' as const,
          token: tokenA_uuid,
          amount: (poolConfig.dzrQuantity || 0) * 100, // DZR amount
          changeAddress: admin_address,
        },
        {
          type: 'deposit' as const,
          token: tokenB_uuid,
          amount: poolConfig.tokenQuantity * 100, // Other token amount
          changeAddress: admin_address,
        },
      ]

      const args = [fee]
      const createResp = await managerContract.execute(admin_address, 'create_pool', actions, args)
      const pool_key = `${tokenA_uuid}/${tokenB_uuid}/${fee}`
      poolKeys.push(pool_key)
      createdPools.push({ key: pool_key, tokenA: tokenA_uuid, tokenB: tokenB_uuid, fee })
      console.log(
        `Created non-HTR pool: ${pool_key} with reserves ${poolConfig.pairTokenSymbol}:${poolConfig.dzrQuantity}, ${poolConfig.tokenSymbol}:${poolConfig.tokenQuantity}`
      )
      await check_wallet('master')
    } else {
      // Handle HTR-token pools
      console.log(`Creating HTR pool: HTR/${poolConfig.tokenSymbol}...`)

      const token_uuid = tokenUUIDs[`${poolConfig.tokenSymbol}_uuid`]
      if (!token_uuid) throw new Error(`Token UUID for ${poolConfig.tokenSymbol} is undefined`)

      // Convert fee from percentage to basis points (e.g., 0.05% -> 5)
      const fee = Math.round(poolConfig.fee * 1000)

      const actions = [
        {
          type: 'deposit' as const,
          token: HTR_UUID,
          amount: poolConfig.htrQuantity * 100, // Convert to cents
          changeAddress: admin_address,
        },
        {
          type: 'deposit' as const,
          token: token_uuid,
          amount: poolConfig.tokenQuantity * 100, // Convert to cents
          changeAddress: admin_address,
        },
      ]

      const args = [fee]
      const createResp = await managerContract.execute(admin_address, 'create_pool', actions, args)
      const pool_key = `${HTR_UUID}/${token_uuid}/${fee}`
      poolKeys.push(pool_key)
      createdPools.push({ key: pool_key, tokenA: HTR_UUID, tokenB: token_uuid, fee })
      console.log(
        `Created HTR pool: ${pool_key} with reserves HTR:${poolConfig.htrQuantity}, ${poolConfig.tokenSymbol}:${poolConfig.tokenQuantity}`
      )
      await check_wallet('master')
    }
  }

  await wait_next_block()

  // 4.5. Set HTR-USD pool reference (if hUSDC pool exists)
  const hUSDC_uuid = tokenUUIDs['hUSDC_uuid']
  if (hUSDC_uuid) {
    const hUSDCPool = createdPools.find((pool) => {
      const tokens = [pool.tokenA, pool.tokenB]
      return tokens.includes(HTR_UUID) && tokens.includes(hUSDC_uuid)
    })

    if (hUSDCPool) {
      console.log('Setting HTR-USD pool reference...')
      const args = [HTR_UUID, hUSDC_uuid, hUSDCPool.fee]
      await managerContract.execute(admin_address, 'set_htr_usd_pool', [], args)
      console.log(`Set HTR-USD pool reference: ${hUSDCPool.key}`)
      await check_wallet('master')
    } else {
      console.log('No HTR-hUSDC pool found - HTR-USD reference not set')
    }
  } else {
    console.log('No hUSDC token found - HTR-USD reference not set')
  }

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
