/**
 * Seed Test Users Script
 *
 * Creates test user accounts for development and testing
 *
 * Usage:
 *   npm run seed-test-users
 *   or
 *   npx tsx scripts/seed-test-users.ts
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

const TEST_USERS = [
  {
    email: 'admin@korella.com',
    password: 'Admin123!',
    fullName: 'Admin User',
    subscriptionTier: 'enterprise',
    emailVerified: true,
    accountStatus: 'active',
    role: 'admin',
  },
  {
    email: 'pro@korella.com',
    password: 'ProUser123!',
    fullName: 'Pro User',
    subscriptionTier: 'pro',
    emailVerified: true,
    accountStatus: 'active',
    role: 'user',
  },
  {
    email: 'trial@korella.com',
    password: 'Trial123!',
    fullName: 'Trial User',
    subscriptionTier: 'trial',
    emailVerified: true,
    accountStatus: 'active',
    role: 'user',
    // Set trial to expire in 7 days
    trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    email: 'free@korella.com',
    password: 'FreeUser123!',
    fullName: 'Free User',
    subscriptionTier: 'free',
    emailVerified: true,
    accountStatus: 'active',
    role: 'user',
  },
  {
    email: 'unverified@korella.com',
    password: 'Unverified123!',
    fullName: 'Unverified User',
    subscriptionTier: 'trial',
    emailVerified: false,
    accountStatus: 'active',
    role: 'user',
  },
  {
    email: 'locked@korella.com',
    password: 'Locked123!',
    fullName: 'Locked User',
    subscriptionTier: 'free',
    emailVerified: true,
    accountStatus: 'locked',
    role: 'user',
    failedLoginCount: 5,
    lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Locked for 30 minutes
  },
];

async function seedTestUsers() {
  console.log('🌱 Seeding test users...\n');

  try {
    const createdUsers = [];

    for (const userData of TEST_USERS) {
      console.log(`Creating user: ${userData.email}...`);

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.users.create({
        data: {
          email: userData.email,
          password_hash: passwordHash,
          full_name: userData.fullName,
          subscription_tier: userData.subscriptionTier,
          email_verified: userData.emailVerified,
          email_verified_at: userData.emailVerified ? new Date() : null,
          account_status: userData.accountStatus,
          failed_login_count: userData.failedLoginCount || 0,
          locked_until: userData.lockedUntil || null,
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
        status: userData.accountStatus,
      });

      console.log(`   ✓ Created: ${user.email} (${user.subscription_tier})\n`);
    }

    console.log('✅ Test users created successfully!\n');
    console.log('📋 Test User Credentials:\n');
    console.log('┌─────────────────────────────┬──────────────────┬────────────┬──────────┬────────┐');
    console.log('│ Email                       │ Password         │ Tier       │ Verified │ Status │');
    console.log('├─────────────────────────────┼──────────────────┼────────────┼──────────┼────────┤');

    createdUsers.forEach(user => {
      const email = user.email.padEnd(27);
      const password = user.password.padEnd(16);
      const tier = user.tier.padEnd(10);
      const verified = (user.verified ? '✓' : '✗').padEnd(8);
      const status = user.status.padEnd(6);
      console.log(`│ ${email} │ ${password} │ ${tier} │ ${verified} │ ${status} │`);
    });

    console.log('└─────────────────────────────┴──────────────────┴────────────┴──────────┴────────┘\n');

    console.log('🔑 You can now login with these credentials for testing.\n');

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the script
seedTestUsers()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
