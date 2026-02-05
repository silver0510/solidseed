import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SolidSeed CRM",
  description:
    "SolidSeed's Privacy Policy — how we collect, use, and protect your personal information in accordance with applicable U.S. laws.",
};

const EFFECTIVE_DATE = "February 1, 2026";
const COMPANY = "SolidSeed, Inc.";
const CONTACT_EMAIL = "privacy@solidseed.com";

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: `We collect information you provide directly to us, information generated through your use of our services, and information we may receive from third parties, as described below.

**Information You Provide Directly:**
- Account registration details (name, email address, password)
- Professional information (brokerage name, license number, specialization)
- Profile and avatar uploads
- Client data you enter into the platform (client names, contact details, property preferences, deal information, notes, documents, and tags)
- Communication content (messages, support tickets, feedback)
- Payment and billing information (processed by a third-party payment provider; we do not store full card numbers)

**Information Generated Through Your Use:**
- Log data (IP address, browser type, operating system, referring URL, pages visited, time spent, and timestamps)
- Device identifiers and cookies
- Usage patterns and feature interaction data
- Activity logs related to clients, deals, tasks, and documents within your account

**Information From Third Parties:**
- OAuth identity data from Google or Microsoft when you choose to sign in via those providers (limited to the scopes you authorize)
- Data from analytics or error-monitoring tools we use to improve the platform`,
  },
  {
    id: "how-we-use-your-information",
    title: "2. How We Use Your Information",
    content: `We use the information we collect for the following purposes:

- **Providing and maintaining the service** — creating and managing your account, processing transactions, and delivering the features and functionality of SolidSeed
- **Personalizing your experience** — tailoring content, recommendations, and interface settings to your preferences
- **Communication** — sending you transactional emails (registration confirmation, password reset, email verification), service updates, and, where you have opted in, marketing communications
- **Security and fraud prevention** — monitoring for unauthorized access, enforcing account lockout policies, and protecting against abuse
- **Analytics and improvement** — understanding how the platform is used so we can improve features, fix bugs, and optimize performance
- **Legal and compliance obligations** — responding to legal process, complying with applicable laws, and enforcing our Terms of Service
- **Support** — responding to your inquiries and resolving issues`,
  },
  {
    id: "cookies-and-tracking",
    title: "3. Cookies and Tracking Technologies",
    content: `We use cookies and similar tracking technologies (such as local storage and session storage) to operate and improve SolidSeed.

**Strictly Necessary Cookies:** These are required for the platform to function. They maintain your logged-in session and store authentication tokens. You cannot opt out of these cookies without losing access to the service.

**Functional Cookies:** These remember your preferences (such as theme selection and sidebar state) to provide a consistent experience across sessions.

**Analytics Cookies:** We use anonymized analytics data to understand usage patterns. We do not build individual behavioral profiles from this data.

You can manage cookie preferences through your browser settings. For detailed information on how to do this, consult your browser's documentation. Note that disabling non-essential cookies may affect certain features of the platform.`,
  },
  {
    id: "information-sharing",
    title: "4. How We Share Your Information",
    content: `We do not sell your personal information to third parties. We may share information in the following limited circumstances:

- **Service providers:** We share information with vendors and partners who assist in operating SolidSeed (e.g., hosting, database, payment processing, error monitoring). These providers are contractually bound not to use your data for their own purposes beyond providing the service.
- **Legal requirements:** We may disclose information when required by law, court order, or government request, or when necessary to protect the rights, property, or safety of SolidSeed, its users, or the public.
- **Business transfers:** If SolidSeed is acquired, merged, or undergoes a similar transaction, your information may be transferred to the acquiring entity. We will notify you of any such transfer in advance where required by law.
- **With your consent:** We may share information in other circumstances with your explicit consent.

We do not share your client data with other SolidSeed users or with third parties unless you explicitly authorize it within the platform.`,
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    content: `We retain your personal information for as long as your account is active or as needed to provide the service. Specific retention periods include:

- **Active account data:** Retained for the duration of your account plus a reasonable period afterward for operational continuity.
- **Security audit logs:** Retained for 7 days as described in our security architecture.
- **Deleted accounts:** When you delete your account, we begin a 30-day grace period after which your data is permanently removed from our primary systems. Anonymized or aggregated data may be retained for analytics purposes.
- **Legal holds:** If your data is subject to a legal hold or regulatory requirement, we will retain it for the duration required by law, regardless of account status.

Backups may retain copies of your data for a limited period following deletion; these are not accessible and are overwritten during routine backup cycles.`,
  },
  {
    id: "your-rights",
    title: "6. Your Privacy Rights",
    content: `Depending on your state of residence within the United States, you may have certain privacy rights. These may include:

- **Access:** The right to know what personal information we hold about you.
- **Deletion:** The right to request that we delete your personal information, subject to certain exceptions (e.g., legal obligations, fraud prevention).
- **Correction:** The right to request correction of inaccurate personal information.
- **Opt-Out of Data Sale:** Although we do not sell personal information in the traditional sense, you may have the right to opt out of certain data sharing practices. You can exercise this right by contacting us.
- **Non-Discrimination:** We will not discriminate against you for exercising your privacy rights.

**California Residents:** California residents have rights under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), including the rights described above. You may submit a "Do Not Sell or Share My Personal Information" request by contacting us at ${CONTACT_EMAIL}.

**Virginia, Colorado, Connecticut, Utah, and Other State Residents:** Residents of states that have enacted comprehensive privacy laws (such as the Virginia Consumer Data Protection Act, Colorado Privacy Act, Connecticut Data Privacy Act, and Utah Consumer Privacy Act) may have similar rights. Contact us to exercise them.

To submit a request, email ${CONTACT_EMAIL} and include your name, email address on file, and a description of your request. We will respond within 45 days, as required by applicable law.`,
  },
  {
    id: "security",
    title: "7. Security of Your Information",
    content: `We take the security of your personal information seriously and implement appropriate technical and organizational measures, including:

- Encryption of data in transit (TLS) and at rest
- Password hashing using bcrypt with a cost factor of 12
- Account lockout after 5 consecutive failed login attempts (30-minute lock period)
- Rate limiting on authentication endpoints (10 login attempts per minute per IP; 3 password resets per hour per email)
- JWT-based session management with configurable expiration
- Row-level security policies on your data in our database

No method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee the absolute security of your information, but we are committed to protecting it using industry-standard practices. If you become aware of any security issue, please report it to us promptly at ${CONTACT_EMAIL}.`,
  },
  {
    id: "childrens-privacy",
    title: "8. Children's Privacy",
    content: `SolidSeed is intended for use by real estate professionals aged 18 and older. We do not knowingly collect personal information from individuals under the age of 13. If you believe we have inadvertently collected information from a child under 13, please contact us at ${CONTACT_EMAIL} so we can promptly delete it.`,
  },
  {
    id: "third-party-links",
    title: "9. Third-Party Links and Integrations",
    content: `SolidSeed may link to or integrate with third-party services (such as Google or Microsoft for OAuth authentication). This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services you use in conjunction with SolidSeed.`,
  },
  {
    id: "international-users",
    title: "10. International Users",
    content: `SolidSeed is operated from the United States. If you access the service from outside the U.S., you understand that your information may be transferred to, and processed in, the United States. By using the service, you consent to such transfers. We process your information in accordance with applicable U.S. federal and state privacy laws.`,
  },
  {
    id: "changes",
    title: "11. Changes to This Privacy Policy",
    content: `We may update this Privacy Policy from time to time. When we do, we will update the effective date at the top of this page and, where required by law, notify you via email or a prominent notice on the platform. Your continued use of SolidSeed after a change constitutes acceptance of the updated policy. We encourage you to review this policy periodically.`,
  },
  {
    id: "contact",
    title: "12. Contact Us",
    content: `If you have questions, concerns, or requests regarding this Privacy Policy or our handling of your personal information, contact us at:

**${COMPANY}**
Email: ${CONTACT_EMAIL}

We will do our best to respond within 30 days of receiving your request.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-foreground">
            SolidSeed
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/"
              className="text-sm text-primary font-medium hover:underline transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <p className="text-sm text-muted-foreground mb-2">
            Effective as of {EFFECTIVE_DATE}
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-muted-foreground">
            This Privacy Policy describes how {COMPANY} collects, uses, and
            shares your personal information when you use the SolidSeed platform.
            It applies to all users of our service regardless of how they access
            it.
          </p>
        </div>
      </div>

      {/* Table of Contents + Content */}
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sticky Table of Contents */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-20">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Contents
              </h2>
              <nav className="flex flex-col gap-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id}>
                <h2 className="text-xl font-semibold text-foreground mb-4 scroll-mt-24">
                  {section.title}
                </h2>
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  {section.content.split("\n\n").map((paragraph, i) => {
                    // Render bold text within paragraphs
                    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={j} className="text-foreground">
                              {part.slice(2, -2)}
                            </strong>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Divider before footer note */}
            <div className="border-t pt-8">
              <p className="text-xs text-muted-foreground">
                This Privacy Policy is governed by the laws of the United States.
                If you have questions about how this policy applies to your
                situation, please contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 {COMPANY}. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-foreground font-medium">Privacy</span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
