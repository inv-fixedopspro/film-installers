import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, Cookie, ChevronRight, FileCheck } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { TERMS_EFFECTIVE_DATE, PRIVACY_EFFECTIVE_DATE, COOKIES_EFFECTIVE_DATE, DPA_EFFECTIVE_DATE } from "@/lib/legal/versions";

export const metadata: Metadata = {
  title: "Legal",
  description: `Legal documents for ${APP_NAME} including Terms of Service, Privacy Policy, Cookie Policy, and Data Processing Agreement.`,
};

const LEGAL_DOCUMENTS = [
  {
    href: "/terms",
    icon: FileText,
    title: "Terms of Service",
    description:
      "The rules and conditions governing your use of the platform. Covers eligibility, acceptable use, account termination, content ownership, and limitations of liability. Includes EU/UK jurisdiction language.",
    effectiveDate: TERMS_EFFECTIVE_DATE,
    tag: null,
  },
  {
    href: "/privacy",
    icon: Shield,
    title: "Privacy Policy",
    description:
      "How we collect, use, and protect your personal data. Covers your rights under CCPA, PIPEDA, and GDPR (EU/UK), data retention, international data transfers, and how to submit data requests.",
    effectiveDate: PRIVACY_EFFECTIVE_DATE,
    tag: null,
  },
  {
    href: "/legal/cookies",
    icon: Cookie,
    title: "Cookie Policy",
    description:
      "An explanation of the cookies and tracking technologies used on the platform, organized by category: essential, analytics, and advertising. Includes legal basis for each category under GDPR and UK PECR.",
    effectiveDate: COOKIES_EFFECTIVE_DATE,
    tag: null,
  },
  {
    href: "/legal/dpa",
    icon: FileCheck,
    title: "Data Processing Agreement",
    description:
      "Required for employer accounts operating in the EU or UK under GDPR. Covers the subject matter of processing, security measures, sub-processors, international transfer safeguards, and Data Subject rights support.",
    effectiveDate: DPA_EFFECTIVE_DATE,
    tag: "EU / UK Employers",
  },
];

export default function LegalHubPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Legal</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          These documents govern your use of {APP_NAME}. We encourage you to read them carefully.
          If you have questions, contact us at{" "}
          <a
            href="mailto:legal@filminstallers.com"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            legal@filminstallers.com
          </a>
          .
        </p>
      </div>

      <div className="space-y-4">
        {LEGAL_DOCUMENTS.map(({ href, icon: Icon, title, description, effectiveDate, tag }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-5 p-6 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-foreground/20 transition-all"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-semibold text-foreground">{title}</h2>
                  {tag && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      {tag}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>
              {tag && (
                <span className="sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border mb-1.5">
                  {tag}
                </span>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed mb-2">{description}</p>
              <p className="text-xs text-muted-foreground/70">Effective {effectiveDate}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-5 rounded-xl bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground font-medium">Questions about these documents?</strong>{" "}
          Reach out to our legal team at{" "}
          <a
            href="mailto:legal@filminstallers.com"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            legal@filminstallers.com
          </a>
          . For data requests (access, deletion, or correction), email{" "}
          <a
            href="mailto:privacy@filminstallers.com"
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            privacy@filminstallers.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
