import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  effectiveDate: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, effectiveDate, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link
          href="/legal"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Legal Hub
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">{title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>Effective: {effectiveDate}</span>
          {lastUpdated && <span>Last updated: {lastUpdated}</span>}
        </div>
      </div>

      <div className="prose-legal">
        {children}
      </div>
    </div>
  );
}
