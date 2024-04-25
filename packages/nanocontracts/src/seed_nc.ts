import sanitizedConfig from './config'
import { LiquidityPool } from './liquiditypool'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function PostHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (
    !sanitizedConfig.LOCAL_WALLET_MASTER_URL ||
    !sanitizedConfig.WALLET_ID ||
    !sanitizedConfig.LOCAL_WALLET_USERS_URL
  ) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL or Wallet ID is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? sanitizedConfig.LOCAL_WALLET_MASTER_URL : sanitizedConfig.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
    try {
      const response = await fetch(localWalletUrl, requestOptions)
      return await response.json()
    } catch {
      throw new Error('Failed to post data to local wallet')
    }
  } catch (error: any) {
    throw new Error('Error posting data: ' + error.message)
  }
}

async function GetHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (
    !sanitizedConfig.LOCAL_WALLET_MASTER_URL ||
    !sanitizedConfig.WALLET_ID ||
    !sanitizedConfig.LOCAL_WALLET_USERS_URL
  ) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL or Wallet ID is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? sanitizedConfig.LOCAL_WALLET_MASTER_URL : sanitizedConfig.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'GET',
      headers: { ...headers, 'Content-Type': 'application/json' },
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

async function main() {
  // write the script to initialize wallet and create the contract
  let DZR_uuid, USDT_uuid, admin_address, HTR_DZR_ncid, HTR_USDT_ncid
  // 1. Start the master wallet
  console.log('Starting wallet...')
  await PostHeadless('master', '/start', {}, { 'wallet-id': sanitizedConfig.WALLET_ID, seedKey: 'genesis' }).then(
    async (data) => {
      if (data.success || data.errorCode == 'WALLET_ALREADY_STARTED') {
        console.log(data.success ? 'Wallet started!' : 'Wallet was already started')
      } else {
        throw new Error(`Failed to start wallet. ${data.message}`)
      }
    }
  )
  console.log('Waiting to wallet to be ready')
  await delay(5000).then(() => {
    console.log('Wallet is ready!')
  })

  // 2. Create the DZR token
  console.log('Creating DZR Token...')
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': sanitizedConfig.WALLET_ID },
    { name: 'Dozer', symbol: 'DZR', amount: 100000000 }
  ).then((data) => {
    if (data.success) {
      DZR_uuid = data.configurationString.split(':')[2]
      console.log(`Token DZR Created - UUID: ${DZR_uuid}`)
    } else {
      throw new Error(`Failed to create DZR token. ${data.message}`)
    }
  })

  // 3. Create the USDT token
  console.log('Creating USDT Token...')
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': sanitizedConfig.WALLET_ID },
    { name: 'USD Tether', symbol: 'USDT', amount: 1000000 }
  ).then((data) => {
    if (data.success) {
      USDT_uuid = data.configurationString.split(':')[2]
      console.log(`Token USDT Created - UUID: ${USDT_uuid}`)
    } else {
      throw new Error(`Failed to create USDT token. ${data.message}`)
    }
  })

  // 4. Get Wallet admin address
  console.log('Getting Wallet admin address...')
  await GetHeadless('master', '/wallet/address', { 'x-wallet-id': sanitizedConfig.WALLET_ID }, {}).then((data) => {
    if (data.address) {
      admin_address = data.address
      console.log(`Wallet admin address: ${admin_address}`)
    } else {
      throw new Error(`Failed to get admin address. ${data.message}`)
    }
  })

  // 5. Create the HTR-DZR Pool
  console.log('Creating HTR-DZR Pool...')
  if (DZR_uuid) {
    const HTR_DZR_pool = new LiquidityPool('00', DZR_uuid, 0.5, 'none', admin_address)
    console.log(`HTR-DZR Pool created. ncid: ${HTR_DZR_pool.ncid}`)
  } else throw new Error('DZR UUID not found')
}
main()
