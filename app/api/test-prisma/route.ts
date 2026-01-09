/**
 * Test endpoint to verify Prisma Client works
 * Access at: http://localhost:3000/api/test-prisma
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

export async function GET() {
  let prisma: PrismaClient | null = null;
  let pool: Pool | null = null;

  try {
    console.log('Initializing Prisma Client...');
    console.log('SUPABASE_DATABASE_URL exists:', !!process.env.SUPABASE_DATABASE_URL);

    const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL is not set');
    }

    // Initialize PostgreSQL pool and adapter for Prisma 7
    pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    console.log('Prisma Client initialized successfully');

    // Try a simple query
    const count = await prisma.users.count();

    return NextResponse.json({
      success: true,
      message: 'Prisma connection successful',
      userCount: count,
    });
  } catch (error: any) {
    console.error('Prisma error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        clientVersion: error.clientVersion,
      },
      { status: 500 }
    );
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (pool) {
      await pool.end();
    }
  }
}
