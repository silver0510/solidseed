import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  UserDealPreferences,
  CreatePreferencesInput,
  UpdatePreferencesInput,
} from '@/lib/types/deal-settings';

/**
 * Create Supabase admin client with service role key
 * This bypasses RLS policies - only use on server side
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

/**
 * UserPreferencesService handles user deal type preferences
 *
 * Features:
 * - Get user's deal type preferences
 * - Create default preferences for new users
 * - Update preferences (with validation)
 * - Mark onboarding as completed
 *
 * Business Rules:
 * - At least one deal type must be enabled (enforced by DB constraint)
 * - One preference record per user (unique constraint)
 */
export class UserPreferencesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Get user's deal type preferences
   *
   * @param userId - The user's ID
   * @returns Promise<UserDealPreferences | null> The user's preferences or null if not found
   */
  async getUserPreferences(userId: string): Promise<UserDealPreferences | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('user_deal_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If preferences don't exist yet, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Create default preferences for a new user
   * Both deal types enabled by default, onboarding not completed
   *
   * @param userId - The user's ID
   * @returns Promise<UserDealPreferences> The created preferences
   */
  async createDefaultPreferences(userId: string): Promise<UserDealPreferences> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('user_deal_preferences')
      .insert({
        user_id: userId,
        residential_sale_enabled: true,
        mortgage_loan_enabled: true,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create default preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user's deal type preferences
   *
   * @param userId - The user's ID
   * @param updates - The fields to update
   * @returns Promise<UserDealPreferences> The updated preferences
   * @throws {Error} If trying to disable both deal types (DB constraint will catch)
   */
  async updatePreferences(
    userId: string,
    updates: UpdatePreferencesInput
  ): Promise<UserDealPreferences> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Client-side validation: at least one deal type must be enabled
    if (
      updates.residential_sale_enabled === false &&
      updates.mortgage_loan_enabled === false
    ) {
      throw new Error('At least one deal type must be enabled');
    }

    const { data, error } = await this.supabase
      .from('user_deal_preferences')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark onboarding as completed for a user
   *
   * @param userId - The user's ID
   * @returns Promise<UserDealPreferences> The updated preferences
   */
  async completeOnboarding(userId: string): Promise<UserDealPreferences> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('user_deal_preferences')
      .update({ onboarding_completed: true })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }

    return data;
  }

  /**
   * Get or create preferences for a user
   * Useful for ensuring preferences exist before updating
   *
   * @param userId - The user's ID
   * @returns Promise<UserDealPreferences> The user's preferences (existing or newly created)
   */
  async getOrCreatePreferences(userId: string): Promise<UserDealPreferences> {
    const existing = await this.getUserPreferences(userId);
    if (existing) {
      return existing;
    }
    return await this.createDefaultPreferences(userId);
  }
}
