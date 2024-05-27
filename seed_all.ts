import { seed_db } from '@dozer/database'
import { seed_nc } from '@dozer/nanocontracts'

async function main() {
  const args = process.argv.slice(2)

  const n_users_Arg = args.find((arg) => arg.startsWith('--n_users='))
  const n_users = n_users_Arg ? n_users_Arg.split('=')[1] : '5'

  const response = await seed_nc(parseInt(n_users))

  const snaps_periodArgs = args.find((arg) => arg.startsWith('--snaps_period='))
  const snaps_period = snaps_periodArgs ? parseInt(snaps_periodArgs.split('=')[1]) : 0

  console.log(response)
  await seed_db(response, snaps_period)
  console.log('Seed Completed!')
}

main()
