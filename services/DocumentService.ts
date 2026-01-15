/**
 * DocumentService handles all client document-related operations
 *
 * Features:
 * - Upload documents to Supabase Storage
 * - Create database records for documents
 * - Generate signed download URLs
 * - Delete documents from storage and database
 * - List documents for a client
 * - Rollback storage upload on database error
 *
 * Uses Supabase for storage and PostgreSQL with Row Level Security (RLS)
 * policies ensuring users can only access documents for their own clients.
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { ClientDocument } from '@/lib/types/client';

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** Storage bucket name for client documents */
const STORAGE_BUCKET = 'client-documents';

/** Default signed URL expiration time in seconds (1 hour) */
const DEFAULT_URL_EXPIRY = 3600;

export class DocumentService {
  private supabase = supabase;

  /**
   * Initialize DocumentService
   *
   * @throws {Error} If Supabase credentials are not configured
   */
  constructor() {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error(
        'Supabase credentials not configured. Please check your environment variables.'
      );
    }
  }

  /**
   * Upload a document to Supabase Storage and create database record
   *
   * File path structure: {clientId}/{documentId}/{filename}
   * This structure matches the RLS policies defined in the storage bucket.
   *
   * @param clientId - The client ID to attach the document to
   * @param file - The file to upload
   * @param description - Optional document description
   * @returns Promise<ClientDocument> The created document record
   * @throws {Error} If user is not authenticated
   * @throws {Error} If storage upload fails
   * @throws {Error} If database operation fails (with rollback)
   *
   * @example
   * ```typescript
   * const doc = await documentService.uploadDocument(
   *   'client_123',
   *   file,
   *   'Contract for property viewing'
   * );
   * ```
   */
  async uploadDocument(
    clientId: string,
    file: File,
    description?: string
  ): Promise<ClientDocument> {
    // Get authenticated user
    const { data: userData, error: authError } =
      await this.supabase.auth.getUser();

    if (authError || !userData.user) {
      throw new Error('Not authenticated');
    }

    // Generate unique document ID (UUID)
    const documentId = randomUUID();

    // Construct storage path: {clientId}/{documentId}/{filename}
    const filePath = `${clientId}/${documentId}/${file.name}`;

    // Upload file to storage
    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Create database record
    const { data: document, error: dbError } = await this.supabase
      .from('client_documents')
      .insert({
        id: documentId,
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        description: description || null,
        uploaded_by: userData.user.id,
      })
      .select()
      .single();

    // Rollback storage upload if database insert fails
    if (dbError) {
      await this.supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw new Error(dbError.message);
    }

    return document;
  }

  /**
   * Generate a signed URL for document download
   *
   * @param filePath - The storage path of the document
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise<string> The signed download URL
   * @throws {Error} If URL generation fails
   *
   * @example
   * ```typescript
   * const url = await documentService.getDownloadUrl(
   *   'client_123/doc_456/contract.pdf',
   *   3600 // 1 hour
   * );
   * ```
   */
  async getDownloadUrl(
    filePath: string,
    expiresIn: number = DEFAULT_URL_EXPIRY
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(error.message);
    }

    return data.signedUrl;
  }

  /**
   * Delete a document from storage and database
   *
   * @param documentId - The document ID to delete
   * @param filePath - The storage path of the document
   * @returns Promise<void>
   * @throws {Error} If storage or database deletion fails
   *
   * @example
   * ```typescript
   * await documentService.deleteDocument(
   *   'doc_456',
   *   'client_123/doc_456/contract.pdf'
   * );
   * ```
   */
  async deleteDocument(documentId: string, filePath: string): Promise<void> {
    // Delete from storage first
    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (storageError) {
      throw new Error(storageError.message);
    }

    // Delete database record
    const { error: dbError } = await this.supabase
      .from('client_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(dbError.message);
    }
  }

  /**
   * Get all documents for a client
   *
   * Returns documents ordered by uploaded_at descending (newest first).
   *
   * @param clientId - The client ID to get documents for
   * @returns Promise<ClientDocument[]> Array of documents
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const documents = await documentService.getDocumentsByClient('client_123');
   * ```
   */
  async getDocumentsByClient(clientId: string): Promise<ClientDocument[]> {
    const { data, error } = await this.supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  /**
   * Get a single document by ID
   *
   * @param clientId - The client ID the document belongs to
   * @param documentId - The document ID to retrieve
   * @returns Promise<ClientDocument | null> The document or null if not found
   * @throws {Error} If database operation fails (except not found)
   *
   * @example
   * ```typescript
   * const document = await documentService.getDocumentById('client_123', 'doc_456');
   * ```
   */
  async getDocumentById(
    clientId: string,
    documentId: string
  ): Promise<ClientDocument | null> {
    const { data, error } = await this.supabase
      .from('client_documents')
      .select('*')
      .eq('id', documentId)
      .eq('client_id', clientId)
      .single();

    // Handle not found case
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }
}
