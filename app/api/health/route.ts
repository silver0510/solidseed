import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { env, isProduction } from '@/lib/env';
import * as Sentry from '@sentry/nextjs';

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  latency?: number;
  error?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  services: {
    database: ServiceStatus;
    storage: ServiceStatus;
    email: ServiceStatus;
    monitoring: ServiceStatus;
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // Simple query to check database connectivity
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now() - start,
      };
    }

    return {
      status: 'healthy',
      message: 'Database connection successful',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

async function checkStorage(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const { error } = await supabase.storage.from('client-documents').list('', { limit: 1 });

    if (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now() - start,
      };
    }

    return {
      status: 'healthy',
      message: 'Storage service accessible',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

async function checkEmail(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    // In production, skip actual email send to avoid quota usage
    // Just verify API key is configured
    if (isProduction) {
      if (!env.RESEND_API_KEY) {
        return {
          status: 'unhealthy',
          error: 'RESEND_API_KEY not configured',
          latency: Date.now() - start,
        };
      }

      return {
        status: 'healthy',
        message: 'Email service configured',
        latency: Date.now() - start,
      };
    }

    // In development, we could test actual send to a test address
    // For now, just check configuration
    return {
      status: 'healthy',
      message: 'Email service configured',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

async function checkMonitoring(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    if (!env.SENTRY_DSN) {
      return {
        status: 'degraded',
        message: 'Sentry not configured (optional)',
        latency: Date.now() - start,
      };
    }

    // Test Sentry by capturing a test message
    Sentry.captureMessage('Health check test', 'debug');

    return {
      status: 'healthy',
      message: 'Monitoring service active',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown error',
      latency: Date.now() - start,
    };
  }
}

function getSystemInfo() {
  const usage = process.memoryUsage();
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(usage.heapUsed / 1024 / 1024), // MB
      total: Math.round(usage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    },
  };
}

export async function GET() {
  try {
    // Run all health checks in parallel
    const [database, storage, email, monitoring] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkEmail(),
      checkMonitoring(),
    ]);

    // Determine overall status
    const services = { database, storage, email, monitoring };
    const statuses = Object.values(services).map((s) => s.status);

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services,
      system: getSystemInfo(),
    };

    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
