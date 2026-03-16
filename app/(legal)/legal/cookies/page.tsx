import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";
import { COOKIES_EFFECTIVE_DATE, COOKIES_VERSION } from "@/lib/legal/versions";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection, LegalSubSection, LegalList } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `Cookie Policy for ${APP_NAME}. Learn about the cookies we use and how to manage your preferences.`,
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      effectiveDate={COOKIES_EFFECTIVE_DATE}
      lastUpdated={COOKIES_EFFECTIVE_DATE}
    >
      <LegalSection title="1. What Are Cookies?">
        <p>
          Cookies are small text files placed on your device by websites you visit. They are
          widely used to make websites work, function more efficiently, and provide information
          to site owners.
        </p>
        <p>
          We also use similar technologies such as local storage and session storage where
          appropriate. This policy covers all such tracking technologies collectively referred to
          as &ldquo;cookies.&rdquo;
        </p>
        <p className="text-xs text-muted-foreground/70">Document version: {COOKIES_VERSION}</p>
      </LegalSection>

      <LegalSection title="2. Legal Basis for Using Cookies">
        <p>
          {APP_NAME} uses cookies in three categories, each with a distinct legal basis:
        </p>
        <LegalList
          items={[
            "Essential cookies: set on the basis of our legitimate interest and contractual necessity — they are strictly required for the Platform to function and do not require consent",
            "Analytics and advertising cookies: set only on the basis of your freely given, specific, informed, and unambiguous consent",
          ]}
        />
        <p className="mt-3">
          For users in the <strong>European Economic Area (EEA)</strong> and{" "}
          <strong>United Kingdom (UK)</strong>, our cookie consent practices comply with the
          EU ePrivacy Directive and the UK Privacy and Electronic Communications Regulations
          (PECR). Non-essential cookies are only activated after you explicitly consent through
          our consent banner. You may withdraw consent at any time.
        </p>
        <p>
          When you first visit the Platform, you will be presented with a consent banner where
          you can choose which non-essential categories to accept. You can change your
          preferences at any time using the &ldquo;Manage Cookie Preferences&rdquo; link in
          the footer.
        </p>
      </LegalSection>

      <LegalSection title="3. Category 1 — Essential Cookies">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-3">
          Always Active — No consent required
        </div>
        <p>
          Essential cookies are strictly necessary for the Platform to function. They cannot be
          disabled. Without these cookies, core features such as logging in, maintaining your
          session, and navigating between pages would not work.
        </p>
        <LegalSubSection title="What they do">
          <LegalList
            items={[
              "Session management — keeps you logged in as you navigate the Platform",
              "Authentication tokens — securely identifies your session to our servers",
              "Security cookies — helps detect and prevent fraudulent or unauthorized requests (CSRF protection)",
              "User preferences storage — stores your cookie consent choices in localStorage so we don't ask every visit",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="Legal basis">
          <p>
            Legitimate interests (Article 6(1)(f) GDPR for EEA/UK users) and contractual
            necessity (Article 6(1)(b) GDPR). These cookies are exempt from consent requirements
            under Recital 47 of the ePrivacy Directive and the UK PECR.
          </p>
        </LegalSubSection>
        <LegalSubSection title="Retention">
          <p>Session cookies are deleted when you close your browser. Persistent essential cookies expire after 7 days or your session expiry, whichever comes first.</p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="4. Category 2 — Analytics Cookies">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-3">
          Optional — Requires your consent
        </div>
        <p>
          Analytics cookies help us understand how users interact with the Platform. This data is
          used solely to improve the Platform experience &mdash; we do not share analytics data with
          advertising networks.
        </p>
        <LegalSubSection title="What they do">
          <LegalList
            items={[
              "Count page visits and track which features are most used",
              "Understand how users navigate through the Platform",
              "Identify and diagnose technical issues",
              "Measure the effectiveness of platform improvements",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="Legal basis">
          <p>
            Your consent (Article 6(1)(a) GDPR for EEA/UK users). You may withdraw consent at
            any time via the Manage Cookie Preferences link in the footer.
          </p>
        </LegalSubSection>
        <LegalSubSection title="Important notes">
          <LegalList
            items={[
              "Analytics are currently in development and not yet active",
              "When analytics are enabled, data is anonymized and aggregated wherever possible",
              "We will update this policy when specific analytics tools are implemented",
              "By consenting now, you help us enable these features seamlessly when ready — you will not need to re-consent",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="Retention">
          <p>Analytics cookies typically expire after 90 days.</p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="5. Category 3 — Advertising Cookies">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium mb-3">
          Optional — Requires your consent
        </div>
        <p>
          Advertising cookies support our planned first-party ad system, which will allow
          businesses in the film installation industry (such as product manufacturers, training
          programs, and distributors) to advertise to relevant members on the Platform.
        </p>
        <LegalSubSection title="What they will do">
          <LegalList
            items={[
              "Deliver advertising relevant to the film installation industry",
              "Limit how often you see the same advertisement",
              "Measure ad performance (impressions and clicks)",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="Legal basis">
          <p>
            Your consent (Article 6(1)(a) GDPR for EEA/UK users). Cookie-level advertising
            consent is separate from your account-level &ldquo;Do Not Sell or Share&rdquo;
            preference, which is managed in your{" "}
            <Link href="/dashboard/settings" className="text-foreground underline underline-offset-4 hover:no-underline">
              Account Settings
            </Link>
            .
          </p>
        </LegalSubSection>
        <LegalSubSection title="Important notes">
          <LegalList
            items={[
              "The advertising system is not yet live",
              "We use only first-party advertising — your data is never shared with or sold to external ad networks",
              "By consenting now, you help us enable this feature seamlessly when ready — you will not need to re-consent",
              "You can withdraw consent at any time using the Manage Cookie Preferences link in the footer",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="Retention">
          <p>Advertising cookies typically expire after 30 days.</p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="6. Managing Your Preferences">
        <p>You can manage your cookie preferences in several ways:</p>
        <LegalSubSection title="6.1 Platform Preference Center">
          <p>
            Use the <strong>&ldquo;Manage Cookie Preferences&rdquo;</strong> link in the footer of
            any page to open the cookie preference manager. Changes take effect immediately and are
            saved in your browser&apos;s localStorage.
          </p>
        </LegalSubSection>
        <LegalSubSection title="6.2 Browser Settings">
          <p>
            Most browsers allow you to refuse cookies through their settings. Note that disabling
            cookies through your browser settings may disable essential cookies and affect Platform
            functionality, including your ability to log in.
          </p>
        </LegalSubSection>
        <LegalSubSection title="6.3 Clearing Stored Preferences">
          <p>
            Clearing your browser&apos;s localStorage will remove your saved cookie preferences
            and you will be shown the consent banner again on your next visit.
          </p>
        </LegalSubSection>
        <LegalSubSection title="6.4 Withdrawing Consent (EEA and UK Users)">
          <p>
            EEA and UK users have the right to withdraw cookie consent at any time under the
            ePrivacy Directive and PECR. Withdrawing consent does not affect the lawfulness of
            processing based on consent before withdrawal. Use the Manage Cookie Preferences
            link or clear your localStorage to withdraw.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="7. Third-Party Cookies">
        <p>
          Currently, we do not load third-party scripts that set independent cookies. If this
          changes, this policy will be updated to list specific third-party providers, their
          purposes, links to their own privacy policies, and the relevant transfer safeguards
          for any cross-border data transfers.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to This Policy">
        <p>
          We will update this Cookie Policy when we add new cookies, introduce new technology, or
          when legal requirements change. The effective date at the top of this page reflects the
          most recent revision.
        </p>
        <p>
          For any material change that affects previously consented-to categories, we will
          re-display the consent banner to existing users. EEA and UK users will be asked for
          fresh consent where required under the ePrivacy Directive or PECR.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Questions about our cookie practices:</p>
        <div className="mt-3 p-4 rounded-lg bg-muted text-sm space-y-1">
          <p className="font-medium text-foreground">{APP_NAME}</p>
          <p>
            Email:{" "}
            <a
              href="mailto:privacy@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              privacy@filminstallers.com
            </a>
          </p>
          <p>Website: {APP_DOMAIN}</p>
        </div>
        <p className="mt-3">
          See also our full{" "}
          <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:no-underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-foreground underline underline-offset-4 hover:no-underline">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
