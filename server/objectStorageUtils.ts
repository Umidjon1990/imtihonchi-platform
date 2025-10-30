import { Client } from '@replit/object-storage';

// Initialize Replit Object Storage client
const client = new Client();

/**
 * Upload file to Replit Object Storage
 * @param key - File path/key
 * @param body - File content (Buffer or Uint8Array)
 * @param contentType - MIME type (optional)
 * @returns File key
 */
export async function uploadToObjectStorage(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
): Promise<string> {
  try {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    await client.uploadFromBytes(key, buffer);
    return key;
  } catch (error) {
    console.error('Object storage upload error:', error);
    throw new Error('Failed to upload file to object storage');
  }
}

/**
 * Get URL for accessing a file
 * For public files: uses PUBLIC_OBJECT_SEARCH_PATHS
 * For private files: returns the key (backend will serve it)
 * @param key - File path/key
 * @returns Public URL or key
 */
export async function getObjectStorageUrl(key: string): Promise<string> {
  // If file is in public directory, return public URL
  if (key.startsWith('public/')) {
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',') || [];
    if (publicPaths.includes('public')) {
      return `/api/object-storage/${key}`;
    }
  }
  
  // For private files, return API endpoint
  return `/api/object-storage/${key}`;
}

/**
 * Download file from Replit Object Storage as Buffer
 * @param key - File path/key
 * @returns File content as Buffer
 */
export async function downloadFromObjectStorage(key: string): Promise<Buffer> {
  try {
    const bytes = await client.downloadAsBytes(key);
    // bytes is already a Buffer/Uint8Array from the client
    return Buffer.isBuffer(bytes) ? bytes : Buffer.from(new Uint8Array(bytes));
  } catch (error) {
    console.error('Object storage download error:', error);
    throw new Error('Failed to download file from object storage');
  }
}

/**
 * Delete file from Replit Object Storage
 * @param key - File path/key
 */
export async function deleteFromObjectStorage(key: string): Promise<void> {
  try {
    await client.delete(key);
  } catch (error) {
    console.error('Object storage delete error:', error);
    throw new Error('Failed to delete file from object storage');
  }
}

/**
 * Generate unique filename
 * @param originalName - Original filename
 * @param prefix - Optional prefix
 * @returns Generated filename
 */
export function generateFilename(originalName: string, prefix = ''): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${prefix}${timestamp}-${random}.${extension}`;
}

/**
 * Get file path for different types
 * @param type - File type (audio, receipt, certificate, image)
 * @param filename - Filename
 * @returns Full file path
 */
export function getFilePath(type: 'audio' | 'receipt' | 'certificate' | 'image', filename: string): string {
  const privateDir = process.env.PRIVATE_OBJECT_DIR || '.private';
  
  const paths = {
    audio: `${privateDir}/audio`,
    receipt: `${privateDir}/receipts`,
    certificate: `${privateDir}/certificates`,
    image: 'public/images',
  };

  return `${paths[type]}/${filename}`;
}
