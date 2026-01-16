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
 * Uses Supabase with service role key for server-side operations.
 * Authorization is handled in API routes via Better Auth session validation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { ClientDocument } from '@/lib/types/client';

/** Storage bucket name for client documents */
const STORAGE_BUCKET = 'client-documents';

/** Default signed URL expiration time in seconds (1 hour) */
const DEFAULT_URL_EXPIRY = 3600;

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

export class DocumentService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Upload a document to Supabase Storage and create database record
   */
  async uploadDocument(
    clientId: string,
    file: File,
    userId: string,
    description?: string
  ): Promise<ClientDocument> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

    // Generate unique document ID (UUID)
    const documentId = randomUUID();

    // Construct storage path: {clientId}/{documentId}/{filename}
    const filePath = `${clientId}/${documentId}/${file.name}`;

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
        uploaded_by: userId,
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
   */
  async deleteDocument(
    clientId: string,
    documentId: string,
    userId: string
  ): Promise<void> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

    // Get the document to find the file path
    const { data: doc, error: docError } = await this.supabase
      .from('client_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('client_id', clientId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found');
    }

    // Delete from storage first
    const { error: storageError } = await this.supabase.storage
      .from(STORAGE_BUCKET)
      .remove([doc.file_path]);

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
   */
  async getDocumentsByClient(clientId: string, userId: string): Promise<ClientDocument[]> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

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
   */
  async getDocumentById(
    clientId: string,
    documentId: string,
    userId: string
  ): Promise<ClientDocument | null> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

    const { data, error } = await this.supabase
      .from('client_documents')
      .select('*')
      .eq('id', documentId)
      .eq('client_id', clientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }
}
