import { supabase } from '@/lib/db';

export interface UploadFileOptions {
  userId: string;
  file: File;
  folder?: string;
}

export interface UploadFileResult {
  path: string;
  url: string;
}

export class StorageService {
  private static BUCKET = 'client-documents';

  /**
   * Upload a file to Supabase Storage
   * Files are organized by user ID: {userId}/{folder}/{filename}
   */
  static async uploadFile({
    userId,
    file,
    folder = 'documents',
  }: UploadFileOptions): Promise<UploadFileResult> {
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage.from(this.BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL (will require signed URL for private buckets)
    const {
      data: { publicUrl },
    } = supabase.storage.from(this.BUCKET).getPublicUrl(data.path);

    return {
      path: data.path,
      url: publicUrl,
    };
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage.from(this.BUCKET).remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for private file access
   * @param filePath - Path to the file in storage
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  static async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * List all files for a user in a specific folder
   */
  static async listFiles(userId: string, folder?: string): Promise<string[]> {
    const path = folder ? `${userId}/${folder}` : userId;

    const { data, error } = await supabase.storage.from(this.BUCKET).list(path);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data.map((file) => file.name);
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(filePath: string) {
    const { data, error } = await supabase.storage.from(this.BUCKET).list(filePath);

    if (error) {
      throw new Error(`Failed to get metadata: ${error.message}`);
    }

    return data;
  }
}
