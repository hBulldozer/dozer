import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const newsletterRouter = createTRPCRouter({
  // Subscribe to newsletter
  subscribe: procedure
    .input(
      z.object({
        email: z.string().email('Please enter a valid email address'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if email already exists
        const existingSubscription = await ctx.prisma.newsletter.findUnique({
          where: { email: input.email },
        })

        if (existingSubscription) {
          return {
            success: true,
            message: 'Thank you! Your email is already registered to our newsletter.',
          }
        }

        // Create new subscription
        await ctx.prisma.newsletter.create({
          data: {
            email: input.email,
            registered: false,
          },
        })

        return {
          success: true,
          message: 'Thank you for subscribing to our newsletter!',
        }
      } catch (error) {
        console.error('Error subscribing to newsletter:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to subscribe to newsletter. Please try again.',
        })
      }
    }),

  // Get all newsletter subscribers (for admin purposes)
  getAllSubscribers: procedure.query(async ({ ctx }) => {
    return ctx.prisma.newsletter.findMany({
      orderBy: { submittedAt: 'desc' },
    })
  }),

  // Mark subscriber as registered (for admin purposes)
  markAsRegistered: procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.newsletter.update({
        where: { id: input.id },
        data: { registered: true },
      })
    }),
})
