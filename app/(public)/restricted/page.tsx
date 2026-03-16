import Link from "next/link";
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Mail, ArrowRight } from "lucide-react";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";

export const metadata = {
  title: `Feature Access Restricted | ${APP_NAME}`,
};

const BLOCKED_FEATURES = [
  { name: "Talent Network", path: "/network" },
  { name: "Community Forum", path: "/forum" },
  { name: "Marketplace", path: "/marketplace" },
  { name: "Job Board", path: "/jobs" },
  { name: "Resume Builder", path: "/resume" },
];

const ACCESSIBLE_FEATURES = [
  "Your dashboard and account settings",
  "Your saved profile and onboarding",
  "Viewing your own submission history",
];

export default function RestrictedPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-warning/8 border-b border-warning/20 px-8 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Feature Access Restricted</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your account is under administrative review
            </p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Your account has been temporarily restricted while our moderation team reviews reported
            activity. You can still access your dashboard and basic account functions during this time.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">Blocked features</h2>
              <ul className="space-y-2">
                {BLOCKED_FEATURES.map((f) => (
                  <li key={f.path} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">Still accessible</h2>
              <ul className="space-y-2">
                {ACCESSIBLE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">What happens next</h2>
            <p className="text-sm text-muted-foreground">
              Our moderation team reviews restricted accounts within <strong>24&ndash;72 hours</strong>.
              If no action is required, your account access will be restored automatically.
              If you have questions or would like to provide context, contact us directly.
            </p>
            <a
              href={`mailto:support@${APP_DOMAIN}?subject=Account%20Restriction%20Inquiry`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              <Mail className="w-4 h-4" />
              support@{APP_DOMAIN}
            </a>
          </div>

          <div className="border-t border-border pt-5 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
            >
              Go to dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/api/auth/logout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
