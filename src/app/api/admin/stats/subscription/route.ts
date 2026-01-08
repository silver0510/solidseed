/**
 * Admin Subscription Statistics Routes
 *
 * GET /api/admin/stats/subscription - Get subscription statistics
 */

import { getSubscriptionStatistics } from '../../../../../controllers/admin.controller';

export const GET = getSubscriptionStatistics;
