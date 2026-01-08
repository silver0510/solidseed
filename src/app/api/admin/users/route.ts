/**
 * Admin Users Routes
 *
 * GET /api/admin/users - Get all users with subscription info
 */

import { getAllUsers } from '../../../../controllers/admin.controller';

export const GET = getAllUsers;
