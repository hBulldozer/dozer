import { seed_db } from '@dozer/database'
import { seed_nc } from '@dozer/nanocontracts'

async function main() {
  const args = process.argv.slice(2)

  const n_users_Arg = args.find((arg) => arg.startsWith('--n_users='))
  const n_users = n_users_Arg ? n_users_Arg.split('=')[1] : '5'

  const response = await seed_nc(parseInt(n_users))
  console.log(response)
  await seed_db(response)
  console.log('Seed Completed!')
}

main()
