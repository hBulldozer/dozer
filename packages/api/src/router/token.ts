import { z } from 'zod'

import { fetchNodeData } from '../helpers/fetchFunction'
import { createTRPCRouter, procedure } from '../trpc'

export const tokenRouter = createTRPCRouter({
  all: procedure.query(({ ctx }) => {
    const tokens = ctx.prisma.token.findMany({
      select: {
        custom: true,
        imageUrl: true,
        id: true,
        name: true,
        uuid: true,
        symbol: true,
        chainId: true,
        decimals: true,
        createdBy: true,
        pools0: {
          select: {
            id: true,
            reserve0: true,
            reserve1: true,
            token1: {
              select: {
                uuid: true,
              },
            },
          },
        },
        pools1: {
          select: {
            id: true,
            reserve0: true,
            reserve1: true,
            token0: {
              select: {
                uuid: true,
              },
            },
          },
        },
        // poolsLP: {
        //   select: {
        //     id: true,
        //     reserve0: true,
        //     reserve1: true,
        //     tokenLP: {
        //       select: {
        //         uuid: true,
        //       },
        //     },
        //   },
        // },
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    return tokens
  }),
  bySymbol: procedure.input(z.object({ symbol: z.string().max(8).min(3) })).query(({ ctx, input }) => {
    return ctx.prisma.token.findFirst({ select: { uuid: true }, where: { symbol: input.symbol } })
  }),
  totalSupply: procedure.input(z.string()).query(async ({ input }) => {
    const endpoint = 'thin_wallet/token'
    const queryParams = [`id=${input}`]
    const rawTokenData = await fetchNodeData(endpoint, queryParams)
    return rawTokenData.total
  }),
  allTotalSupply: procedure.query(async ({ ctx }) => {
    const tokens = await ctx.prisma.token.findMany({
      select: {
        uuid: true,
      },
    })
    if (!tokens) {
      throw new Error(`Failed to fetch tokens, received ${tokens}`)
    }
    const endpoint = 'thin_wallet/token'
    const totalSupplies: Record<string, number> = {}
    tokens.forEach(async (token) => {
      const queryParams = [`id=${token.uuid}`]
      const rawTokenData = await fetchNodeData(endpoint, queryParams)
      totalSupplies[token.uuid] = rawTokenData.total / 100
    })
    return totalSupplies
  }),
  createCustom: procedure
    .input(
      z.object({
        name: z.string(),
        symbol: z.string(),
        chainId: z.number(),
        decimals: z.number(),
        description: z.string(),
        imageUrl: z.string(),
        telegram: z.string().optional(),
        twitter: z.string().optional(),
        website: z.string().optional(),
        createdBy: z.string(),
        totalSupply: z.number(),
        hash: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create token on blockchain
      // const start = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/start`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-API-Key': process.env.WALLET_API_KEY || '',
      //   },
      //   body: JSON.stringify({ 'wallet-id': process.env.WALLET_ID, seedKey: 'genesis' }),
      // })
      // const response = await fetch(`${process.env.LOCAL_WALLET_MASTER_URL}/wallet/create-token`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'x-wallet-id': process.env.WALLET_ID || '',
      //     'x-api-key': process.env.WALLET_API_KEY || '',
      //   },
      //   body: JSON.stringify({
      //     name: input.name,
      //     symbol: input.symbol,
      //     amount: input.totalSupply * 100, // Convert to cents
      //     address: input.createdBy,
      //   }),
      // })

      // const data = await response.json()

      // if (!data || !data.hash) {
      //   throw new Error('Failed to create token on blockchain')
      // }

      // Create token in database using the hash as UUID
      const token = await ctx.prisma.token.create({
        data: {
          id: input.hash,
          custom: true,
          name: input.name,
          uuid: input.hash, // Use the blockchain transaction hash as UUID
          about: input.description,
          symbol: input.symbol,
          chainId: input.chainId,
          decimals: input.decimals,
          imageUrl: input.imageUrl,
          telegram: input.telegram,
          twitter: input.twitter,
          website: input.website,
          createdBy: input.createdBy,
        },
      })

      return { result: token, hash: input.hash }
    }),
  byUuid: procedure.input(z.object({ uuid: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.token.findFirst({
      where: { uuid: input.uuid },
    })
  }),
  socialURLs: procedure.input(z.object({ uuid: z.string() })).query(({ ctx, input }) => {
    return ctx.prisma.token.findFirst({
      where: { uuid: input.uuid },
      select: {
        telegram: true,
        twitter: true,
        website: true,
      },
    })
  }),
  checkCreatedBy: procedure
    .input(z.object({ address: z.string() }))
    .output(z.string().or(z.undefined()))
    .query(async ({ ctx, input }) => {
      type Transaction = Record<string, unknown>

      const endpoint = 'thin_wallet/address_search'
      const queryParams = [`address=${input.address}`, 'count=20']
      const data = await fetchNodeData(endpoint, queryParams)
      if (!data || !data.success || !data.transactions) {
        throw new Error('Failed to fetch transactions')
      }
      const transactions = data.transactions
      if (data.has_more) {
        // If more than 20 transactions, check only in database
        const checkInDb = await ctx.prisma.token.findFirst({
          where: { createdBy: input.address },
        })
        return checkInDb?.uuid
      } else {
        // If less than 20 transactions, check in the node address_search endpoint
        const createTokenTx = transactions.find((tx: Transaction) => 'token_symbol' in tx && 'token_name' in tx)
        return createTokenTx?.tx_id
      }
    }),
})
