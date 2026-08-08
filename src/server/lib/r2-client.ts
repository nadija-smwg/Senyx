import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'senyx-erp-documents';

// Initialize S3 client pointing to Cloudflare R2
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generates a storage key for a file.
 * Format: {ownerType}/{ownerId}/{uuid}-{sanitizedFileName}
 */
export function generateStorageKey(ownerType: string, ownerId: string, fileName: string): string {
  const uuid = crypto.randomUUID();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${ownerType}/${ownerId}/${uuid}-${sanitizedName}`;
}

/**
 * Uploads a file to R2 bucket.
 */
export async function uploadDocumentToR2(fileBuffer: Buffer, key: string, mimeType: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  await r2Client.send(command);
}

/**
 * Gets a presigned URL to download a file from R2. Defaults to 1 hour expiry.
 */
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Deletes a file from R2 bucket.
 */
export async function deleteDocumentFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}
