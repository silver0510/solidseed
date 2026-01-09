/**
 * Reset Authentication Data Script
 *
 * Clears all authentication data and optionally seeds test users.
 * Perfect for resetting your development environment to a clean state.
 *
 * Usage:
 *   npm run reset-auth-data          # Clear only
 *   npm run reset-auth-data -- --seed # Clear and seed test users
 *   or
 *   npx tsx scripts/reset-auth-data.ts [--seed]
 */

import { config } from 'dotenv';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

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

// Check if --seed flag is provided
const shouldSeed = process.argv.includes('--seed');

const TEST_USERS = [
  {
    email: 'admin@korella.com',
    password: 'Admin123!',
    fullName: 'Admin User',
    subscriptionTier: 'enterprise',
    emailVerified: true,
    accountStatus: 'active',
  },
  {
    email: 'pro@korella.com',
    password: 'ProUser123!',
    fullName: 'Pro User',
    subscriptionTier: 'pro',
    emailVerified: true,
    accountStatus: 'active',
  },
  {
    email: 'trial@korella.com',
    password: 'Trial123!',
    fullName: 'Trial User',
    subscriptionTier: 'trial',
    emailVerified: true,
    accountStatus: 'active',
    trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    email: 'free@korella.com',
    password: 'FreeUser123!',
    fullName: 'Free User',
    subscriptionTier: 'free',
    emailVerified: true,
    accountStatus: 'active',
  },
  {
    email: 'unverified@korella.com',
    password: 'Unverified123!',
    fullName: 'Unverified User',
    subscriptionTier: 'trial',
    emailVerified: false,
    accountStatus: 'active',
  },
];

async function clearAuthData() {
  console.log('🧹 Clearing authentication data...\n');

  try {
    const results = {
      authLogs: 0,
      emailVerifications: 0,
      passwordResets: 0,
      oauthProviders: 0,
      sessions: 0,
      accounts: 0,
      verifications: 0,
      users: 0,
    };

    // Delete in correct order for foreign key constraints
    results.authLogs = (await prisma.auth_logs.deleteMany({})).count;
    results.emailVerifications = (await prisma.email_verifications.deleteMany({})).count;
    results.passwordResets = (await prisma.password_resets.deleteMany({})).count;
    results.oauthProviders = (await prisma.oauth_providers.deleteMany({})).count;
    results.sessions = (await prisma.session.deleteMany({})).count;
    results.accounts = (await prisma.account.deleteMany({})).count;
    results.verifications = (await prisma.verification.deleteMany({})).count;
    results.users = (await prisma.users.deleteMany({})).count;

    console.log('   ✓ Deleted records:');
    console.log(`     - Users: ${results.users}`);
    console.log(`     - OAuth Providers: ${results.oauthProviders}`);
    console.log(`     - Password Resets: ${results.passwordResets}`);
    console.log(`     - Email Verifications: ${results.emailVerifications}`);
    console.log(`     - Auth Logs: ${results.authLogs}`);
    console.log(`     - Sessions: ${results.sessions}`);
    console.log(`     - Accounts: ${results.accounts}`);
    console.log(`     - Verification Tokens: ${results.verifications}`);

    const total = Object.values(results).reduce((a, b) => a + b, 0);
    console.log(`     Total: ${total} records\n`);

    return results;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  try {
    const createdUsers = [];

    for (const userData of TEST_USERS) {
      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = await prisma.users.create({
        data: {
          email: userData.email,
          password_hash: passwordHash,
          full_name: userData.fullName,
          subscription_tier: userData.subscriptionTier,
          email_verified: userData.emailVerified,
          email_verified_at: userData.emailVerified ? new Date() : null,
          account_status: userData.accountStatus,
          trial_expires_at: userData.trialExpiresAt || null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      createdUsers.push({
        email: userData.email,
        password: userData.password,
        tier: userData.subscriptionTier,
        verified: userData.emailVerified,
      });
    }

    console.log('   ✓ Created test users:\n');
    console.log('   ┌─────────────────────────────┬──────────────────┬────────────┬──────────┐');
    console.log('   │ Email                       │ Password         │ Tier       │ Verified │');
    console.log('   ├─────────────────────────────┼──────────────────┼────────────┼──────────┤');

    createdUsers.forEach(user => {
      const email = user.email.padEnd(27);
      const password = user.password.padEnd(16);
      const tier = user.tier.padEnd(10);
      const verified = (user.verified ? '✓' : '✗').padEnd(8);
      console.log(`   │ ${email} │ ${password} │ ${tier} │ ${verified} │`);
    });

    console.log('   └─────────────────────────────┴──────────────────┴────────────┴──────────┘\n');

    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  }
}

async function resetAuthData() {
  console.log('🔄 Resetting Authentication Data\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Clear existing data
    await clearAuthData();

    // Step 2: Seed test users if requested
    if (shouldSeed) {
      await seedTestUsers();
    } else {
      console.log('ℹ️  Skipping test user seeding (use --seed flag to include)\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Authentication data reset complete!\n');

    if (shouldSeed) {
      console.log('🔑 You can now login with the test users shown above.\n');
    } else {
      console.log('💡 Run with --seed flag to create test users automatically.\n');
    }

  } catch (error) {
    console.error('❌ Reset failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the script
resetAuthData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
