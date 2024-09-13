import { seed_db } from '@dozer/database'
import { seed_nc } from '@dozer/nanocontracts'
import * as readline from 'readline'

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
        'You are about to seed a production database. Are you sure you want to continue? (y/n) ',
        (answer) => {
          rl.close()
          resolve(answer.toLowerCase() === 'y')
        }
      )
    } else {
      resolve(true) // Continue if the condition is not met
    }
  })

  if (!shouldContinue) {
    console.log('Aborting...')
    process.exit(0)
  }
  const args = process.argv.slice(2)

  const n_users_Arg = args.find((arg) => arg.startsWith('--n_users='))
  const n_users = n_users_Arg ? n_users_Arg.split('=')[1] : '5'

  const response = await seed_nc(parseInt(n_users))

  const snaps_periodArgs = args.find((arg) => arg.startsWith('--snaps_period='))
  const snaps_period = snaps_periodArgs ? parseInt(snaps_periodArgs.split('=')[1]) : 0

  await seed_db(response, snaps_period)
  console.log('Seed Completed!')
}

main()
