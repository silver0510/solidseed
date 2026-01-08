/**
 * Admin User Activation Routes
 *
 * PUT /api/admin/users/:userId/activate - Activate a user account
 */

import { activateUserAccount } from '../../../../../controllers/admin.controller';

export const PUT = activateUserAccount;
