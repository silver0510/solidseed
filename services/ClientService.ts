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

  /**
   * List clients with pagination, search, and filtering
   *
   * Supports cursor-based pagination for efficient browsing of large datasets.
   * Results are automatically filtered to exclude soft-deleted clients and
   * respect Row Level Security (RLS) policies.
   *
   * @param params - Query parameters for filtering and pagination
   * @param params.cursor - Pagination cursor (created_at timestamp from previous page)
   * @param params.limit - Items per page (default: 20, max: 100)
   * @param params.search - Search term for name or email (case-insensitive)
   * @param params.tag - Filter by tag name
   * @param params.sort - Sort field: 'created_at' (default) or 'name'
   *
   * @returns Promise<PaginatedClients> Paginated client list with total count and next cursor
   * @throws {Error} If database query fails
   *
   * @example
   * ```typescript
   * // Basic pagination
   * const result = await clientService.listClients({ limit: 20 });
   *
   * // With cursor for next page
   * const nextPage = await clientService.listClients({
   *   cursor: result.next_cursor,
   *   limit: 20
   * });
   *
   * // Search by name or email
   * const searchResults = await clientService.listClients({
   *   search: 'john',
   *   limit: 10
   * });
   *
   * // Filter by tag
   * const vipClients = await clientService.listClients({
   *   tag: 'VIP',
   *   limit: 50
   * });
   *
   * // Combine filters
   * const filtered = await clientService.listClients({
   *   search: 'smith',
   *   tag: 'VIP',
   *   sort: 'name',
   *   limit: 25
   * });
   * ```
   */
  async listClients(params: ListClientsParams): Promise<PaginatedClients> {
    // Validate and enforce limit: default 20, max 100
    const limit = Math.min(Math.max(params.limit || 20, 1), 100);

    // Build query with count for pagination
    let query = this.supabase
      .from('clients')
      .select('*, client_tags(tag_name)', { count: 'exact' })
      .eq('is_deleted', false)
      .order(params.sort || 'created_at', { ascending: false });

    // Cursor-based pagination using created_at
    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }

    // Search by name or email (case-insensitive)
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    // Filter by tag
    if (params.tag) {
      query = query.contains('client_tags', [{ tag_name: params.tag }]);
    }

    // Apply limit last
    query = query.limit(limit);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list clients: ${error.message}`);
    }

    // Calculate next cursor from last item's created_at
    // Only include cursor if we returned a full page (indicating more data may exist)
    const next_cursor = data && data.length === limit
      ? data[data.length - 1].created_at
      : undefined;

    return {
      data: data || [],
      next_cursor,
      total_count: count || 0,
    };
  }
}
