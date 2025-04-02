import { z } from 'zod'
import { createTRPCRouter, procedure } from '../trpc'

export const presaleRouter = createTRPCRouter({
  // Submit a presale transaction proof
  submitPresaleProof: procedure
    .input(
      z.object({
        network: z.enum(['solana', 'evm']),
        transactionProof: z.string().min(1, 'Transaction proof is required'),
        contactInfo: z.string().min(1, 'Contact information is required'),
        hathorAddress: z.string().min(1, 'Hathor address is required'),
        price: z.number().default(1.0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Create a new presale submission in the database
        const submission = await ctx.prisma.$transaction(async (prisma) => {
          // Use $executeRaw for a custom SQL insert if needed for new models
          // that might not be in the Prisma client yet
          const result = await prisma.$executeRaw`
            INSERT INTO "PresaleSubmission" 
            ("network", "transactionProof", "contactInfo", "hathorAddress", "price", "submittedAt", "processed") 
            VALUES 
            (${input.network}, ${input.transactionProof}, ${input.contactInfo}, ${input.hathorAddress}, ${
            input.price
          }, ${new Date()}, false)
            RETURNING "id"
          `

          return { id: result }
        })

        return {
          success: true,
          message: 'Thank you for your submission! We will process your DZD tokens soon.',
          submissionId: submission.id,
        }
      } catch (error) {
        console.error('Error submitting presale proof:', error)
        throw new Error('Failed to submit your presale information. Please try again.')
      }
    }),

  // Get all presale submissions (for admin purposes)
  getAllSubmissions: procedure.query(async ({ ctx }) => {
    // Use raw query until Prisma client is regenerated
    return ctx.prisma.$queryRaw`
      SELECT * FROM "PresaleSubmission"
      ORDER BY "submittedAt" DESC
    `
  }),

  // Mark a submission as processed (for admin purposes)
  markAsProcessed: procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$executeRaw`
        UPDATE "PresaleSubmission"
        SET "processed" = true
        WHERE "id" = ${input.id}
      `
    }),
})
