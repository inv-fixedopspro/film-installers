import Link from "next/link";
import { Logo } from "@/components/shared";
import { CookiePreferencesTrigger } from "@/components/shared/cookie-preferences-trigger";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";

const PLATFORM_LINKS = [
  { href: "#", label: "Job Board" },
  { href: "#", label: "Network" },
  { href: "#", label: "Forum" },
  { href: "#", label: "Marketplace" },
  { href: "#", label: "Shop" },
  { href: "#", label: "Blog" },
];

const ACCOUNT_LINKS = [
  { href: "/join", label: "Join Free" },
  { href: "/login", label: "Sign In" },
  { href: "/forgot-password", label: "Reset Password" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal", label: "Legal Hub" },
];

export function Footer() {
  return (
    <footer className="bg-foreground border-t border-primary-foreground/10">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <Logo href="/" size="md" textClassName="text-sm font-semibold text-primary-foreground" />
            </div>
            <p className="text-xs text-primary-foreground/30 leading-relaxed max-w-[200px]">
              The job board and network for window tint, PPF, vinyl wrap, and architectural film installers.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-brand/80 mb-4">Platform</p>
            <ul className="space-y-2.5 text-sm text-primary-foreground/50">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary-foreground/80 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-brand/80 mb-4">Account</p>
            <ul className="space-y-2.5 text-sm text-primary-foreground/50">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary-foreground/80 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-brand/80 mb-4">Legal</p>
            <ul className="space-y-2.5 text-sm text-primary-foreground/50">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-primary-foreground/80 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-primary-foreground/40">{APP_DOMAIN}</p>
            <span className="text-primary-foreground/20 text-xs">|</span>
            <p className="text-xs text-primary-foreground/40">
              <CookiePreferencesTrigger />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
