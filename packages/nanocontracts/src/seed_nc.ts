import { LiquidityPool } from './liquiditypool'

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

export async function seed_nc(n_users = 5) {
  // write the script to initialize wallet and create the contract
  let DZR_uuid, USDT_uuid, admin_address, HTR_USDT_ncid, HTR_DZR_ncid
  let users_addresses: string[] | undefined
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

  // 2. Create the USDT token
  await delay(2000).then(() => {
    console.log('Creating DZR Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'Dozer', symbol: 'DZR', amount: 700_000_00 }
  ).then((data) => {
    if (data.success) {
      DZR_uuid = data.configurationString.split(':')[2]
      console.log(`Token DZR Created - UUID: ${DZR_uuid}`)
    } else {
      throw new Error(`Failed to create DZR token. ${data.error}`)
    }
  })

  await check_wallet('master')
  // 3. Create the USDT token
  await delay(2000).then(() => {
    console.log('Creating USDT Token...')
  })
  await PostHeadless(
    'master',
    '/wallet/create-token',
    { 'x-wallet-id': process.env.WALLET_ID },
    { name: 'USD Tether', symbol: 'USDT', amount: 140_000_00 }
  ).then((data) => {
    if (data.success) {
      USDT_uuid = data.configurationString.split(':')[2]
      console.log(`Token USDT Created - UUID: ${USDT_uuid}`)
    } else {
      throw new Error(`Failed to create USDT token. ${data.error}`)
    }
  })

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

  // 5. Create the HTR-DZR Pool
  console.log('Creating HTR-DZR Pool...')
  if (DZR_uuid && admin_address) {
    const HTR_DZR_pool = new LiquidityPool('00', DZR_uuid, 0)
    const response = await HTR_DZR_pool.initialize(admin_address, 1_000_000, 700_000)
    HTR_DZR_pool.ncid = response.hash
    HTR_DZR_ncid = response.hash
    console.log(`HTR-DZR Pool created. ncid: ${HTR_DZR_pool.ncid}`)
  } else throw new Error('DZR UUID and/or admin_address not found.')

  await check_wallet('master')
  // 6. Create the HTR-USDT Pool
  await delay(2000).then(() => {
    console.log('Creating HTR-USDT Pool...')
  })
  if (USDT_uuid && admin_address) {
    const HTR_USDT_pool = new LiquidityPool('00', USDT_uuid, 2)
    const response = await HTR_USDT_pool.initialize(admin_address, 1_000_000, 70_000)
    HTR_USDT_pool.ncid = response.hash
    HTR_USDT_ncid = response.hash
    console.log(`HTR-USDT Pool created. ncid: ${HTR_USDT_pool.ncid}`)
  } else throw new Error('USDT UUID and/or admin_address not found.')

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
        address = data.address
        console.log(`User #${i + 1} address: ${address}`)
      } else {
        throw new Error(`Failed to get user address. ${data.message}`)
      }
    })
    console.log(`Sending 100k HTR to ${address}...`)
    await PostHeadless(
      'master',
      '/wallet/simple-send-tx',
      { 'x-wallet-id': process.env.WALLET_ID },
      {
        address: address,
        value: 100_000_00,
        token: '00',
      }
    ).then(async (data) => {
      if (data.success) {
        console.log(`Sent 100k HTR to ${address}.`)
      } else {
        throw new Error(`Failed to send HTR to ${address}.` + data)
      }
    })
    await delay(2000)
  }

  console.log('Users funding complete!')
  console.log('Seed Complete!')

  return {
    DZR_uuid: DZR_uuid,
    USDT_uuid: USDT_uuid,
    HTR_USDT_ncid: HTR_USDT_ncid,
    HTR_DZR_ncid: HTR_DZR_ncid,
  }
}
