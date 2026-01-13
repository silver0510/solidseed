import { createClient } from '@supabase/supabase-js';
import { createId } from '@paralleldrive/cuid2';
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ListClientsParams,
  PaginatedClients
} from '@/lib/types/client';

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * ClientService handles all client-related database operations
 *
 * Features:
 * - CRUD operations for client records
 * - Cursor-based pagination for efficient list queries
 * - Full-text search across client fields
 * - Tag-based filtering
 * - Soft delete with RLS policy enforcement
 *
 * Uses Supabase for data persistence with Row Level Security (RLS) policies
 * ensuring users can only access their own clients.
 *
 * @example
 * ```typescript
 * const clientService = new ClientService();
 *
 * // Create a new client
 * const client = await clientService.createClient({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 *
 * // List clients with pagination
 * const result = await clientService.listClients({ limit: 20 });
 * ```
 */
export class ClientService {
  private supabase = supabase;

  /**
   * Initialize ClientService
   *
   * @throws {Error} If Supabase credentials are not configured
   */
  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not configured. Please check your environment variables.');
    }
  }

  /**
   * Create a new client
   *
   * @param data - Client data to create
   * @returns Promise<Client> The created client record
   * @throws {Error} If user is not authenticated
   * @throws {Error} If email or phone already exists
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const client = await clientService.createClient({
   *   name: "John Doe",
   *   email: "john@example.com",
   *   phone: "+1-555-123-4567"
   * });
   * ```
   */
  async createClient(data: CreateClientInput): Promise<Client> {
    // Generate CUID for new client
    const id = createId();

    // Get authenticated user from Supabase auth
    const { data: userData, error: authError } = await this.supabase.auth.getUser();

    if (authError || !userData.user) {
      throw new Error('Not authenticated');
    }

    // Insert client into database
    const { data: client, error } = await this.supabase
      .from('clients')
      .insert({
        id,
        ...data,
        created_by: userData.user.id,
        assigned_to: userData.user.id,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate email/phone)
      if (error.code === '23505') {
        throw new Error('Email or phone already exists');
      }
      throw new Error(error.message);
    }

    return client;
  }
}
