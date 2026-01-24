import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Deal,
  DealType,
  DealMilestone,
  DealActivity,
  CreateDealInput,
  UpdateDealInput,
  ChangeDealStageInput,
  CreateActivityInput,
  PipelineResponse,
  GetPipelineParams,
  CommissionCalculation,
  ActivityType,
} from '@/lib/types/deals';

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
 * DealService handles all deal-related database operations
 *
 * Features:
 * - CRUD operations for deal records
 * - Pipeline view with stage grouping
 * - Commission calculations
 * - Stage changes with milestone auto-creation
 * - Activity logging
 * - Soft delete support
 *
 * @example
 * ```typescript
 * const dealService = new DealService();
 *
 * // Create a new deal
 * const deal = await dealService.createDeal({
 *   deal_type_id: "uuid",
 *   client_id: "uuid",
 *   deal_value: 450000,
 *   commission_rate: 3.0
 * }, userId);
 * ```
 */
export class DealService {
  private supabase: SupabaseClient;

  /**
   * Initialize DealService with admin Supabase client
   */
  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Get all active deal types
   *
   * @returns Promise<DealType[]> Array of active deal types
   * @throws {Error} If database query fails
   */
  async getDealTypes(): Promise<DealType[]> {
    const { data, error } = await this.supabase
      .from('deal_types')
      .select('*')
      .eq('is_active', true)
      .order('type_name');

    if (error) {
      throw new Error(`Failed to fetch deal types: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get pipeline deals grouped by stage
   *
   * @param params - Query parameters (deal_type_id, assigned_to, limit)
   * @param userId - The authenticated user's ID
   * @returns Promise<PipelineResponse> Deals grouped by stage with summary
   * @throws {Error} If database query fails
   */
  async getPipelineDeals(params: GetPipelineParams, userId: string): Promise<PipelineResponse> {
    const { deal_type_id, assigned_to = userId, limit = 20 } = params;

    // Build query
    let query = this.supabase
      .from('deals')
      .select(`
        *,
        deal_type:deal_types(*),
        client:clients(id, name, email)
      `)
      .eq('is_deleted', false)
      .eq('status', 'active')
      .eq('assigned_to', assigned_to);

    if (deal_type_id) {
      query = query.eq('deal_type_id', deal_type_id);
    }

    const { data: deals, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit * 10); // Fetch more to distribute across stages

    if (error) {
      throw new Error(`Failed to fetch pipeline deals: ${error.message}`);
    }

    if (!deals || deals.length === 0) {
      return {
        stages: [],
        summary: {
          total_pipeline_value: 0,
          expected_commission: 0,
          active_deals: 0,
        },
      };
    }

    // Get deal type for pipeline stages
    const dealType = deals[0].deal_type as DealType;
    const pipelineStages = dealType?.pipeline_stages || [];

    // Group deals by stage
    const stageMap = new Map<string, Deal[]>();
    pipelineStages.forEach(stage => {
      stageMap.set(stage.code, []);
    });

    (deals as Deal[]).forEach(deal => {
      const stageDeals = stageMap.get(deal.current_stage);
      if (stageDeals) {
        stageDeals.push(deal);
      }
    });

    // Build stage data
    const stages = pipelineStages.map(stage => {
      const stageDeals = stageMap.get(stage.code) || [];
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);

      return {
        code: stage.code,
        name: stage.name,
        deals: stageDeals.slice(0, limit),
        count: stageDeals.length,
        total_value: totalValue,
      };
    });

    // Calculate summary
    const allDeals = deals as Deal[];
    const totalPipelineValue = allDeals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);
    const expectedCommission = allDeals.reduce(
      (sum, deal) => sum + (deal.agent_commission || deal.commission_amount || 0),
      0
    );

    return {
      stages,
      summary: {
        total_pipeline_value: totalPipelineValue,
        expected_commission: expectedCommission,
        active_deals: allDeals.length,
      },
    };
  }

  /**
   * Create a new deal
   *
   * @param data - Deal data to create
   * @param userId - The authenticated user's ID
   * @returns Promise<Deal> The created deal
   * @throws {Error} If validation fails or database operation fails
   */
  async createDeal(data: CreateDealInput, userId: string): Promise<Deal> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Fetch deal type to get initial stage
    const dealType = await this.getDealType(data.deal_type_id);
    if (!dealType) {
      throw new Error('Invalid deal type ID');
    }

    const initialStage = dealType.pipeline_stages.find(s => s.order === 0)?.code || 'lead';

    // Auto-generate deal name if not provided
    let dealName = data.deal_name;
    if (!dealName) {
      const dealData = data.deal_data as any;
      const address = dealData.property_address;
      const loanAmount = dealData.loan_amount;

      if (address) {
        dealName = address.split(',')[0]; // Get first part of address
      } else if (loanAmount) {
        dealName = `$${loanAmount.toLocaleString()} Loan`;
      } else {
        dealName = 'New Deal';
      }
    }

    // Calculate commission amounts
    const commissionCalc = this.calculateCommission(
      data.deal_value || 0,
      data.commission_rate || 0,
      data.commission_split_percent
    );

    // Prepare deal data
    const dealData = {
      deal_name: dealName,
      deal_type_id: data.deal_type_id,
      client_id: data.client_id,
      secondary_client_ids: data.secondary_client_ids || [],
      current_stage: initialStage,
      status: 'active' as const,
      deal_value: data.deal_value || null,
      commission_rate: data.commission_rate || null,
      commission_amount: commissionCalc.commission_amount || null,
      commission_split_percent: data.commission_split_percent || null,
      agent_commission: commissionCalc.agent_commission || null,
      expected_close_date: data.expected_close_date || null,
      deal_data: data.deal_data,
      notes: data.notes || null,
      referral_source: data.referral_source || null,
      created_by: userId,
      assigned_to: userId,
      is_deleted: false,
    };

    // Insert deal
    const { data: deal, error } = await this.supabase
      .from('deals')
      .insert(dealData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deal: ${error.message}`);
    }

    // Log activity
    await this.logActivity(
      deal.id,
      'other',
      'Deal Created',
      `Created deal: ${deal.deal_name}`,
      userId
    );

    return deal as Deal;
  }

  /**
   * Get a single deal by ID
   *
   * @param dealId - The deal ID
   * @param userId - The authenticated user's ID
   * @returns Promise<Deal> The deal with relations
   * @throws {Error} If deal not found or not authorized
   */
  async getDeal(dealId: string, userId: string): Promise<Deal> {
    const { data: deal, error } = await this.supabase
      .from('deals')
      .select(`
        *,
        deal_type:deal_types(*),
        client:clients(id, name, email)
      `)
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (error || !deal) {
      throw new Error('Deal not found or access denied');
    }

    return deal as Deal;
  }

  /**
   * Get deals with optional filtering
   *
   * @param filters - Filter options (client_id, status, deal_type_id, limit)
   * @param userId - The authenticated user's ID
   * @returns Promise<Deal[]> Array of deals
   * @throws {Error} If query fails
   */
  async getDeals(
    filters: {
      client_id?: string;
      status?: string;
      deal_type_id?: string;
      limit?: number;
    },
    userId: string
  ): Promise<Deal[]> {
    let query = this.supabase
      .from('deals')
      .select(`
        *,
        deal_type:deal_types(*),
        client:clients(id, full_name, email, phone)
      `)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(Math.min(filters.limit || 20, 100));

    // Apply filters
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.deal_type_id) {
      query = query.eq('deal_type_id', filters.deal_type_id);
    }

    const { data: deals, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch deals: ${error.message}`);
    }

    return (deals || []) as Deal[];
  }

  /**
   * Update a deal
   *
   * @param dealId - The deal ID
   * @param data - Updated deal data
   * @param userId - The authenticated user's ID
   * @returns Promise<Deal> The updated deal
   * @throws {Error} If deal not found or update fails
   */
  async updateDeal(dealId: string, data: UpdateDealInput, userId: string): Promise<Deal> {
    // Verify ownership
    await this.getDeal(dealId, userId);

    // Recalculate commission if values changed
    let updateData = { ...data } as any;

    if (data.deal_value !== undefined || data.commission_rate !== undefined || data.commission_split_percent !== undefined) {
      // Get current deal for existing values
      const currentDeal = await this.getDeal(dealId, userId);
      const dealValue = data.deal_value ?? currentDeal.deal_value ?? 0;
      const commissionRate = data.commission_rate ?? currentDeal.commission_rate ?? 0;
      const commissionSplit = data.commission_split_percent ?? currentDeal.commission_split_percent;

      const commissionCalc = this.calculateCommission(dealValue, commissionRate, commissionSplit);
      updateData.commission_amount = commissionCalc.commission_amount;
      updateData.agent_commission = commissionCalc.agent_commission;
    }

    const { data: deal, error } = await this.supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deal: ${error.message}`);
    }

    // Log activity
    await this.logActivity(
      dealId,
      'field_update',
      'Deal Updated',
      `Updated deal fields`,
      userId
    );

    return deal as Deal;
  }

  /**
   * Change deal stage
   *
   * @param dealId - The deal ID
   * @param stageData - New stage and optional lost reason
   * @param userId - The authenticated user's ID
   * @returns Promise<{ deal: Deal; milestones_created: number }> Updated deal and milestone count
   * @throws {Error} If stage change fails
   */
  async changeDealStage(
    dealId: string,
    stageData: ChangeDealStageInput,
    userId: string
  ): Promise<{ deal: Deal; milestones_created: number }> {
    // Get current deal
    const deal = await this.getDeal(dealId, userId);
    const oldStage = deal.current_stage;
    const newStage = stageData.new_stage;

    // Validate stage exists in deal type
    const dealType = await this.getDealType(deal.deal_type_id);
    if (!dealType) {
      throw new Error('Deal type not found');
    }

    const validStages = dealType.pipeline_stages.map(s => s.code);
    if (!validStages.includes(newStage)) {
      throw new Error(`Invalid stage: ${newStage}`);
    }

    // Prepare update data
    const updates: any = {
      current_stage: newStage,
      updated_at: new Date().toISOString(),
    };

    // Handle terminal stages
    if (newStage === 'closed' || newStage === 'funded') {
      updates.status = 'closed_won';
      updates.closed_at = new Date().toISOString();
      if (!deal.actual_close_date) {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }
    } else if (newStage === 'lost') {
      if (!stageData.lost_reason || stageData.lost_reason.length < 10) {
        throw new Error('Lost reason required (minimum 10 characters)');
      }
      updates.status = 'closed_lost';
      updates.closed_at = new Date().toISOString();
      updates.lost_reason = stageData.lost_reason;
    }

    // Update deal
    const { data: updatedDeal, error } = await this.supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId)
      .eq('assigned_to', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deal stage: ${error.message}`);
    }

    // Log stage change activity
    await this.logActivity(
      dealId,
      'stage_change',
      `Moved to ${newStage}`,
      null,
      userId,
      oldStage,
      newStage
    );

    // Auto-create milestones for trigger stages
    let milestonesCreated = 0;
    const triggerStages: Record<string, string> = {
      'residential_sale': 'contract',
      'mortgage': 'application',
    };

    if (triggerStages[dealType.type_code] === newStage) {
      milestonesCreated = await this.createDefaultMilestones(dealId, dealType, userId, deal.expected_close_date);
    }

    return {
      deal: updatedDeal as Deal,
      milestones_created: milestonesCreated,
    };
  }

  /**
   * Delete deal (soft delete)
   *
   * @param dealId - The deal ID
   * @param userId - The authenticated user's ID
   * @returns Promise<void>
   * @throws {Error} If deletion fails
   */
  async deleteDeal(dealId: string, userId: string): Promise<void> {
    // Verify ownership
    await this.getDeal(dealId, userId);

    const { error } = await this.supabase
      .from('deals')
      .update({ is_deleted: true })
      .eq('id', dealId)
      .eq('assigned_to', userId);

    if (error) {
      throw new Error(`Failed to delete deal: ${error.message}`);
    }

    // Log activity
    await this.logActivity(
      dealId,
      'other',
      'Deal Deleted',
      `Deal marked as deleted`,
      userId
    );
  }

  /**
   * Create a custom activity
   *
   * @param dealId - The deal ID
   * @param activityData - Activity data
   * @param userId - The authenticated user's ID
   * @returns Promise<DealActivity> The created activity
   * @throws {Error} If creation fails
   */
  async createActivity(
    dealId: string,
    activityData: CreateActivityInput,
    userId: string
  ): Promise<DealActivity> {
    // Verify deal exists and user has access
    await this.getDeal(dealId, userId);

    return await this.logActivity(
      dealId,
      activityData.activity_type,
      activityData.title,
      activityData.description || null,
      userId
    );
  }

  /**
   * Calculate commission amounts
   *
   * @param dealValue - Total deal value
   * @param commissionRate - Commission rate percentage (0-100)
   * @param commissionSplitPercent - Agent's split percentage (0-100)
   * @returns CommissionCalculation
   */
  calculateCommission(
    dealValue: number,
    commissionRate: number,
    commissionSplitPercent?: number
  ): CommissionCalculation {
    const commissionAmount = dealValue * (commissionRate / 100);
    const agentCommission = commissionSplitPercent
      ? commissionAmount * (commissionSplitPercent / 100)
      : commissionAmount;

    return {
      commission_amount: commissionAmount,
      agent_commission: agentCommission,
    };
  }

  // Private helper methods

  /**
   * Get deal type by ID
   */
  private async getDealType(dealTypeId: string): Promise<DealType | null> {
    const { data, error } = await this.supabase
      .from('deal_types')
      .select('*')
      .eq('id', dealTypeId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DealType;
  }

  /**
   * Create default milestones from deal type template
   */
  private async createDefaultMilestones(
    dealId: string,
    dealType: DealType,
    userId: string,
    baseDate?: string | null
  ): Promise<number> {
    if (!dealType.default_milestones || dealType.default_milestones.length === 0) {
      return 0;
    }

    const milestones = dealType.default_milestones.map(template => ({
      deal_id: dealId,
      milestone_type: template.type,
      milestone_name: template.name,
      scheduled_date: this.calculateMilestoneDate(template.days_offset, baseDate),
      status: 'pending' as const,
      created_by: userId,
    }));

    const { data, error } = await this.supabase
      .from('deal_milestones')
      .insert(milestones)
      .select();

    if (error) {
      console.error('Failed to create milestones:', error);
      return 0;
    }

    // Log activity
    await this.logActivity(
      dealId,
      'other',
      `Created ${milestones.length} milestones`,
      `Milestones: ${milestones.map(m => m.milestone_name).join(', ')}`,
      userId
    );

    return data?.length || 0;
  }

  /**
   * Calculate milestone date based on offset
   */
  private calculateMilestoneDate(daysOffset: number, baseDate?: string | null): string {
    const date = baseDate ? new Date(baseDate) : new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  }

  /**
   * Log activity to deal_activities table
   */
  private async logActivity(
    dealId: string,
    activityType: ActivityType,
    title: string,
    description: string | null,
    userId: string,
    oldStage?: string,
    newStage?: string
  ): Promise<DealActivity> {
    const activityData = {
      deal_id: dealId,
      activity_type: activityType,
      title,
      description,
      old_stage: oldStage || null,
      new_stage: newStage || null,
      created_by: userId,
    };

    const { data, error } = await this.supabase
      .from('deal_activities')
      .insert(activityData)
      .select()
      .single();

    if (error) {
      console.error('Failed to log activity:', error);
      throw new Error(`Failed to log activity: ${error.message}`);
    }

    return data as DealActivity;
  }
}
