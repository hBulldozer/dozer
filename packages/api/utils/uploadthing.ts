import { createUploadthing, type FileRouter } from 'uploadthing/next-legacy'
import { generateUploadButton, generateUploadDropzone } from '@uploadthing/react'

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    'image/jpeg': { contentDisposition: 'inline', maxFileSize: '2MB', maxFileCount: 1 },
    'image/png': { maxFileSize: '2MB', maxFileCount: 1 },
    'image/gif': { maxFileSize: '2MB', maxFileCount: 1 },
    'image/bmp': { maxFileSize: '2MB', maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      // This code runs on your server before upload

      return { userId: 'fakeId' } // Add any data you want to access in onUploadComplete
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId)
      console.log('file url', file.url)

      // Return any data you want to be available on the client
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()
