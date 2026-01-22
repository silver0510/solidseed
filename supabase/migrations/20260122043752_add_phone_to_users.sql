-- Add phone column to users table for profile settings
-- This allows users to store their phone number in their profile

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Add index for phone lookup (optional, for future search functionality)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.phone IS 'User phone number for profile (optional)';
