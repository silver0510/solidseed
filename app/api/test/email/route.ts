import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    const { to, type } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    let result;

    if (type === 'verification') {
      result = await EmailService.sendVerificationEmail(
        to,
        'http://localhost:3000/auth/verify?token=test123'
      );
    } else if (type === 'password-reset') {
      result = await EmailService.sendPasswordResetEmail(
        to,
        'http://localhost:3000/auth/reset?token=test456'
      );
    } else {
      result = await EmailService.sendEmail({
        to,
        subject: 'Test Email from Korella CRM',
        html: '<h1>Test Email</h1><p>This is a test email from Korella CRM.</p>',
        text: 'This is a test email from Korella CRM.',
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Email test error:', error);
    Sentry.captureException(error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test Sentry error tracking
    throw new Error('Test Sentry error from email endpoint');
  } catch (error) {
    Sentry.captureException(error);

    return NextResponse.json({
      success: true,
      message: 'Test error sent to Sentry',
    });
  }
}
