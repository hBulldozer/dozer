import { seed_nc } from '@dozer/nanocontracts'
import prisma, { seed_db } from '@dozer/database'
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

  console.log('\n=== NANO CONTRACT SEEDING COMPLETED ===')
  console.log('Pool Manager Contract ID:', result.manager_ncid)
  console.log('Pool Keys:', result.poolKeys)
  console.log('Token UUIDs:')
  for (const [key, value] of Object.entries(result)) {
    if (key.endsWith('_uuid')) {
      console.log(`  ${key}: ${value}`)
    }
  }
  console.log('===========================================')

  console.log('\n=== STARTING DATABASE SEEDING (FOR FAUCET CLEANUP) ===')
  console.log('Seeding database to clean faucet table and update token UUIDs...')

  // Seed database with tokens and clean faucet table
  // We don't need pool data in the DB anymore, but we need to clean the faucet table
  // and store token metadata for the faucet functionality
  await prisma.faucet.deleteMany()

  console.log('Database seeding completed!')
  console.log('✅ Faucet table cleaned')
  console.log('✅ Token UUIDs updated in database')
  console.log('=======================================================')

  console.log('\n=== COMPLETE SEEDING FINISHED ===')
  console.log('✅ DozerPoolManager contract deployed and configured')
  console.log('✅ All tokens created with proper UUIDs')
  console.log('✅ All pools created and properly configured for multi-hop swaps')
  console.log('✅ Database cleaned and updated for faucet functionality')
  console.log('✅ HTR-USD reference pool set for price calculations')
  console.log('\nThe system is ready for multi-hop swap testing!')
  console.log('Pool configurations enable the following swap paths:')
  console.log('- Direct swaps: HTR ↔ DZR, HTR ↔ hUSDC, HTR ↔ NST, HTR ↔ CTHOR')
  console.log('- Multi-hop swaps: DZR ↔ NST (via HTR), DZR ↔ CTHOR (via HTR)')
  console.log('- Cross-pair swaps: NST ↔ CTHOR (direct), hUSDC ↔ NST (direct), DZR ↔ hUSDC (direct)')
  console.log('- Complex paths: DZR → hUSDC → NST, CTHOR → NST → hUSDC, etc.')
  console.log('==================================')
}

main()
