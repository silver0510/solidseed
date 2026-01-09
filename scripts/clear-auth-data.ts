/**
 * Clear Authentication Data Script
 *
 * This script clears all data from authentication-related tables
 * for testing purposes. Use with caution!
 *
 * Usage:
 *   npm run clear-auth-data
 *   or
 *   npx tsx scripts/clear-auth-data.ts
 */

import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Get database URL
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Error: SUPABASE_DATABASE_URL or DATABASE_URL environment variable is required');
  console.error('Please set it in your .env.local file');
  process.exit(1);
}

// Initialize Prisma with PostgreSQL adapter (required for Prisma 7)
// Supabase requires SSL connections
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearAuthData() {
  console.log('🧹 Starting authentication data cleanup...\n');

  try {
    // Delete in correct order to respect foreign key constraints

    console.log('1️⃣  Clearing auth logs...');
    const authLogs = await prisma.auth_logs.deleteMany({});
    console.log(`   ✓ Deleted ${authLogs.count} auth log entries\n`);

    console.log('2️⃣  Clearing email verifications...');
    const emailVerifications = await prisma.email_verifications.deleteMany({});
    console.log(`   ✓ Deleted ${emailVerifications.count} email verification records\n`);

    console.log('3️⃣  Clearing password resets...');
    const passwordResets = await prisma.password_resets.deleteMany({});
    console.log(`   ✓ Deleted ${passwordResets.count} password reset records\n`);

    console.log('4️⃣  Clearing OAuth providers...');
    const oauthProviders = await prisma.oauth_providers.deleteMany({});
    console.log(`   ✓ Deleted ${oauthProviders.count} OAuth provider records\n`);

    console.log('5️⃣  Clearing Better Auth sessions...');
    const sessions = await prisma.session.deleteMany({});
    console.log(`   ✓ Deleted ${sessions.count} session records\n`);

    console.log('6️⃣  Clearing Better Auth accounts...');
    const accounts = await prisma.account.deleteMany({});
    console.log(`   ✓ Deleted ${accounts.count} account records\n`);

    console.log('7️⃣  Clearing Better Auth verification tokens...');
    const verifications = await prisma.verification.deleteMany({});
    console.log(`   ✓ Deleted ${verifications.count} verification token records\n`);

    console.log('8️⃣  Clearing users...');
    const users = await prisma.users.deleteMany({});
    console.log(`   ✓ Deleted ${users.count} user records\n`);

    console.log('✅ Authentication data cleanup complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.count}`);
    console.log(`   - OAuth Providers: ${oauthProviders.count}`);
    console.log(`   - Password Resets: ${passwordResets.count}`);
    console.log(`   - Email Verifications: ${emailVerifications.count}`);
    console.log(`   - Auth Logs: ${authLogs.count}`);
    console.log(`   - Sessions: ${sessions.count}`);
    console.log(`   - Accounts: ${accounts.count}`);
    console.log(`   - Verification Tokens: ${verifications.count}`);
    console.log(`   Total: ${users.count + oauthProviders.count + passwordResets.count + emailVerifications.count + authLogs.count + sessions.count + accounts.count + verifications.count} records deleted\n`);

  } catch (error) {
    console.error('❌ Error clearing authentication data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the script
clearAuthData()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
