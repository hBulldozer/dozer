import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  // write the script to initialize wallet and create the contract
}
main()
  .then(async () => {
    console.log('Seed of Nanocontract complete!')
  })
  .catch(async (e) => {
    console.error(e)
    process.exit(1)
  })
