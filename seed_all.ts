import { seed_db } from '@dozer/database'
import { seed_nc } from '@dozer/nanocontracts'

import { seedConfig } from './seed_config'

interface NanoInfoType {
  [key: string]: string
}

async function main() {
  // ... (keep the existing code for user confirmation)

  const args = process.argv.slice(2)

  const n_users_Arg = args.find((arg) => arg.startsWith('--n_users='))
  const n_users = n_users_Arg ? n_users_Arg.split('=')[1] : '1'

  const response: NanoInfoType = await seed_nc(parseInt(n_users), seedConfig)

  const snaps_periodArgs = args.find((arg) => arg.startsWith('--snaps_period='))
  const snaps_period = snaps_periodArgs ? parseInt(snaps_periodArgs.split('=')[1]) : 0

  await seed_db(seedConfig, response, snaps_period)
  console.log('Seed Completed!')
}

main()
