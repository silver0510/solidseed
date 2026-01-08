/**
 * Background Job: Purge Old Authentication Logs
 *
 * This job deletes authentication logs older than 7 days from the database.
 * Should be run daily to maintain database performance and comply with
 * data retention policies.
 *
 * Usage:
 * - Run as a cron job: `0 2 * * *` (daily at 2 AM)
 * - Or use with Vercel Cron Jobs
 * - Or integrate with your job queue (Bull, Agendash, etc.)
 *
 * Environment Variables Required:
 * - SUPABASE_DATABASE_URL: PostgreSQL connection string
 */

import { purgeOldAuthLogs } from '../services/security.service';
import { purgeExpiredPasswordResetTokens } from '../services/password.service';

// =============================================================================
// Job Configuration
// =============================================================================

/**
 * Job configuration
 */
export const purgeAuthLogsJobConfig = {
  // Job name
  name: 'purge-auth-logs',

  // Schedule: Daily at 2 AM UTC
  schedule: '0 2 * * *',

  // Retention period in days
  retentionDays: 7,

  // Enable/disable the job
  enabled: true,
} as const;

// =============================================================================
// Job Handler
// =============================================================================

/**
 * Main job handler
 *
 * @returns Job execution result
 */
export async function runPurgeAuthLogsJob(): Promise<{
  success: boolean;
  authLogsDeleted: number;
  resetTokensDeleted: number;
  duration: number;
  error?: string;
}> {
  const startTime = Date.now();

  console.log('Starting purge auth logs job...');
  console.log(`Retention period: ${purgeAuthLogsJobConfig.retentionDays} days`);

  try {
    // Purge old authentication logs
    const authLogsDeleted = await purgeOldAuthLogs();

    // Also purge expired password reset tokens
    const resetTokensDeleted = await purgeExpiredPasswordResetTokens();

    const duration = Date.now() - startTime;

    console.log(`✅ Purge auth logs job completed successfully`);
    console.log(`   - Auth logs deleted: ${authLogsDeleted}`);
    console.log(`   - Reset tokens deleted: ${resetTokensDeleted}`);
    console.log(`   - Duration: ${duration}ms`);

    return {
      success: true,
      authLogsDeleted,
      resetTokensDeleted,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('❌ Purge auth logs job failed:', error);

    return {
      success: false,
      authLogsDeleted: 0,
      resetTokensDeleted: 0,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// Vercel Cron Job Handler
// =============================================================================

/**
 * Vercel Cron Job handler
 *
 * To use this, add to your vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/purge-auth-logs",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * ```
 */
export async function handleVercelCronJob(): Promise<Response> {
  // Verify cron secret (recommended for production)
  const authHeader = process.env.CRON_SECRET;
  const requestAuth = request?.headers?.get('authorization');

  if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      {
        error: 'Unauthorized',
        message: 'Invalid cron secret',
      },
      { status: 401 }
    );
  }

  // Run the job
  const result = await runPurgeAuthLogsJob();

  if (result.success) {
    return Response.json({
      success: true,
      message: 'Auth logs purged successfully',
      data: {
        authLogsDeleted: result.authLogsDeleted,
        resetTokensDeleted: result.resetTokensDeleted,
        duration: result.duration,
      },
    });
  } else {
    return Response.json(
      {
        success: false,
        error: result.error || 'Job failed',
        data: {
          duration: result.duration,
        },
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// Standalone Script Runner
// =============================================================================

/**
 * Run job as standalone script
 *
 * Usage:
 * ```bash
 * node -r ts-node/register src/jobs/purge-auth-logs.job.ts
 * ```
 *
 * Or with npm script:
 * ```json
 * {
 *   "scripts": {
 *     "jobs:purge-auth-logs": "ts-node src/jobs/purge-auth-logs.job.ts"
 *   }
 * }
 * ```
 */
export async function runAsScript(): Promise<void> {
  console.log('Running purge auth logs job as standalone script...');

  const result = await runPurgeAuthLogsJob();

  if (result.success) {
    console.log('✅ Job completed successfully');
    process.exit(0);
  } else {
    console.error('❌ Job failed:', result.error);
    process.exit(1);
  }
}

// Run as script if executed directly
if (require.main === module) {
  runAsScript().catch((error) => {
    console.error('Fatal error running job:', error);
    process.exit(1);
  });
}

// =============================================================================
// Job Queue Integration (Bull/Agendash)
// =============================================================================

/**
 * Bull job processor
 *
 * Usage with Bull:
 * ```ts
 * import { Queue } from 'bullmq';
 *
 * const authQueue = new Queue('auth-jobs');
 * authQueue.add('purge-auth-logs', {}, { repeat: { pattern: '0 2 * * *' } });
 * ```
 */
export async function processBullJob(): Promise<void> {
  await runPurgeAuthLogsJob();
}

/**
 * Agendash job definition
 *
 * Usage with Agenda:
 * ```ts
 * import { Agenda } from 'agenda';
 *
 * const agenda = new Agenda();
 * agenda.define('purge auth logs', async () => {
 *   await runPurgeAuthLogsJob();
 * });
 * agenda.every('0 2 * * *', 'purge auth logs');
 * ```
 */
export async function processAgendaJob(): Promise<void> {
  await runPurgeAuthLogsJob();
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculates the cutoff date for log deletion
 *
 * @param retentionDays - Number of days to retain logs
 * @returns Cutoff date
 */
export function calculateCutoffDate(retentionDays: number = 7): Date {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  return cutoffDate;
}

/**
 * Validates that the job should run based on configuration
 *
 * @returns True if job is enabled and should run
 */
export function shouldRunJob(): boolean {
  return purgeAuthLogsJobConfig.enabled;
}

/**
 * Gets job statistics
 *
 * @returns Job configuration and status
 */
export function getJobStats(): {
  name: string;
  schedule: string;
  retentionDays: number;
  enabled: boolean;
  nextRun: Date;
} {
  const schedule = purgeAuthLogsJobConfig.schedule;
  const enabled = purgeAuthLogsJobConfig.enabled;

  // Calculate next run time (simplified - in production use a cron parser)
  const nextRun = new Date();
  nextRun.setHours(2, 0, 0, 0);
  if (nextRun <= new Date()) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return {
    name: purgeAuthLogsJobConfig.name,
    schedule,
    retentionDays: purgeAuthLogsJobConfig.retentionDays,
    enabled,
    nextRun,
  };
}
