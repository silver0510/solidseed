/**
 * Admin User Subscription Routes
 *
 * GET /api/admin/users/:userId/subscription - Get user subscription info
 * PUT /api/admin/users/:userId/subscription - Change user subscription tier
 */

import { getUserSubscription, changeUserSubscription } from '../../../../../controllers/admin.controller';

export const GET = getUserSubscription;
export const PUT = changeUserSubscription;
