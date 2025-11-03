import { createServerSideHelpers } from '@trpc/react-query/server'
import { appRouter } from '../root'
import prisma from '@dozer/database'
import superjson from 'superjson'

export const generateSSGHelper = () =>
  createServerSideHelpers({
    router: appRouter,
    ctx: {
      prisma,
      req: undefined as any, // SSG context doesn't have req/res
      res: undefined as any,
    },
    transformer: superjson, // optional - adds superjson serialization
  })
