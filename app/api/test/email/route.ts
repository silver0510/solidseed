import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, type } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }

    let result;

    if (type === 'verification') {
      await EmailService.sendVerificationEmail(to, 'Test User', 'test-token-123');
      result = { success: true, type: 'verification' };
    } else if (type === 'password-reset') {
      await EmailService.sendPasswordResetEmail(to, 'Test User', 'test-token-456');
      result = { success: true, type: 'password-reset' };
    } else if (type === 'password-changed') {
      await EmailService.sendPasswordChangedEmail(to, 'Test User');
      result = { success: true, type: 'password-changed' };
    } else if (type === 'account-lockout') {
      const unlockTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      await EmailService.sendAccountLockoutEmail(to, 'Test User', unlockTime, 'reset-token-789');
      result = { success: true, type: 'account-lockout' };
    } else {
      result = await EmailService.sendEmail({
        to,
        subject: 'Test Email from SolidSeed CRM',
        html: '<h1>Test Email</h1><p>This is a test email from SolidSeed CRM.</p>',
        text: 'This is a test email from SolidSeed CRM.',
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Email test error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Email test endpoint ready. Use POST to send test emails.',
  });
}
