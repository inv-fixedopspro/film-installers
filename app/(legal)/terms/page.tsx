import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";
import { TERMS_EFFECTIVE_DATE, TERMS_VERSION } from "@/lib/legal/versions";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection, LegalSubSection, LegalList } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${APP_NAME}. Read before using the platform.`,
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      effectiveDate={TERMS_EFFECTIVE_DATE}
      lastUpdated={TERMS_EFFECTIVE_DATE}
    >
      <LegalSection title="1. Agreement to Terms">
        <p>
          By accessing or using {APP_NAME} (the &ldquo;Platform&rdquo;), available at{" "}
          <strong>{APP_DOMAIN}</strong>, you agree to be bound by these Terms of Service
          (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms, you may not use the
          Platform.
        </p>
        <p>
          These Terms apply to all visitors, registered users, employers, installers, and any other
          person who accesses or uses the Platform.
        </p>
        <p className="text-xs text-muted-foreground/70">Document version: {TERMS_VERSION}</p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least <strong>18 years of age</strong> to create an account or use the
          Platform. By registering, you represent and warrant that you are 18 or older.
        </p>
        <p>
          The Platform is primarily intended for use by residents and businesses located in the{" "}
          <strong>United States and Canada</strong>. We are in the process of expanding to support
          users in the European Economic Area (EEA) and United Kingdom. If you access the Platform
          from outside these jurisdictions, you do so at your own risk and are responsible for
          ensuring compliance with applicable local laws. Nothing in these Terms limits our ability
          to provide services to users in other jurisdictions.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts">
        <LegalSubSection title="3.1 Registration">
          <p>
            You must provide accurate and complete information when creating an account. You are
            responsible for maintaining the confidentiality of your login credentials and for all
            activity that occurs under your account.
          </p>
        </LegalSubSection>
        <LegalSubSection title="3.2 One Account Per Person">
          <p>
            Each person may maintain only one active account on the Platform. Creating multiple
            accounts to circumvent a ban, restriction, or any Platform policy is strictly
            prohibited.
          </p>
        </LegalSubSection>
        <LegalSubSection title="3.3 Account Security">
          <p>
            You agree to notify us immediately at{" "}
            <a
              href="mailto:support@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              support@filminstallers.com
            </a>{" "}
            if you suspect any unauthorized use of your account. We are not liable for any loss
            resulting from unauthorized account access.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <p>You agree not to use the Platform to:</p>
        <LegalList
          items={[
            "Post false, misleading, or fraudulent job listings, profiles, or content",
            "Harass, threaten, or abuse other users",
            "Distribute spam, unsolicited commercial messages, or malware",
            "Collect or harvest personal information from other users without consent",
            "Attempt to gain unauthorized access to any part of the Platform or its infrastructure",
            "Violate any applicable federal, state, provincial, or local laws or regulations",
            "Impersonate another person or entity",
            "Post content that is defamatory, obscene, or infringes on the intellectual property rights of others",
            "Use automated tools, bots, or scrapers to access the Platform without prior written consent",
          ]}
        />
        <p className="mt-3">
          We reserve the right to investigate and take appropriate legal action against anyone who,
          in our sole discretion, violates these provisions.
        </p>
      </LegalSection>

      <LegalSection title="5. Content Ownership and Licenses">
        <LegalSubSection title="5.1 Your Content">
          <p>
            You retain ownership of all content you submit, post, or display on the Platform
            (&ldquo;User Content&rdquo;). By submitting User Content, you grant {APP_NAME} a
            non-exclusive, royalty-free, worldwide license to use, display, reproduce, and
            distribute your content solely for the purpose of operating and improving the Platform.
          </p>
        </LegalSubSection>
        <LegalSubSection title="5.2 Platform Content">
          <p>
            All other content on the Platform &mdash; including software, text, graphics, logos, and
            design &mdash; is the property of {APP_NAME} or its licensors and is protected by applicable
            intellectual property laws. You may not reproduce, distribute, or create derivative
            works without our prior written consent.
          </p>
        </LegalSubSection>
        <LegalSubSection title="5.3 Content Standards">
          <p>
            You are solely responsible for the accuracy and legality of your User Content. We do
            not endorse any User Content and reserve the right to remove content that violates
            these Terms or our Community Guidelines at any time without notice.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="6. Jobs and Employment">
        <p>
          {APP_NAME} is a job board and professional network. We do not act as an employer,
          staffing agency, or employment intermediary. We are not a party to any employment
          agreement formed between employers and installers on the Platform.
        </p>
        <p>
          Employers are solely responsible for verifying installer credentials, conducting
          background checks, and ensuring their hiring practices comply with applicable employment
          laws. Installers are responsible for the accuracy of their resumes, work history, and
          certifications.
        </p>
      </LegalSection>

      <LegalSection title="7. Account Termination">
        <LegalSubSection title="7.1 By You">
          <p>
            You may close your account at any time by contacting us at{" "}
            <a
              href="mailto:support@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              support@filminstallers.com
            </a>
            . Account closure requests are processed within 30 days.
          </p>
        </LegalSubSection>
        <LegalSubSection title="7.2 By Us">
          <p>
            We reserve the right to suspend or permanently ban any account, at our sole
            discretion, with or without notice, for any violation of these Terms or for conduct
            that we determine to be harmful to the Platform, other users, or the public.
          </p>
          <p>
            Banned users may appeal by contacting{" "}
            <a
              href="mailto:support@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              support@filminstallers.com
            </a>
            . Appeals are reviewed on a case-by-case basis and are not guaranteed to result in
            reinstatement.
          </p>
        </LegalSubSection>
        <LegalSubSection title="7.3 Effect of Termination">
          <p>
            Upon account termination, your right to access the Platform ceases immediately. We may
            retain certain data as required by law or for legitimate business purposes. See our{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:no-underline">
              Privacy Policy
            </Link>{" "}
            for details on data retention.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="8. Disclaimer of Warranties">
        <p>
          THE PLATFORM IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS
          WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT
          PERMITTED BY LAW, {APP_NAME.toUpperCase()} DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT
          LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT.
        </p>
        <p>
          We do not warrant that the Platform will be uninterrupted, error-free, or free of
          viruses or other harmful components. You use the Platform at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of Liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {APP_NAME.toUpperCase()} AND ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO
          YOUR USE OF THE PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE GREATER OF (A)
          THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED
          DOLLARS ($100 USD).
        </p>
        <p>
          Nothing in these Terms excludes or limits liability that cannot be excluded or limited
          under applicable law, including consumer protection rights available to residents of the
          European Economic Area or United Kingdom.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing Law and Jurisdiction">
        <LegalSubSection title="10.1 United States and Canada">
          <p>
            For users located in the United States or Canada, these Terms shall be governed by
            and construed in accordance with the laws of the{" "}
            <strong>United States</strong>, without regard to conflict of law provisions. For
            Canadian users, applicable Canadian federal and provincial laws also apply.
          </p>
        </LegalSubSection>
        <LegalSubSection title="10.2 European Economic Area">
          <p>
            For users located in the European Economic Area, these Terms are governed by US law
            to the extent permitted, but nothing in these Terms affects your rights under the
            mandatory consumer protection laws of your country of residence. You may bring claims
            in the courts of your country of residence.
          </p>
        </LegalSubSection>
        <LegalSubSection title="10.3 United Kingdom">
          <p>
            For users located in the United Kingdom, nothing in these Terms affects your
            statutory rights as a consumer under UK law. Any dispute not resolved informally may
            be brought before the courts of England and Wales, or at your option, the courts of
            your country of residence within the UK.
          </p>
        </LegalSubSection>
        <LegalSubSection title="10.4 Dispute Resolution">
          <p>
            Any dispute arising out of or relating to these Terms shall first be submitted to
            informal negotiation by contacting us at{" "}
            <a
              href="mailto:legal@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              legal@filminstallers.com
            </a>
            .
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="11. Changes to These Terms">
        <p>
          We may update these Terms from time to time. When we make material changes, we will
          update the effective date at the top of this page and, where appropriate, notify
          registered users via email or in-platform notification.
        </p>
        <p>
          Your continued use of the Platform after any changes constitutes your acceptance of the
          updated Terms. If you do not agree to the revised Terms, you must stop using the
          Platform.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>If you have questions about these Terms, please contact us:</p>
        <div className="mt-3 p-4 rounded-lg bg-muted text-sm space-y-1">
          <p className="font-medium text-foreground">{APP_NAME}</p>
          <p>
            Email:{" "}
            <a
              href="mailto:legal@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              legal@filminstallers.com
            </a>
          </p>
          <p>Website: {APP_DOMAIN}</p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
}
