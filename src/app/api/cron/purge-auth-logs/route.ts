/**
 * Cron Job Endpoint: Purge Old Authentication Logs
 *
 * This endpoint triggers the background job to delete authentication logs
 * older than 7 days from the database.
 *
 * Intended to be called by:
 * - Vercel Cron Jobs
 * - External cron services (cron-job.org, EasyCron, etc.)
 * - Manual trigger via API call
 *
 * Security: Requires CRON_SECRET environment variable to be set
 *
 * To configure Vercel Cron Jobs, add to vercel.json:
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/purge-auth-logs",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPurgeAuthLogsJob } from '@/jobs/purge-auth-logs.job';

// =============================================================================
// Security
// =============================================================================

/**
 * Verifies the cron secret for security
 *
 * @param request - Next.js request object
 * @returns True if authorized, false otherwise
 */
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is not set, allow the request (development mode)
  if (!cronSecret) {
    console.warn('⚠️  CRON_SECRET not set - allowing request in development mode');
    return true;
  }

  // Verify the secret
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

// =============================================================================
// POST Handler
// =============================================================================

/**
 * POST /api/cron/purge-auth-logs
 *
 * Triggers the purge auth logs job
 *
 * Requires CRON_SECRET to be set and sent in Authorization header:
 * Authorization: Bearer <CRON_SECRET>
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "message": "Auth logs purged successfully",
 *   "data": {
 *     "authLogsDeleted": 123,
 *     "resetTokensDeleted": 45,
 *     "duration": 234
 *   }
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing cron secret',
        },
        { status: 401 }
      );
    }

    console.log('🔄 Purge auth logs job triggered via API');

    // Run the job
    const result = await runPurgeAuthLogsJob();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Auth logs purged successfully',
        data: {
          authLogsDeleted: result.authLogsDeleted,
          resetTokensDeleted: result.resetTokensDeleted,
          duration: result.duration,
        },
      });
    } else {
      return NextResponse.json(
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
  } catch (error) {
    console.error('Error in purge auth logs endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET Handler (for manual testing)
// =============================================================================

/**
 * GET /api/cron/purge-auth-logs
 *
 * Returns job status information (doesn't run the job)
 *
 * Response:
 * ```json
 * {
 *   "job": {
 *     "name": "purge-auth-logs",
 *     "schedule": "0 2 * * *",
 *     "retentionDays": 7,
 *     "enabled": true,
 *     "nextRun": "2024-01-08T02:00:00.000Z"
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for status check as well
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing cron secret',
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    job: {
      name: 'purge-auth-logs',
      schedule: '0 2 * * *',
      retentionDays: 7,
      enabled: true,
      description: 'Deletes authentication logs older than 7 days',
    },
  });
}

// =============================================================================
// OPTIONS Handler (for CORS preflight)
// =============================================================================

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}
