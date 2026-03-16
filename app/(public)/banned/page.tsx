import Link from "next/link";
import { Ban, Mail, ArrowRight, ShieldAlert } from "lucide-react";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";

export const metadata = {
  title: `Account Suspended | ${APP_NAME}`,
};

export default function BannedPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-destructive/8 border-b border-destructive/20 px-8 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
            <Ban className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Account Suspended</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your access to {APP_NAME} has been suspended</p>
          </div>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">What this means</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {[
                "You cannot access your dashboard or any protected features.",
                "Your profile is no longer visible to other members.",
                "Any active listings or applications have been paused.",
                "You are still able to log in to check this status.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-border pt-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">How to appeal</h2>
            <p className="text-sm text-muted-foreground">
              If you believe this suspension was applied in error, you can submit an appeal to our
              moderation team. Please include your account email and a brief explanation in your message.
            </p>
            <a
              href={`mailto:appeals@${APP_DOMAIN}?subject=Account%20Suspension%20Appeal`}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              <Mail className="w-4 h-4" />
              appeals@{APP_DOMAIN}
            </a>
          </div>

          <div className="border-t border-border pt-5 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Suspension appeals are reviewed within 3&ndash;5 business days.
            </p>
            <Link
              href="/api/auth/logout"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
