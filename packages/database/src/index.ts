// import 'dotenv/config'

import { PrismaClient } from '@prisma/client'
import { seed_db } from './seed_db'
// import { Prisma, PrismaClient } from '@prisma/client'
// import { Redis } from 'ioredis'
// import { createPrismaRedisCache } from 'prisma-redis-middleware'

// if (!process.env['DATABASE_URL']) throw new Error('DATABASE_URL is required')
// if (!process.env['REDIS_URL']) throw new Error('REDIS_URL is required')

declare let global: { prisma: PrismaClient }

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

export let prisma: PrismaClient

if (process.env['NODE_ENV'] === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}


export default prisma
// export { Prisma, PrismaClient } from '@prisma/client'
export { seed_db } from './seed_db'
export * from '@prisma/client'
