import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'imtihonchi-files';
const PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optional custom domain

/**
 * Upload file to R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Return public URL if custom domain configured, otherwise return key
    if (PUBLIC_URL) {
      return `${PUBLIC_URL}/${key}`;
    }

    return key;
  } catch (error) {
    console.error('R2 upload error:', error);
    throw new Error('Failed to upload file to R2');
  }
}

/**
 * Get signed URL for private file (valid for 1 hour)
 */
export async function getR2SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('R2 signed URL error:', error);
    throw new Error('Failed to generate signed URL');
  }
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error('R2 delete error:', error);
    throw new Error('Failed to delete file from R2');
  }
}

/**
 * Generate unique filename
 */
export function generateFilename(originalName: string, prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${prefix}${timestamp}-${random}.${extension}`;
}

/**
 * Get file path for different types
 */
export function getFilePath(type: 'audio' | 'receipt' | 'certificate' | 'image', filename: string): string {
  const paths = {
    audio: 'private/audio',
    receipt: 'private/receipts',
    certificate: 'private/certificates',
    image: 'public/images',
  };

  return `${paths[type]}/${filename}`;
}
