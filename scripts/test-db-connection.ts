/**
 * Test Database Connection Script
 *
 * Verifies that the database connection is working properly
 *
 * Usage:
 *   npm run db:test
 *   or
 *   npx tsx scripts/test-db-connection.ts
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

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  console.log('Database URL:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
  console.log('');

  // Supabase requires SSL connections
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Test 1: Basic connection
    console.log('1️⃣  Testing basic connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✓ Connection successful\n');

    // Test 2: Check auth tables exist
    console.log('2️⃣  Checking authentication tables...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('users', 'auth_logs', 'password_resets', 'email_verifications', 'oauth_providers', 'session', 'account', 'verification')
      ORDER BY tablename
    `;

    const expectedTables = ['users', 'auth_logs', 'password_resets', 'email_verifications', 'oauth_providers', 'session', 'account', 'verification'];
    const foundTables = tables.map(t => t.tablename);

    expectedTables.forEach(table => {
      if (foundTables.includes(table)) {
        console.log(`   ✓ ${table}`);
      } else {
        console.log(`   ✗ ${table} (MISSING)`);
      }
    });
    console.log('');

    // Test 3: Count records
    console.log('3️⃣  Counting existing records...');
    const userCount = await prisma.users.count();
    const authLogCount = await prisma.auth_logs.count();
    const passwordResetCount = await prisma.password_resets.count();
    const emailVerificationCount = await prisma.email_verifications.count();

    console.log(`   - Users: ${userCount}`);
    console.log(`   - Auth Logs: ${authLogCount}`);
    console.log(`   - Password Resets: ${passwordResetCount}`);
    console.log(`   - Email Verifications: ${emailVerificationCount}`);
    console.log('');

    console.log('✅ Database connection test passed!\n');

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  });
