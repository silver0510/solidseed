import { NextResponse } from "next/server";
import { EmailService } from "@/lib/email";

// ---------------------------------------------------------------------------
// reCAPTCHA verification
// ---------------------------------------------------------------------------

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("[contact] RECAPTCHA_SECRET_KEY is not set");
    return false;
  }

  const res = await fetch("https://www.google.com/recaptcha/api.siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data: { success: boolean; score?: number } = await res.json();
  // score threshold 0.5 is Google's default recommendation
  return data.success && (data.score ?? 0) >= 0.5;
}

// ---------------------------------------------------------------------------
// Rate-limit: simple in-memory sliding window (per IP, resets every 60 s)
// ---------------------------------------------------------------------------

const ipMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max submissions per window
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ---------------------------------------------------------------------------
// Input sanitisation — strip tags, collapse whitespace
// ---------------------------------------------------------------------------

function sanitize(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")   // strip HTML
    .replace(/\s+/g, " ")      // collapse whitespace
    .trim();
}

// ---------------------------------------------------------------------------
// Email HTML builder
// ---------------------------------------------------------------------------

const SUBJECT_LABELS: Record<string, string> = {
  general: "General Inquiry",
  support: "Technical Support",
  billing: "Billing & Subscription",
  privacy: "Privacy or Data Request",
  partnership: "Partnership",
  feedback: "Feedback",
};

function buildContactEmail(name: string, email: string, subject: string, message: string): string {
  const label = SUBJECT_LABELS[subject] ?? "General Inquiry";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Open Sans', Arial, sans-serif; color: #1E293B; background: #F8FAFC; margin: 0; padding: 24px; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { background: #2563EB; padding: 28px 32px; }
        .header h1 { margin: 0; color: #fff; font-size: 22px; font-weight: 600; }
        .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
        .body { padding: 28px 32px; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; margin-bottom: 4px; }
        .field p { margin: 0; font-size: 15px; color: #1E293B; line-height: 1.5; }
        .message-box { background: #F1F5F9; border-radius: 8px; padding: 16px; margin-top: 4px; }
        .message-box p { color: #334155; }
        .footer { border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; }
        .footer p { margin: 0; font-size: 12px; color: #94A3B8; }
        .footer a { color: #2563EB; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>New Contact Form Submission</h1>
          <p>Received from solidseed.com</p>
        </div>
        <div class="body">
          <div class="field">
            <label>Name</label>
            <p>${name}</p>
          </div>
          <div class="field">
            <label>Email</label>
            <p><a href="mailto:${email}" style="color:#2563EB;text-decoration:none;">${email}</a></p>
          </div>
          <div class="field">
            <label>Subject</label>
            <p>${label}</p>
          </div>
          <div class="field">
            <label>Message</label>
            <div class="message-box"><p>${message.replace(/\n/g, "<br />")}</p></div>
          </div>
        </div>
        <div class="footer">
          <p>This email was sent automatically by the <a href="/">SolidSeed</a> contact form.</p>
        </div>
      </div>
    </body>
    </html>`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // --- rate limit ---
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0]?.trim() : undefined) ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // --- parse body ---
  let body: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    recaptchaToken?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, subject, message, recaptchaToken } = body;

  // --- validate required fields ---
  if (!name || !email || !message || !recaptchaToken) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  // --- sanitise ---
  const cleanName = sanitize(name);
  const cleanEmail = sanitize(email);
  const cleanSubject = sanitize(subject ?? "general");
  const cleanMessage = sanitize(message);

  if (cleanName.length === 0 || cleanEmail.length === 0 || cleanMessage.length < 10) {
    return NextResponse.json(
      { error: "Invalid input." },
      { status: 400 }
    );
  }

  // --- email format check ---
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    );
  }

  // --- verify reCAPTCHA ---
  const captchaOk = await verifyRecaptcha(recaptchaToken);
  if (!captchaOk) {
    return NextResponse.json(
      { error: "Captcha verification failed. Please try again." },
      { status: 403 }
    );
  }

  // --- send email via Resend (existing EmailService with retry) ---
  const ownerEmail = process.env.CONTACT_OWNER_EMAIL ?? "nghiapham.itwork@gmail.com";
  const subjectLabel = SUBJECT_LABELS[cleanSubject] ?? "General Inquiry";

  try {
    await EmailService.sendEmail({
      to: ownerEmail,
      subject: `[SolidSeed Contact] ${subjectLabel} — from ${cleanName}`,
      html: buildContactEmail(cleanName, cleanEmail, cleanSubject, cleanMessage),
      replyTo: cleanEmail,
    });
  } catch (err) {
    console.error("[contact] EmailService.sendEmail failed:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
