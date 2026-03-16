import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";
import { PRIVACY_EFFECTIVE_DATE, PRIVACY_VERSION } from "@/lib/legal/versions";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection, LegalSubSection, LegalList } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${APP_NAME}. Learn how we collect, use, and protect your personal data.`,
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      lastUpdated={PRIVACY_EFFECTIVE_DATE}
    >
      <LegalSection title="1. Introduction">
        <p>
          {APP_NAME} (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the
          platform available at <strong>{APP_DOMAIN}</strong>. This Privacy Policy explains how
          we collect, use, share, and protect your personal information when you use our Platform.
        </p>
        <p>
          We currently serve users primarily in the <strong>United States and Canada</strong>, and
          we are preparing for international expansion. This Policy is written to comply with
          applicable US state privacy laws including the California Consumer Privacy Act (CCPA),
          Canadian federal privacy law (PIPEDA), and the General Data Protection Regulation (GDPR)
          as it applies to users in the European Economic Area (EEA) and the United Kingdom
          (UK GDPR).
        </p>
        <p>
          If you are located in the EEA or UK, Section 8 of this Policy sets out your specific
          rights and the legal bases on which we process your data.
        </p>
        <p className="text-xs text-muted-foreground/70">Document version: {PRIVACY_VERSION}</p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <LegalSubSection title="2.1 Information You Provide">
          <LegalList
            items={[
              "Account information: email address, password (stored as a hashed value — never in plain text)",
              "Profile information: name, city/state, phone number, years of experience, services offered, work history, profile photo",
              "Employer information: company name, company size, services offered, company website",
              "Communications: messages sent to our support team",
              "Consent records: timestamped log of your agreement to our Terms, Privacy Policy, and cookie preferences at registration",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="2.2 Information Collected Automatically">
          <LegalList
            items={[
              "Log data: IP address, browser type and version, pages visited, referring URL, time and date of visits",
              "Device information: device type, operating system",
              "Approximate country location: derived from your IP address at login to serve region-appropriate privacy notices — we do not store precise geolocation",
              "Cookie and tracking data: session identifiers and, where consented, analytics identifiers — see our Cookie Policy for details",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="2.3 Information We Do Not Collect">
          <p>We do not collect:</p>
          <LegalList
            items={[
              "Government-issued identification numbers (Social Security, Social Insurance, driver's license)",
              "Financial or payment card information",
              "Precise geolocation data beyond city/state provided by you",
              "Sensitive personal information such as health data, biometric data, or racial/ethnic origin",
            ]}
          />
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <p>We use collected information for the following purposes:</p>
        <LegalList
          items={[
            "To create and manage your account",
            "To display your installer or employer profile to other Platform users",
            "To match employers with installers based on location, skills, and preferences",
            "To send transactional emails such as email verification, password resets, and important account notices",
            "To enforce our Terms of Service, investigate abuse, and maintain Platform security",
            "To analyze Platform usage and improve our features (analytics cookies, where consented)",
            "To maintain legal compliance and fulfill our obligations under applicable law",
            "To serve first-party advertising relevant to the film installation industry (advertising cookies, where consented, and only when this feature is live)",
            "To detect your approximate region so we can present region-specific legal notices and consent flows where required",
          ]}
        />
        <p className="mt-3">
          We do not sell your personal information to third parties. We do not share your personal
          information with advertisers for their own independent use.
        </p>
      </LegalSection>

      <LegalSection title="4. Legal Bases for Processing (EEA and UK Users)">
        <p>
          If you are located in the European Economic Area or the United Kingdom, we process your
          personal data on the following legal bases under GDPR and UK GDPR:
        </p>
        <LegalSubSection title="4.1 Contract Performance (Article 6(1)(b) GDPR)">
          <p>
            We process your account information, profile data, and transactional communications
            because it is necessary to perform the contract between you and {APP_NAME} &mdash; i.e.,
            to provide you with the Platform services you signed up for.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.2 Consent (Article 6(1)(a) GDPR)">
          <p>
            We process data related to non-essential cookies (analytics and advertising) and
            targeted advertising preferences on the basis of your freely given, specific, informed,
            and unambiguous consent. You may withdraw your consent at any time through the
            Advertising Preferences section of your account settings or the Manage Cookie
            Preferences link in the footer.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.3 Legitimate Interests (Article 6(1)(f) GDPR)">
          <p>
            We process log data, IP addresses, and security-related information on the basis of
            our legitimate interests in maintaining the security, integrity, and performance of the
            Platform. We have assessed that these interests are not overridden by your rights and
            freedoms.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.4 Legal Obligation (Article 6(1)(c) GDPR)">
          <p>
            We retain consent logs and certain compliance records to fulfill our legal obligations
            under applicable data protection law.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="5. How We Share Your Information">
        <LegalSubSection title="5.1 Other Platform Users">
          <p>
            Your public profile information (name, location, services, experience, work history)
            is visible to registered members of the Platform. You control what information appears
            on your profile.
          </p>
        </LegalSubSection>
        <LegalSubSection title="5.2 Service Providers">
          <p>
            We share information with trusted third-party providers who help us operate the
            Platform, including:
          </p>
          <LegalList
            items={[
              "Supabase (database and authentication infrastructure — hosted in the United States)",
              "Resend or similar (transactional email delivery)",
              "Analytics providers (where you have consented to analytics cookies)",
            ]}
          />
          <p className="mt-2">
            These providers process data only on our behalf and under appropriate data processing
            agreements. Where data is transferred outside the EEA or UK, we rely on Standard
            Contractual Clauses (SCCs) or other GDPR-compliant transfer mechanisms.
          </p>
        </LegalSubSection>
        <LegalSubSection title="5.3 Employer Accounts and GDPR">
          <p>
            Employer accounts that access installer profile data in the context of their own EU/UK
            business operations may be acting as independent data controllers under GDPR. We
            provide a{" "}
            <Link href="/legal/dpa" className="text-foreground underline underline-offset-4 hover:no-underline">
              Data Processing Agreement (DPA)
            </Link>{" "}
            for employer accounts that require one for GDPR compliance.
          </p>
        </LegalSubSection>
        <LegalSubSection title="5.4 Legal Requirements">
          <p>
            We may disclose your information if required by law, court order, or governmental
            authority, or if we reasonably believe disclosure is necessary to protect the rights,
            property, or safety of {APP_NAME}, our users, or the public.
          </p>
        </LegalSubSection>
        <LegalSubSection title="5.5 Business Transfers">
          <p>
            If {APP_NAME} is acquired, merged, or undergoes a change of ownership, your
            information may be transferred as part of that transaction. We will provide notice
            before your information becomes subject to a materially different privacy policy.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>We retain your personal information for as long as your account is active or as needed to provide services.</p>
        <LegalList
          items={[
            "Account data: retained for the life of your account, then deleted within 90 days of a confirmed deletion request",
            "Consent logs and DPA records: retained for 7 years for legal compliance purposes, even after account deletion",
            "Log and IP data: retained for up to 12 months",
            "Moderation and flag records: retained for up to 5 years for safety and abuse prevention purposes",
            "Anonymized ad impression and click data: retained indefinitely as it contains no personal data",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Your Rights — United States (CCPA) and Canada (PIPEDA)">
        <LegalSubSection title="7.1 California Residents — CCPA Rights">
          <p>
            If you are a California resident, you have the following rights under the California
            Consumer Privacy Act (CCPA): the right to know what personal information we collect
            and how it is used; the right to request deletion; the right to opt out of the sale
            of personal information (we do not sell your data); and the right to
            non-discrimination for exercising your rights.
          </p>
          <p className="mt-2">
            To exercise your CCPA rights, contact{" "}
            <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
              privacy@filminstallers.com
            </a>
            . We will respond within 45 days.
          </p>
        </LegalSubSection>
        <LegalSubSection title="7.2 Canadian Residents — PIPEDA Rights">
          <p>
            If you are a Canadian resident, you have the right to know why your personal
            information is collected and used; the right to access your data; the right to
            challenge its accuracy and request corrections; and the right to withdraw consent at
            any time. You may also complain to the Office of the Privacy Commissioner of Canada
            (OPC).
          </p>
          <p className="mt-2">
            To exercise your PIPEDA rights, contact{" "}
            <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
              privacy@filminstallers.com
            </a>
            .
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="8. Your Rights — European Economic Area and United Kingdom (GDPR)">
        <p>
          If you are located in the EEA or the United Kingdom, you have the following rights
          under the General Data Protection Regulation (GDPR) and UK GDPR. These rights are
          already technically implemented through our Platform &mdash; see below for how to exercise
          each one.
        </p>
        <LegalSubSection title="8.1 Right of Access (Article 15 GDPR)">
          <p>
            You have the right to obtain a copy of all personal data we hold about you, along
            with information about how it is processed. Use the <strong>Data Export</strong>{" "}
            feature in your account settings to download your data at any time, or email us for
            a full structured export.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.2 Right to Rectification (Article 16 GDPR)">
          <p>
            You have the right to have inaccurate personal data corrected. You can update your
            profile information directly from your dashboard at any time.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.3 Right to Erasure / Right to Be Forgotten (Article 17 GDPR)">
          <p>
            You have the right to request deletion of your personal data where it is no longer
            necessary for the purposes for which it was collected, or where you withdraw consent
            and no other legal basis applies. Use the <strong>Account Deletion</strong> feature
            in your account settings to submit a deletion request, which is processed within 30
            days. Note that some data (such as consent logs) is retained for legal compliance
            purposes even after deletion.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.4 Right to Restriction of Processing (Article 18 GDPR)">
          <p>
            You have the right to request that we restrict processing of your personal data in
            certain circumstances &mdash; for example, while we verify the accuracy of your data or
            assess an objection you have raised. Contact us at{" "}
            <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
              privacy@filminstallers.com
            </a>{" "}
            to submit a restriction request.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.5 Right to Data Portability (Article 20 GDPR)">
          <p>
            Where processing is based on your consent or on a contract, you have the right to
            receive your personal data in a structured, commonly used, machine-readable format
            (JSON). Use the <strong>Data Export</strong> feature in your account settings.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.6 Right to Object (Article 21 GDPR)">
          <p>
            You have the right to object to processing based on legitimate interests or for
            direct marketing purposes. To object to targeted advertising, use the{" "}
            <strong>Advertising Preferences</strong> section in your account settings. To raise
            other objections, contact us at{" "}
            <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
              privacy@filminstallers.com
            </a>
            .
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.7 Right to Withdraw Consent (Article 7(3) GDPR)">
          <p>
            Where processing is based on your consent, you have the right to withdraw that
            consent at any time without affecting the lawfulness of processing carried out before
            withdrawal. Cookie consent can be withdrawn via the Manage Cookie Preferences link
            in the footer. Advertising preferences can be changed in your account settings.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.8 Right to Lodge a Complaint">
          <p>
            You have the right to lodge a complaint with your local supervisory authority. In
            the UK, this is the{" "}
            <strong>Information Commissioner&apos;s Office (ICO)</strong>{" "}
            at{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              ico.org.uk
            </a>
            . EEA residents may contact their national data protection authority &mdash; a full list
            is available at{" "}
            <a
              href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              edpb.europa.eu
            </a>
            .
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.9 Response Timeframes">
          <p>
            We will respond to GDPR rights requests within <strong>30 days</strong>. Where a
            request is complex or we receive a high volume, we may extend this by a further two
            months, in which case we will notify you within the initial 30-day period.
          </p>
        </LegalSubSection>
        <LegalSubSection title="8.10 Data Controller">
          <p>
            {APP_NAME} is the data controller for personal data processed on this Platform. Our
            contact details are in Section 14 below. We do not currently have a formal EU/UK
            representative under Article 27 GDPR as we are in pre-expansion phase, but we will
            appoint one before actively marketing to EEA/UK residents.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="9. International Data Transfers">
        <p>
          Our Platform infrastructure is hosted in the United States (via Supabase). If you are
          located in the EEA or UK, your personal data will be transferred to and processed in
          the US. We rely on the following safeguards for these transfers:
        </p>
        <LegalList
          items={[
            "Standard Contractual Clauses (SCCs) approved by the European Commission and UK ICO, incorporated into our data processing agreements with sub-processors",
            "The UK International Data Transfer Agreement (IDTA) where applicable for UK-to-US transfers",
            "Where available, adequacy decisions adopted by the European Commission or UK Secretary of State",
          ]}
        />
        <p className="mt-3">
          You may request a copy of the relevant transfer safeguards by contacting us at{" "}
          <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
            privacy@filminstallers.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Cookies and Tracking">
        <p>
          We use cookies and similar technologies on our Platform. For full details on what cookies
          we use and how to manage your preferences, see our{" "}
          <Link href="/legal/cookies" className="text-foreground underline underline-offset-4 hover:no-underline">
            Cookie Policy
          </Link>
          .
        </p>
        <p>
          EEA and UK users: non-essential cookies are only set after you give explicit consent
          through our cookie banner, in compliance with the ePrivacy Directive and the UK Privacy
          and Electronic Communications Regulations (PECR). You can manage your cookie preferences
          at any time using the &ldquo;Manage Cookie Preferences&rdquo; link in the footer.
        </p>
      </LegalSection>

      <LegalSection title="11. Data Security">
        <p>
          We implement industry-standard security measures to protect your personal information,
          including:
        </p>
        <LegalList
          items={[
            "Passwords stored as bcrypt hashes — never in plain text",
            "Data encrypted in transit using TLS/HTTPS",
            "Row-level security policies on all database tables",
            "Access controls limiting which staff can access user data",
          ]}
        />
        <p className="mt-3">
          No method of transmission over the internet is 100% secure. While we strive to use
          commercially acceptable means to protect your personal information, we cannot guarantee
          absolute security.
        </p>
        <p>
          In the event of a personal data breach that is likely to result in a risk to your rights
          and freedoms, we will notify you and applicable supervisory authorities as required by
          GDPR (within 72 hours of becoming aware of the breach).
        </p>
      </LegalSection>

      <LegalSection title="12. Children&apos;s Privacy">
        <p>
          The Platform is intended for users who are 18 years of age or older. We do not
          knowingly collect personal information from individuals under 18. If you believe we have
          inadvertently collected such information, please contact us immediately at{" "}
          <a
            href="mailto:privacy@filminstallers.com"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            privacy@filminstallers.com
          </a>{" "}
          and we will delete it promptly.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to This Policy">
        <p>
          We may update this Privacy Policy periodically. When we make material changes, we will
          update the effective date and, where appropriate, notify you via email or in-platform
          notice. For EEA and UK users, where a change affects the legal basis for processing or
          your rights in a material way, we will seek fresh consent where required.
        </p>
        <p>
          Your continued use of the Platform after any changes constitutes acceptance of the
          updated policy (except where re-consent is required).
        </p>
      </LegalSection>

      <LegalSection title="14. Contact & Data Requests">
        <p>For all privacy-related questions, access requests, or deletion requests:</p>
        <div className="mt-3 p-4 rounded-lg bg-muted text-sm space-y-1">
          <p className="font-medium text-foreground">{APP_NAME} &mdash; Privacy Team</p>
          <p>
            Email:{" "}
            <a
              href="mailto:privacy@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              privacy@filminstallers.com
            </a>
          </p>
          <p>
            General:{" "}
            <a
              href="mailto:legal@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              legal@filminstallers.com
            </a>
          </p>
          <p>Website: {APP_DOMAIN}</p>
        </div>
        <p className="mt-3">
          For employer accounts requiring a Data Processing Agreement, see our{" "}
          <Link href="/legal/dpa" className="text-foreground underline underline-offset-4 hover:no-underline">
            DPA page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
