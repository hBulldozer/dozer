import { seed_nc } from '@dozer/nanocontracts'
import { seed_db } from '@dozer/database'

async function main() {
  const response = await seed_nc()
  console.log(response)
  await seed_db(response)
  console.log('Seed Completed!')
}

main()
