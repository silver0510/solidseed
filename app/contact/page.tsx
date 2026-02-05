"use client";

import { useState, FormEvent, useRef, useCallback } from "react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Clock, ArrowLeft } from "lucide-react";
import LegalNav from "@/components/LegalNav";

const CONTACT_EMAIL = "nghiapham.itwork@gmail.com";

const SUBJECT_OPTIONS = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "privacy", label: "Privacy or Data Request" },
  { value: "partnership", label: "Partnership" },
  { value: "feedback", label: "Feedback" },
];

// Exposed via NEXT_PUBLIC so the browser can read it at runtime
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!formData.name.trim()) next.name = "Name is required";
    if (!formData.email.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      next.email = "Invalid email format";
    }
    if (!formData.message.trim()) {
      next.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      next.message = "Message must be at least 10 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ---------------------------------------------------------------------------
  // reCAPTCHA callbacks
  // ---------------------------------------------------------------------------

  const handleCaptchaChange = useCallback(() => {
    // clear captcha error when user solves it
    setErrors((prev) => ({ ...prev, captcha: "" }));
  }, []);

  const handleCaptchaExpired = useCallback(() => {
    setErrors((prev) => ({ ...prev, captcha: "Captcha expired. Please solve it again." }));
  }, []);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    // grab the reCAPTCHA token — executeAsync returns null if not yet solved
    const token = await recaptchaRef.current?.executeAsync();
    if (!token) {
      setErrors((prev) => ({ ...prev, captcha: "Please complete the captcha." }));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          recaptchaToken: token,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setApiError(
          (data as { error?: string }).error ?? "Something went wrong. Please try again."
        );
        // reset captcha so user can re-solve if needed
        recaptchaRef.current?.reset();
        return;
      }

      setSubmitted(true);
    } catch {
      setApiError("Network error. Please check your connection and try again.");
      recaptchaRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Reset after success
  // ---------------------------------------------------------------------------

  const handleReset = () => {
    setFormData({ name: "", email: "", subject: "general", message: "" });
    setErrors({});
    setApiError(null);
    setSubmitted(false);
    recaptchaRef.current?.reset();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <LegalNav activePage="contact" />

      {/* Page Header */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="mt-3 text-muted-foreground">
            Have a question or want to get in touch? Fill out the form below and
            we will get back to you as soon as possible.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Contact Info Cards */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="border rounded-lg p-5 bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Email</h3>
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sm text-primary hover:underline break-all"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="border rounded-lg p-5 bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                  Response Time
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24–48 hours on business days.
              </p>
            </div>

            <div className="border rounded-lg p-5 bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <ArrowLeft className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">
                  Quick Links
                </h3>
              </div>
              <div className="flex flex-col gap-2 mt-1">
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </aside>

          {/* Right: Form or Success */}
          <main className="flex-1">
            {submitted ? (
              <div className="border rounded-lg bg-card p-10 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Message Sent
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for reaching out. We have received your message and
                  will get back to you at{" "}
                  <span className="text-foreground font-medium">
                    {formData.email}
                  </span>{" "}
                  within 24–48 hours.
                </p>
                <Button variant="outline" onClick={handleReset} className="mt-2">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="border rounded-lg bg-card p-6 space-y-5"
              >
                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                    Subject
                  </Label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {SUBJECT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-sm font-medium text-foreground">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={errors.message ? "border-destructive" : ""}
                  />
                  {errors.message && (
                    <p className="text-xs text-destructive">{errors.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length} characters
                  </p>
                </div>

                {/* reCAPTCHA */}
                <div className="space-y-1.5">
                  {RECAPTCHA_SITE_KEY ? (
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      size="invisible"
                      onChange={handleCaptchaChange}
                      onExpired={handleCaptchaExpired}
                    />
                  ) : null}
                  {errors.captcha && (
                    <p className="text-xs text-destructive">{errors.captcha}</p>
                  )}
                </div>

                {/* API-level error banner */}
                {apiError && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3">
                    <p className="text-sm text-destructive">{apiError}</p>
                  </div>
                )}

                {/* Submit */}
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? "Sending…" : "Send Message"}
                </Button>

                {/* reCAPTCHA badge note */}
                <p className="text-xs text-muted-foreground">
                  This form is protected by{" "}
                  <a
                    href="https://www.google.com/recaptcha/terms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    reCAPTCHA
                  </a>
                  .
                </p>
              </form>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 SolidSeed, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span className="text-foreground font-medium">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
