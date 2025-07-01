import { seed_nc } from '@dozer/nanocontracts'
import * as readline from 'readline'

import { seedConfig } from './seed_config'

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const shouldContinue = await new Promise<boolean>((resolve) => {
    if (
      process.env.NEXT_PUBLIC_LOCAL_NODE_URL?.includes('dozer.finance') ||
      process.env.LOCAL_WALLET_MASTER_URL?.includes('dozer.finance') ||
      process.env.LOCAL_WALLET_USERS_URL?.includes('dozer.finance')
    ) {
      rl.question(
        'You are about to seed a production environment. Are you sure you want to continue? (y/n) ',
        (answer) => {
          rl.close()
          resolve(answer.toLowerCase() === 'y')
        }
      )
    } else {
      rl.close()
      resolve(true) // Continue if the condition is not met
    }
  })

  if (!shouldContinue) {
    console.log('Aborting...')
    process.exit(0)
  }

  const args = process.argv.slice(2)

  const n_users_Arg = args.find((arg) => arg.startsWith('--n_users='))
  const n_users = n_users_Arg ? n_users_Arg.split('=')[1] : '1'

  console.log('=== DOZER POOL MANAGER SEEDING ===')
  console.log('Using configuration from seed_config.ts')
  console.log(`Tokens to create: ${seedConfig.tokens.length}`)
  console.log(`Pools to create: ${seedConfig.pools.length}`)
  console.log('===================================')

  const result = await seed_nc(parseInt(n_users), seedConfig)

  console.log('\n=== SEEDING COMPLETED ===')
  console.log('Pool Manager Contract ID:', result.manager_ncid)
  console.log('Pool Keys:', result.poolKeys)
  console.log('Token UUIDs:')
  for (const [key, value] of Object.entries(result)) {
    if (key.endsWith('_uuid')) {
      console.log(`  ${key}: ${value}`)
    }
  }
  console.log('========================')

  console.log('\nNOTE: Database seeding is no longer needed.')
  console.log('All pool and token data can be fetched from the contract using view methods.')
  console.log('Historical data can be obtained via state queries at specific timestamps.')
}

main()
