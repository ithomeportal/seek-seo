import { UTApi, UTFile } from 'uploadthing/server'

/**
 * Uploads a server-generated PDF (e.g. a signed ACH authorization or lease
 * agreement) to UploadThing and returns its public URL. Used to persist the
 * onboarding signed PDFs so the admin Onboarding tab can link to them — the
 * full document is generated once at submission and only ever stored here +
 * emailed. Best-effort: returns null on any failure so the caller can proceed
 * (the authorization/signature is already recorded in the DB).
 */
export async function uploadGeneratedPdf(
  filename: string,
  bytes: Uint8Array
): Promise<string | null> {
  if (!process.env.UPLOADTHING_TOKEN) return null
  try {
    const utapi = new UTApi()
    // Copy into a fresh ArrayBuffer-backed view so it satisfies BlobPart
    // (pdf-lib returns Uint8Array<ArrayBufferLike>).
    const file = new UTFile([new Uint8Array(bytes)], filename, {
      type: 'application/pdf',
    })
    const result = await utapi.uploadFiles(file)
    if (result.error || !result.data) return null
    return result.data.ufsUrl ?? result.data.url ?? null
  } catch {
    return null
  }
}
