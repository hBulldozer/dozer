import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, procedure } from '../trpc'

// URL validation regex
const urlRegex = /^(https?):\/\/[^\s$.?#].[^\s]*$/i

export const presaleRouter = createTRPCRouter({
  // Get backers count from Hathor explorer
  getBackersCount: procedure.query(async () => {
    try {
      // Fetch backers count from Hathor explorer
      const response = await fetch(
        'https://explorer-service.mainnet.hathor.network/token_balances/information?token_id=0000018dc292fddc2ff6232c5802eaf8f1d2d89e357c512fcf1aaeddce4ed96d'
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch backers count: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return {
        success: true,
        backersCount: data.addresses || 250, // Default fallback value
      }
    } catch (error) {
      console.error('Error fetching backers count:', error)
      // Return a default value with an error flag if the request fails
      return {
        success: false,
        backersCount: 250, // Default fallback value
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }),
  // Update contact information for an existing submission
  updateContactInfo: procedure
    .input(
      z.object({
        transactionProof: z.string().min(1, 'Transaction proof is required to identify your submission'),
        contactInfo: z.string().min(1, 'Contact information is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Update the contact info for only the most recent submission with matching transaction proof
        const result = await ctx.prisma.$executeRaw`
          UPDATE "PresaleSubmission"
          SET "contactInfo" = ${input.contactInfo}
          WHERE "id" = (
            SELECT "id" FROM "PresaleSubmission"
            WHERE "transactionProof" = ${input.transactionProof}
            ORDER BY "submittedAt" DESC
            LIMIT 1
          )
          RETURNING "id"
        `

        // Check if any records were updated
        if (!result || result < 1) {
          throw new Error('No submission found with the provided transaction proof')
        }

        return {
          success: true,
          message: 'Contact information updated successfully!',
        }
      } catch (error) {
        console.error('Error updating contact information:', error)
        throw new Error('Failed to update contact information. Please try again.')
      }
    }),
  // Submit a presale transaction proof
  submitPresaleProof: procedure
    .input(
      z.object({
        network: z.enum(['solana', 'evm']),
        transactionProof: z
          .string()
          .min(1, 'Transaction proof is required')
          .refine((val) => urlRegex.test(val), {
            message: 'Transaction proof must be a valid URL',
          }),
        contactInfo: z.string().min(1, 'Contact information is required'),
        hathorAddress: z
          .string()
          .min(1, 'Hathor address is required')
          .refine((val) => val.length === 34, {
            message: 'Hathor address must be exactly 34 characters long',
          })
          .refine((val) => val.startsWith('H'), {
            message: "Hathor address must start with 'H'",
          }),
        price: z.number().default(1.0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if this transaction URL already exists in the database
        const existingSubmission = await ctx.prisma.$queryRaw`
          SELECT "id", "hathorExplorerUrl" FROM "PresaleSubmission"
          WHERE "transactionProof" = ${input.transactionProof}
          LIMIT 1
        `

        // If the transaction already exists, inform the user
        if (existingSubmission && Array.isArray(existingSubmission) && existingSubmission.length > 0) {
          const submission = existingSubmission[0]

          // Check if it has been processed
          if (submission.hathorExplorerUrl) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `This transaction has already been processed.`,
              // Custom field for explorer URL
              cause: { type: 'PROCESSED', hathorExplorerUrl: submission.hathorExplorerUrl },
            })
          } else {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This transaction is already being processed. Please be patient.',
              cause: { type: 'PROCESSING' },
            })
          }
        }

        // Create a new presale submission in the database
        const submission = await ctx.prisma.$transaction(async (prisma) => {
          // Use $executeRaw for a custom SQL insert
          const result = await prisma.$executeRaw`
            INSERT INTO "PresaleSubmission" 
            ("network", "transactionProof", "contactInfo", "hathorAddress", "price", "submittedAt", "hathorExplorerUrl") 
            VALUES 
            (${input.network}, ${input.transactionProof}, ${input.contactInfo}, ${input.hathorAddress}, ${
            input.price
          }, ${new Date()}, NULL)
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
        // Handle custom TRPCError type
        if (error instanceof TRPCError) {
          throw error
        }

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

  // Mark a submission as processed (for admin purposes) by setting the hathorExplorerUrl
  markAsProcessed: procedure
    .input(
      z.object({
        id: z.number(),
        hathorExplorerUrl: z
          .string()
          .min(1, 'Hathor Explorer URL is required')
          .refine((val) => urlRegex.test(val), {
            message: 'Must be a valid URL',
          }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$executeRaw`
        UPDATE "PresaleSubmission"
        SET "hathorExplorerUrl" = ${input.hathorExplorerUrl}
        WHERE "id" = ${input.id}
      `
    }),
})
