import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared";
import { Footer } from "@/components/layout";
import { APP_NAME } from "@/lib/constants";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/" size="md" />
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/legal" className="hover:text-foreground transition-colors">
              Legal Hub
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
