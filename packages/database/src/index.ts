import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Important: Soft shutdown to properly close connections
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
// export { Prisma, PrismaClient } from '@prisma/client'
export { seed_db } from './seed_db'
export * from '@prisma/client'
