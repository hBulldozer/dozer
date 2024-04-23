async function PostHeadless(wallet: string, path: string, headers: any, body: any): Promise<any> {
  // TODO: Create a validator for Hathor valid address?
  if (!process.env.LOCAL_WALLET_MASTER_URL || !process.env.WALLET_ID || !process.env.LOCAL_WALLET_USERS_URL) {
    // If Wallet URL is not given, returns fake data
    throw new Error('Wallet URL or Wallet ID is not given')
  }
  try {
    const localWalletUrl = `${
      wallet == 'master' ? process.env.LOCAL_WALLET_MASTER_URL : process.env.LOCAL_WALLET_USERS_URL
    }${path}`
    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: { ...body, 'Content-Type': 'application/json' },
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

async function main() {
  // write the script to initialize wallet and create the contract
  let DZR_uuid
  // 1. Start the master wallet
  console.log('Starting wallet...')
  PostHeadless('master', '/start', {}, { 'wallet-id': process.env.WALLET_ID, seedKey: 'default' }).then((data) => {
    if (data.success) {
      console.log('Wallet started!')
      PostHeadless(
        'master',
        '/wallet/create-token',
        { 'x-wallet-id': process.env.WALLET_ID },
        { name: 'Dozer', symbol: 'DZR', amount: 100000000 }
      ).then((data) => {
        if (data.success) {
          DZR_uuid = data.token_uuid
        } else {
          throw new Error('Failed to create token')
        }
      })
    } else {
      throw new Error('Failed to start wallet')
    }
  })
}
main()
  .then(async () => {
    console.log('Seed of Nanocontract complete!')
  })
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
