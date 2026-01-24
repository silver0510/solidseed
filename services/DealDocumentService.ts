/**
 * DealDocumentService handles all deal document-related operations
 *
 * Features:
 * - Upload documents to Supabase Storage (deal-documents bucket)
 * - Create database records for documents
 * - Generate signed download URLs (1 hour expiry)
 * - Delete documents from storage and database
 * - List documents for a deal
 * - Rollback storage upload on database error
 * - Activity logging for upload/delete operations
 *
 * Uses Supabase with service role key for server-side operations.
 * Authorization is handled in API routes via Better Auth session validation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { DealDocument, DocumentType } from '@/lib/types/deals';

/** Storage bucket name for deal documents */
const STORAGE_BUCKET = 'deal-documents';

/** Default signed URL expiration time in seconds (1 hour) */
const DEFAULT_URL_EXPIRY = 3600;

/** Maximum file size: 25MB in bytes */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Allowed MIME types for document uploads */
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Create Supabase admin client with service role key
 */
function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export class DealDocumentService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Upload a document to Supabase Storage and create database record
   *
   * @param dealId - The deal ID
   * @param file - File to upload
   * @param documentType - Type of document (contract, disclosure, etc.)
   * @param userId - The authenticated user's ID
   * @param description - Optional document description
   * @returns Promise<DealDocument> The created document record
   * @throws {Error} If validation fails or upload fails
   */
  async uploadDealDocument(
    dealId: string,
    file: File,
    documentType: DocumentType,
    userId: string,
    description?: string
  ): Promise<DealDocument> {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 25MB limit');
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('File type not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX');
    }

    // Verify the deal belongs to this user
    const { data: deal, error: dealError } = await this.supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found or access denied');
    }

    // Generate unique file ID
    const fileId = randomUUID();

    // Construct storage path: deals/{dealId}/documents/{fileId}_{filename}
    const filePath = `deals/${dealId}/documents/${fileId}_${file.name}`;

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to storage
    const { error: uploadError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Create database record
    const { data: document, error: dbError } = await this.supabase
      .from('deal_documents')
      .insert({
        deal_id: dealId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        description: description || null,
        uploaded_by: userId,
      })
      .select()
      .single();

    // Rollback storage upload if database insert fails
    if (dbError) {
      await this.supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    // Log activity
    await this.logActivity(
      dealId,
      'document_upload',
      `Uploaded: ${file.name}`,
      userId
    );

    return document as DealDocument;
  }

  /**
   * Get all documents for a deal
   *
   * @param dealId - The deal ID
   * @param userId - The authenticated user's ID
   * @returns Promise<DealDocument[]> Array of documents
   * @throws {Error} If deal not found or access denied
   */
  async getDealDocuments(dealId: string, userId: string): Promise<DealDocument[]> {
    // Verify the deal belongs to this user
    const { data: deal, error: dealError } = await this.supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found or access denied');
    }

    const { data, error } = await this.supabase
      .from('deal_documents')
      .select('*')
      .eq('deal_id', dealId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate a signed URL for document download
   *
   * @param filePath - The file path in storage
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Promise<string> The signed download URL
   * @throws {Error} If URL generation fails
   */
  async getDocumentDownloadUrl(
    filePath: string,
    expiresIn: number = DEFAULT_URL_EXPIRY
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a document from storage and database
   *
   * @param dealId - The deal ID
   * @param documentId - The document ID
   * @param userId - The authenticated user's ID
   * @returns Promise<void>
   * @throws {Error} If document not found or deletion fails
   */
  async deleteDealDocument(
    dealId: string,
    documentId: string,
    userId: string
  ): Promise<void> {
    // Verify the deal belongs to this user
    const { data: deal, error: dealError } = await this.supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found or access denied');
    }

    // Get the document to find the file path and name
    const { data: doc, error: docError } = await this.supabase
      .from('deal_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .eq('deal_id', dealId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found');
    }

    // Delete from storage first
    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .remove([doc.file_path]);

    if (storageError) {
      throw new Error(`Failed to delete from storage: ${storageError.message}`);
    }

    // Delete database record
    const { error: dbError } = await this.supabase
      .from('deal_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Failed to delete from database: ${dbError.message}`);
    }

    // Log activity
    await this.logActivity(
      dealId,
      'document_delete',
      `Deleted: ${doc.file_name}`,
      userId
    );
  }

  /**
   * Get a single document by ID
   *
   * @param dealId - The deal ID
   * @param documentId - The document ID
   * @param userId - The authenticated user's ID
   * @returns Promise<DealDocument | null> The document or null if not found
   * @throws {Error} If access denied or query fails
   */
  async getDocumentById(
    dealId: string,
    documentId: string,
    userId: string
  ): Promise<DealDocument | null> {
    // Verify the deal belongs to this user
    const { data: deal, error: dealError } = await this.supabase
      .from('deals')
      .select('id')
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found or access denied');
    }

    const { data, error } = await this.supabase
      .from('deal_documents')
      .select('*')
      .eq('id', documentId)
      .eq('deal_id', dealId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return data as DealDocument;
  }

  /**
   * Log activity to deal_activities table
   * Fire-and-forget style - errors are logged but don't fail the operation
   */
  private async logActivity(
    dealId: string,
    activityType: 'document_upload' | 'document_delete',
    title: string,
    userId: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          activity_type: activityType,
          title,
          description: null,
          created_by: userId,
        });
    } catch (error) {
      // Log error but don't throw - activity logging should not block main operations
      console.error('Failed to log deal activity:', error);
    }
  }
}
