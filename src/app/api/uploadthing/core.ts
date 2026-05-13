import { createUploadthing, type FileRouter } from 'uploadthing/next'

const f = createUploadthing()

export const ourFileRouter = {
  unitDocuments: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 5 },
    blob: { maxFileSize: '16MB', maxFileCount: 5 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl, name: file.name, size: file.size }
    }),
  customerDriversLicense: f({
    image: { maxFileSize: '8MB', maxFileCount: 1 },
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl, name: file.name, size: file.size }
    }),
  customerVoidedCheck: f({
    image: { maxFileSize: '8MB', maxFileCount: 1 },
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(() => {
      return {}
    })
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl, name: file.name, size: file.size }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
