import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const pointsRouter = createTRPCRouter({
  // Enroll user in the XP points campaign
  enrollUser: procedure
    .input(
      z.object({
        userAddress: z.string().min(1, 'User address is required'),
        campaignId: z.string().optional().default('xp-points-v1'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is already enrolled
        const existingEnrollment = await ctx.prisma.campaignEnrollment.findUnique({
          where: { userAddress: input.userAddress.toLowerCase() },
        })

        if (existingEnrollment) {
          // If already enrolled, just return success (idempotent)
          return {
            success: true,
            message: 'User already enrolled in campaign',
            enrollment: existingEnrollment,
          }
        }

        // Create new enrollment record
        const enrollment = await ctx.prisma.campaignEnrollment.create({
          data: {
            userAddress: input.userAddress.toLowerCase(),
            campaignId: input.campaignId,
            isActive: true,
          },
        })

        return {
          success: true,
          message: 'User successfully enrolled in campaign',
          enrollment,
        }
      } catch (error) {
        console.error('Error enrolling user in campaign:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to enroll user in campaign',
        })
      }
    }),

  // Check if user is enrolled in the campaign
  checkEnrollment: procedure
    .input(
      z.object({
        userAddress: z.string().min(1, 'User address is required'),
        campaignId: z.string().optional().default('xp-points-v1'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const enrollment = await ctx.prisma.campaignEnrollment.findUnique({
          where: { userAddress: input.userAddress.toLowerCase() },
        })

        return {
          isEnrolled: !!enrollment && enrollment.isActive,
          enrollment: enrollment || null,
        }
      } catch (error) {
        console.error('Error checking user enrollment:', error)
        return {
          isEnrolled: false,
          enrollment: null,
        }
      }
    }),

  // Get user enrollment details
  getUserEnrollment: procedure
    .input(
      z.object({
        userAddress: z.string().min(1, 'User address is required'),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const enrollment = await ctx.prisma.campaignEnrollment.findUnique({
          where: { userAddress: input.userAddress.toLowerCase() },
        })

        if (!enrollment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User is not enrolled in any campaign',
          })
        }

        return enrollment
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        console.error('Error fetching user enrollment:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user enrollment',
        })
      }
    }),

  // Update enrollment status (activate/deactivate)
  updateEnrollmentStatus: procedure
    .input(
      z.object({
        userAddress: z.string().min(1, 'User address is required'),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const enrollment = await ctx.prisma.campaignEnrollment.update({
          where: { userAddress: input.userAddress.toLowerCase() },
          data: { isActive: input.isActive },
        })

        return {
          success: true,
          message: `User enrollment ${input.isActive ? 'activated' : 'deactivated'} successfully`,
          enrollment,
        }
      } catch (error) {
        console.error('Error updating enrollment status:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update enrollment status',
        })
      }
    }),

  // Mock endpoints for points data (to be replaced with real implementations later)
  getUserPoints: procedure
    .input(
      z.object({
        userAddress: z.string().min(1, 'User address is required'),
      })
    )
    .query(async ({ input }) => {
      // Mock data for now - replace with real calculation later
      return {
        volumePoints: Math.floor(Math.random() * 10000),
        liquidityPoints: Math.floor(Math.random() * 5000),
        bridgePoints: Math.floor(Math.random() * 2000),
        multiplier: 1.0,
        recentTransactions: [
          {
            transactionHash: '0x1234567890abcdef',
            pointsAwarded: 100,
            volumeUSD: 100.0,
            transactionType: 'swap',
          },
          {
            transactionHash: '0xabcdef1234567890',
            pointsAwarded: 50,
            volumeUSD: 500.0,
            transactionType: 'add_liquidity',
          },
        ],
      }
    }),

  getUserRank: procedure
    .input(
      z.object({
        userAddress: z.string().min(1, 'User address is required'),
      })
    )
    .query(async ({ input }) => {
      // Mock data for now - replace with real calculation later
      return {
        rank: Math.floor(Math.random() * 1000) + 1,
        totalUsers: 5000,
        totalPoints: Math.floor(Math.random() * 15000),
      }
    }),

  getLeaderboard: procedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(5), // Default to 5 as requested
        offset: z.number().min(0).default(0),
        period: z.enum(['weekly', 'all']).default('all'),
      })
    )
    .query(async ({ input }) => {
      // Mock data for now - replace with real leaderboard later
      const mockData = Array.from({ length: input.limit }, (_, index) => ({
        rank: input.offset + index + 1,
        userAddress: `H${Math.random().toString(36).substring(2, 34).padStart(33, '0')}`,
        totalPoints: Math.floor(Math.random() * 50000) + 1000,
        volumePoints: Math.floor(Math.random() * 30000) + 500,
        liquidityPoints: Math.floor(Math.random() * 15000) + 200,
        multiplier: 1.0,
        updatedAt: new Date(),
      }))

      // Sort by points (highest first)
      mockData.sort((a, b) => b.totalPoints - a.totalPoints)

      return {
        leaderboard: mockData,
        hasMore: input.offset + input.limit < 1000, // Mock pagination
        total: 1000,
        period: input.period,
      }
    }),

  // Get campaign statistics
  getCampaignStats: procedure.query(async ({ ctx }) => {
    try {
      const totalEnrollments = await ctx.prisma.campaignEnrollment.count({
        where: { isActive: true },
      })

      const recentEnrollments = await ctx.prisma.campaignEnrollment.count({
        where: {
          isActive: true,
          enrolledAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      })

      return {
        totalEnrollments,
        recentEnrollments,
        campaignStartDate: new Date('2024-01-01'), // Mock start date
        isActive: true,
      }
    } catch (error) {
      console.error('Error fetching campaign statistics:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch campaign statistics',
      })
    }
  }),
})