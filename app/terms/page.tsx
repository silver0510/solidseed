import Link from "next/link";
import { Metadata } from "next";
import LegalNav from "@/components/LegalNav";

export const metadata: Metadata = {
  title: "Terms of Service | SolidSeed CRM",
  description:
    "SolidSeed's Terms of Service — the agreement governing your use of the SolidSeed CRM platform.",
};

const EFFECTIVE_DATE = "February 1, 2026";
const COMPANY = "SolidSeed, Inc.";
const CONTACT_EMAIL = "legal@solidseed.com";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using the SolidSeed platform — including our website, mobile application, and any related services — you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you must not use the service.

These Terms constitute a legally binding agreement between you and ${COMPANY}. If you are using the service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.`,
  },
  {
    id: "service-description",
    title: "2. Service Description",
    content: `SolidSeed is a cloud-based CRM platform designed for real estate professionals. The platform provides tools for client management, deal pipeline tracking, task management, document storage, and business analytics.

We reserve the right to modify, suspend, or discontinue any feature or the service as a whole at any time, with or without notice. We will make reasonable efforts to notify you of material changes in advance.`,
  },
  {
    id: "accounts",
    title: "3. Accounts and Registration",
    content: `**Account Creation:** To access most features of SolidSeed, you must create an account by providing a valid email address, name, and password. You may also register using an OAuth provider (Google or Microsoft).

**Email Verification:** Your account must be verified via email before full access is granted. Your trial period begins upon email verification.

**Account Security:** You are responsible for maintaining the confidentiality of your account credentials. Do not share your password with anyone. You must notify us immediately if you suspect unauthorized access to your account.

**Accurate Information:** You agree to provide accurate, current, and complete information during registration and to update it as needed. We reserve the right to terminate your account if information is found to be inaccurate or misleading.

**One Account Per User:** Each person or organization may maintain only one account unless otherwise agreed in writing.`,
  },
  {
    id: "subscription-tiers",
    title: "4. Subscription Tiers and Trial",
    content: `**Trial Period:** All new accounts receive a 14-day free trial beginning on the date of email verification. During the trial, you have access to platform features as defined by the trial tier. No payment information is required to start a trial.

**Subscription Plans:** After the trial period, you may choose from available subscription tiers (Free, Pro, Enterprise). Details on features and pricing are available on our website. Failure to select a paid plan after the trial ends will result in your account being moved to the Free tier, with associated feature limitations.

**Billing:** Payment for paid subscription tiers is processed through our authorized payment provider. Billing terms, including payment frequency and cancellation policies, are presented at the time of purchase.

**Refunds:** We will evaluate refund requests on a case-by-case basis. Contact ${CONTACT_EMAIL} for billing inquiries.`,
  },
  {
    id: "your-obligations",
    title: "5. Your Obligations",
    content: `By using SolidSeed, you agree to:

- Comply with all applicable federal, state, and local laws
- Use the platform only for lawful purposes and in a manner that does not infringe the rights of others
- Not attempt to gain unauthorized access to any part of the platform, its servers, or associated systems
- Not upload, transmit, or distribute content that is harmful, fraudulent, discriminatory, or otherwise in violation of any law
- Not use the platform to collect or harvest personal information about others without their consent
- Not reverse-engineer, decompile, or attempt to extract the source code of the platform
- Not interfere with or disrupt the integrity or performance of the platform or the data contained therein
- Comply with any data protection laws applicable to the personal information of clients you manage within the platform`,
  },
  {
    id: "your-data",
    title: "6. Your Data and Data Portability",
    content: `**Ownership:** You retain ownership of all data you upload or enter into SolidSeed, including client information, documents, and notes ("Your Data").

**License to Us:** By uploading Your Data, you grant us a non-exclusive, worldwide, royalty-free license to store, process, and transmit Your Data solely as necessary to provide the service. This license terminates when your account is deleted and all data has been removed.

**Data Portability:** You have the right to export Your Data in a machine-readable format at any time during your account's active period. We provide export functionality within the platform to facilitate this.

**Data Deletion:** Upon account termination or deletion, we will delete Your Data within 30 days, unless retention is required by law. See our Privacy Policy for details.`,
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual Property",
    content: `**SolidSeed IP:** The SolidSeed platform, including its software, design, logos, trademarks, and documentation, is the intellectual property of ${COMPANY} and is protected by applicable copyright, trademark, and other intellectual property laws. Nothing in these Terms grants you any rights in or to our intellectual property, except the limited license to use the service.

**Your Content:** You retain all intellectual property rights in content you create or upload. By submitting content, you represent that you have the right to do so and that it does not infringe the rights of any third party.

**Feedback:** Any feedback, suggestions, or ideas you provide to us regarding the platform may be used by us without restriction and without obligation to you.`,
  },
  {
    id: "acceptable-use",
    title: "8. Acceptable Use Policy",
    content: `You may not use SolidSeed for any purpose that violates these Terms or applicable law. Prohibited activities include, but are not limited to:

- Creating fake accounts or impersonating others
- Sending unsolicited communications (spam) through the platform
- Using the platform to facilitate fraud, identity theft, or any other illegal activity
- Uploading malware, viruses, or any code that could harm the platform or other users
- Attempting to access other users' accounts or data without authorization
- Using automated tools or bots to scrape, crawl, or extract data from the platform without our written permission
- Violating any third party's privacy or intellectual property rights

We reserve the right to suspend or terminate accounts that violate this policy, with or without prior notice.`,
  },
  {
    id: "third-party-services",
    title: "9. Third-Party Services and Integrations",
    content: `SolidSeed may integrate with or link to third-party services (e.g., Google, Microsoft). Your use of those services is governed by their own terms of service and privacy policies. We are not responsible for the actions, content, or policies of third-party services.

If you connect a third-party service to your SolidSeed account, you authorize us to interact with that service on your behalf as needed to provide the integration functionality.`,
  },
  {
    id: "termination",
    title: "10. Termination",
    content: `**By You:** You may terminate your account at any time by following the account deletion process in your settings. Upon termination, your access will cease and your data will be deleted in accordance with our Privacy Policy.

**By Us:** We may terminate or suspend your account if you violate these Terms, engage in conduct we deem harmful, or for any other reason with 30 days' prior notice (except in cases of serious violations, which may result in immediate termination).

**Effect of Termination:** Upon termination, all provisions of these Terms that should survive — including intellectual property, limitation of liability, indemnification, and dispute resolution — will continue to apply.`,
  },
  {
    id: "disclaimers",
    title: '11. Disclaimers and Limitation of Liability',
    content: `**No Warranties:** THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

**Limitation of Liability:** TO THE EXTENT PERMITTED BY APPLICABLE LAW, ${COMPANY.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.

**Essential Basis:** Some jurisdictions do not allow the exclusion or limitation of certain liabilities. To the extent such limitations are not permitted, our liability is limited to the minimum extent allowed by applicable law.`,
  },
  {
    id: "indemnification",
    title: "12. Indemnification",
    content: `You agree to indemnify, defend, and hold harmless ${COMPANY}, its officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorneys' fees) arising from or related to:

- Your use of the service in violation of these Terms
- Your Data or content that infringes the rights of a third party
- Any claim by a third party arising from your use of the service

This indemnification obligation does not apply to claims arising from our negligence or willful misconduct.`,
  },
  {
    id: "dispute-resolution",
    title: "13. Dispute Resolution",
    content: `**Governing Law:** These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles.

**Arbitration:** Any dispute arising out of or relating to these Terms or the service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in Delaware or via remote proceedings. This arbitration clause does not apply to claims that can be brought in small claims court or to injunctive relief claims.

**Class Action Waiver:** You agree to waive any right to participate in a class action or class-wide arbitration. Any dispute must be brought on an individual basis.

**Opt-Out:** You may opt out of the arbitration agreement by notifying us in writing within 30 days of first accepting these Terms. Your opt-out notice must include your name and account email.`,
  },
  {
    id: "general",
    title: "14. General Provisions",
    content: `**Entire Agreement:** These Terms, together with our Privacy Policy, constitute the entire agreement between you and ${COMPANY} regarding the service and supersede any prior agreements.

**Severability:** If any provision of these Terms is found unenforceable, the remaining provisions will continue in full force and effect.

**Waiver:** Our failure to enforce a provision of these Terms does not constitute a waiver of that provision or any future provision.

**Assignment:** You may not assign these Terms or any rights under them without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.

**Notices:** We may provide notices via email, in-app notifications, or by posting on the platform. You agree to receive communications electronically.

**No Third-Party Beneficiaries:** These Terms do not confer any benefits on any third party.`,
  },
  {
    id: "changes",
    title: "15. Changes to These Terms",
    content: `We may update these Terms from time to time. When we do, we will update the effective date above and notify you via email or an in-app notice if the changes are material. Your continued use of the service after the effective date of updated Terms constitutes your acceptance of the new Terms.

If you do not agree to the updated Terms, you must stop using the service and delete your account.`,
  },
  {
    id: "contact",
    title: "16. Contact Us",
    content: `If you have questions about these Terms or need legal assistance regarding your use of SolidSeed, contact us at:

**${COMPANY}**
Email: ${CONTACT_EMAIL}`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <LegalNav activePage="terms" />

      {/* Page Header */}
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <p className="text-sm text-muted-foreground mb-2">
            Effective as of {EFFECTIVE_DATE}
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            Terms of Service
          </h1>
          <p className="mt-3 text-muted-foreground">
            These Terms of Service govern your use of the SolidSeed CRM platform
            operated by {COMPANY}. Please read them carefully before using our
            service.
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
                These Terms are governed by the laws of the State of Delaware.
                If you have questions about your rights and obligations under
                this agreement, contact us at{" "}
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
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-foreground font-medium">Terms</span>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
