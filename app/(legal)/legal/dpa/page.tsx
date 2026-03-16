import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";
import { DPA_EFFECTIVE_DATE, DPA_VERSION } from "@/lib/legal/versions";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import { LegalSection, LegalSubSection, LegalList } from "@/components/legal/legal-section";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description: `Data Processing Agreement (DPA) for employer accounts on ${APP_NAME}. Required for EU/UK GDPR compliance.`,
};

export default function DpaPage() {
  return (
    <LegalPageLayout
      title="Data Processing Agreement"
      effectiveDate={DPA_EFFECTIVE_DATE}
      lastUpdated={DPA_EFFECTIVE_DATE}
    >
      <LegalSection title="1. About This Agreement">
        <p>
          This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the{" "}
          <Link href="/terms" className="text-foreground underline underline-offset-4 hover:no-underline">
            Terms of Service
          </Link>{" "}
          between <strong>{APP_NAME}</strong> (&ldquo;Processor&rdquo;) and employer accounts
          that use the Platform (&ldquo;Controller&rdquo;). It sets out the terms on which{" "}
          {APP_NAME} processes personal data on behalf of employers as required under the General
          Data Protection Regulation (&ldquo;GDPR&rdquo;) and the UK GDPR.
        </p>
        <p>
          This DPA is <strong>relevant to employer accounts</strong> that are established in the
          European Economic Area (EEA) or United Kingdom, or that access and process personal
          data of EEA/UK residents via the Platform. If neither of these applies to you, this DPA
          is provided for reference only and does not impose additional obligations.
        </p>
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border text-sm space-y-1">
          <p><strong className="text-foreground">Processor:</strong> {APP_NAME} (&ldquo;Film Installers&rdquo;), operating at {APP_DOMAIN}</p>
          <p><strong className="text-foreground">Controller:</strong> The employer account holder who accepts the Terms of Service</p>
          <p><strong className="text-foreground">DPA Version:</strong> {DPA_VERSION}</p>
          <p><strong className="text-foreground">Effective Date:</strong> {DPA_EFFECTIVE_DATE}</p>
        </div>
        <p className="text-xs text-muted-foreground/70">Document version: {DPA_VERSION}</p>
      </LegalSection>

      <LegalSection title="2. Definitions">
        <p>
          In this DPA, the following terms have the meanings given below. Other capitalized terms
          not defined here have the meanings given in the GDPR or in the Terms of Service.
        </p>
        <LegalList
          items={[
            "\"Personal Data\" — any information relating to an identified or identifiable natural person, as defined in Article 4(1) GDPR",
            "\"Processing\" — any operation performed on Personal Data, including collection, storage, retrieval, disclosure, or erasure",
            "\"Data Subject\" — the identified or identifiable natural person to whom Personal Data relates (in this context, primarily installer profile holders)",
            "\"Sub-processor\" — any third party engaged by the Processor to process Personal Data on behalf of the Controller",
            "\"GDPR\" — the General Data Protection Regulation (EU) 2016/679 and, where applicable, UK GDPR as retained in UK law",
            "\"Supervisory Authority\" — the relevant national data protection authority (e.g. the ICO in the UK, or the applicable EU member state DPA)",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Subject Matter and Purpose of Processing">
        <LegalSubSection title="3.1 Nature and Purpose">
          <p>
            {APP_NAME} processes Personal Data as a Processor on behalf of employer accounts
            solely to provide the Platform services described in the Terms of Service, which
            include:
          </p>
          <LegalList
            items={[
              "Displaying installer profiles to authenticated employer accounts",
              "Facilitating job postings and employer-to-installer connections",
              "Storing employer account data and preferences",
              "Providing account management and security functionality",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="3.2 Categories of Personal Data">
          <p>
            The Personal Data processed includes installer profile information made available on
            the Platform:
          </p>
          <LegalList
            items={[
              "Identity data: first name, last name",
              "Contact data: city, state/province, phone number (if provided)",
              "Professional data: years of experience, service types, work history, experience level",
              "Account metadata: member since date, profile visibility status",
            ]}
          />
        </LegalSubSection>
        <LegalSubSection title="3.3 Categories of Data Subjects">
          <p>
            The Data Subjects are installer account holders who have created profiles on the
            Platform and whose profiles are visible to authenticated employer accounts.
          </p>
        </LegalSubSection>
        <LegalSubSection title="3.4 Duration">
          <p>
            Processing continues for the duration of the employer account&apos;s active
            subscription or access to the Platform, or until this DPA is terminated in
            accordance with Section 10.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="4. Obligations of the Processor">
        <p>
          As Processor, {APP_NAME} agrees to the following obligations in respect of Personal
          Data processed on behalf of the Controller:
        </p>
        <LegalSubSection title="4.1 Instructions">
          <p>
            Process Personal Data only on documented instructions from the Controller (as set
            out in the Terms of Service and this DPA), unless required to do so by applicable
            law. If required by law to process beyond these instructions, {APP_NAME} will inform
            the Controller unless prohibited by law.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.2 Confidentiality">
          <p>
            Ensure that authorized personnel who process Personal Data are subject to
            appropriate confidentiality obligations.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.3 Security">
          <p>
            Implement and maintain appropriate technical and organizational measures to protect
            Personal Data against unauthorized access, disclosure, alteration, or destruction,
            including the measures described in Section 6 below and in the{" "}
            <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:no-underline">
              Privacy Policy
            </Link>
            .
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.4 Sub-processors">
          <p>
            Not engage sub-processors without informing the Controller. Current sub-processors
            are listed in Section 7. {APP_NAME} will provide reasonable notice (not less than
            30 days) before engaging new sub-processors. The Controller may object on reasonable
            grounds within that period.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.5 Data Subject Rights">
          <p>
            Assist the Controller in fulfilling obligations to respond to Data Subject rights
            requests (access, rectification, erasure, portability, restriction, objection) where
            technically feasible, taking into account the nature of processing. Data Subjects may
            exercise most rights directly through their account settings.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.6 Data Protection Impact Assessments">
          <p>
            Provide reasonable assistance to the Controller in conducting data protection impact
            assessments (DPIAs) required under Article 35 GDPR where the processing carried out
            by {APP_NAME} is relevant to such assessment.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.7 Breach Notification">
          <p>
            Notify the Controller without undue delay (and in any event within 72 hours) of
            becoming aware of a Personal Data breach affecting the Controller&apos;s data,
            providing sufficient information to enable the Controller to meet its own notification
            obligations.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.8 Deletion or Return">
          <p>
            At the end of the provision of services, at the Controller&apos;s option, delete or
            return all Personal Data and delete existing copies unless applicable law requires
            retention.
          </p>
        </LegalSubSection>
        <LegalSubSection title="4.9 Audit Rights">
          <p>
            Make available to the Controller all information necessary to demonstrate compliance
            with the obligations in this DPA, and allow for and contribute to audits or
            inspections conducted by the Controller or a third-party auditor mandated by the
            Controller, subject to reasonable prior notice and confidentiality protections.
          </p>
        </LegalSubSection>
      </LegalSection>

      <LegalSection title="5. Obligations of the Controller">
        <p>
          As Controller, the employer account holder agrees to:
        </p>
        <LegalList
          items={[
            "Ensure that Personal Data accessed through the Platform is used only for legitimate recruitment and employment-related purposes",
            "Not download, export, or compile installer profile data for purposes other than direct recruitment on the Platform",
            "Comply with applicable data protection law in respect of Personal Data obtained via the Platform, including maintaining a lawful basis for any further processing",
            "Ensure that any Data Subject rights requests received directly by the Controller relating to installer profile data are forwarded to privacy@filminstallers.com without undue delay",
            "Not share installer Personal Data obtained via the Platform with third parties except as required for a specific hiring transaction",
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Security Measures">
        <p>
          {APP_NAME} implements the following technical and organizational security measures:
        </p>
        <LegalList
          items={[
            "All data transmitted between users and the Platform is encrypted using TLS 1.2 or higher",
            "Passwords stored as bcrypt hashes; no plaintext credential storage",
            "Row-level security policies on all database tables ensuring users can only access their own data",
            "Role-based access controls limiting staff access to user data",
            "Database hosted on Supabase infrastructure with SOC 2 Type II certification",
            "Regular security reviews and dependency updates",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Sub-processors">
        <p>
          {APP_NAME} currently uses the following sub-processors to provide the Platform
          services. All sub-processors are bound by data processing agreements incorporating
          GDPR-compliant terms.
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left p-3 font-medium text-foreground">Sub-processor</th>
                <th className="text-left p-3 font-medium text-foreground">Purpose</th>
                <th className="text-left p-3 font-medium text-foreground">Location</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3">Supabase, Inc.</td>
                <td className="p-3">Database, authentication, and API infrastructure</td>
                <td className="p-3">United States</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3">Resend (or equivalent)</td>
                <td className="p-3">Transactional email delivery</td>
                <td className="p-3">United States</td>
              </tr>
              <tr>
                <td className="p-3">Netlify / Vercel (or equivalent)</td>
                <td className="p-3">Application hosting and CDN</td>
                <td className="p-3">United States / Global CDN</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          For transfers to sub-processors outside the EEA/UK, {APP_NAME} relies on Standard
          Contractual Clauses (SCCs) or UK International Data Transfer Agreements (IDTAs) as
          the transfer mechanism.
        </p>
      </LegalSection>

      <LegalSection title="8. International Data Transfers">
        <p>
          Personal Data processed under this DPA may be transferred to and processed in the
          United States. {APP_NAME} ensures that all such transfers comply with GDPR Chapter V
          through the following mechanisms:
        </p>
        <LegalList
          items={[
            "Standard Contractual Clauses (SCCs) — EU Commission Decision 2021/914 for EEA-to-US transfers",
            "UK International Data Transfer Agreements (IDTAs) for UK-to-US transfers",
            "Adequacy decisions where applicable and available",
          ]}
        />
        <p className="mt-3">
          Copies of applicable transfer documentation are available upon request to{" "}
          <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
            privacy@filminstallers.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Data Subject Rights Support">
        <p>
          Data Subjects (installer profile holders) may exercise their GDPR rights directly
          through their account settings:
        </p>
        <LegalList
          items={[
            "Right of Access / Data Portability: Data Export feature in Account Settings",
            "Right to Rectification: Profile editing available in the Dashboard",
            "Right to Erasure: Account Deletion feature in Account Settings (processed within 30 days)",
            "Right to Object to targeted advertising: Advertising Preferences in Account Settings",
          ]}
        />
        <p className="mt-3">
          For rights requests that cannot be fulfilled through self-service, Data Subjects or
          Controllers may contact{" "}
          <a href="mailto:privacy@filminstallers.com" className="text-foreground underline underline-offset-4 hover:no-underline">
            privacy@filminstallers.com
          </a>
          . We respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection title="10. Term and Termination">
        <p>
          This DPA is effective from the date the employer account accepts the Terms of Service
          and remains in effect for as long as the employer account has access to the Platform.
        </p>
        <p>
          On termination of the employer account or the Terms of Service, {APP_NAME} will, at
          the Controller&apos;s written request, delete all Personal Data processed under this
          DPA within 90 days, unless retention is required by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="11. Liability">
        <p>
          Each party is liable for damages caused by processing that violates the GDPR to the
          extent that party is responsible for the damage. The liability limitations in the Terms
          of Service apply to this DPA to the maximum extent permitted by applicable law, subject
          to any rights that cannot be excluded under GDPR or applicable consumer protection law.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact and DPA Acceptance">
        <p>
          If you are an employer account requiring formal DPA acceptance for your GDPR compliance
          records, please contact us to request a countersigned DPA:
        </p>
        <div className="mt-3 p-4 rounded-lg bg-muted text-sm space-y-1">
          <p className="font-medium text-foreground">{APP_NAME} &mdash; Legal / Privacy Team</p>
          <p>
            Email:{" "}
            <a
              href="mailto:legal@filminstallers.com"
              className="text-foreground underline underline-offset-4 hover:no-underline"
            >
              legal@filminstallers.com
            </a>
          </p>
          <p>
            Privacy:{" "}
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
          See also our{" "}
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
