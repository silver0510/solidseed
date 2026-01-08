/**
 * Admin User Deactivation Routes
 *
 * PUT /api/admin/users/:userId/deactivate - Deactivate a user account
 */

import { deactivateUserAccount } from '../../../../../controllers/admin.controller';

export const PUT = deactivateUserAccount;
