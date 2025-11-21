import { Client } from '@replit/object-storage';

let client: Client | null = null;

try {
  client = new Client();
  console.log('✅ Replit App Storage initialized');
} catch (error) {
  console.warn('⚠️ Replit App Storage not available, falling back to other storage');
  client = null;
}

export async function uploadToReplitStorage(
  filePath: string,
  file: File | Buffer
): Promise<{ success: boolean; url: string | null; error?: string }> {
  if (!client) {
    return { success: false, url: null, error: 'Replit storage not available' };
  }

  try {
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    const { ok, error } = await client.uploadFromBytes(filePath, new Uint8Array(buffer));
    
    if (!ok) {
      return { success: false, url: null, error: `Upload failed: ${error}` };
    }

    const url = `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/api/replit-storage/${filePath}`;
    return { success: true, url };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Replit storage upload error:', errorMsg);
    return { success: false, url: null, error: errorMsg };
  }
}

export async function downloadFromReplitStorage(
  filePath: string
): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
  if (!client) {
    return { success: false, error: 'Replit storage not available' };
  }

  try {
    const data = await client.download(filePath);
    return { success: true, data };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

export async function deleteFromReplitStorage(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'Replit storage not available' };
  }

  try {
    await client.delete(filePath);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

export function isReplitStorageAvailable(): boolean {
  return client !== null;
}
