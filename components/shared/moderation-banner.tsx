"use client";

import Link from "next/link";
import { TriangleAlert as AlertTriangle, Eye, Flag } from "lucide-react";
import { useAuthState } from "@/hooks";

export function ModerationBanner() {
  const { userData } = useAuthState();

  if (!userData) return null;

  const { account_status, content_visibility, unresolved_flag_count } = userData;

  const isWarned = account_status === "warned";
  const isPendingReview = account_status === "pending_review";
  const isAutoHidden = content_visibility === "auto_hidden";
  const isAdminHidden = content_visibility === "admin_hidden";

  if (!isWarned && !isPendingReview && !isAutoHidden && !isAdminHidden) return null;

  type BannerConfig = {
    icon: React.ReactNode;
    title: string;
    description: string;
    className: string;
    iconClassName: string;
  };

  const banners: BannerConfig[] = [];

  if (isWarned) {
    banners.push({
      icon: <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />,
      title: "Account Warning",
      description: `Your account has received a formal warning${unresolved_flag_count > 0 ? ` with ${unresolved_flag_count} unresolved flag${unresolved_flag_count > 1 ? "s" : ""}` : ""}. Review our community guidelines to avoid further action. Repeated violations may result in feature restrictions or account suspension.`,
      className: "bg-warning/10 border-warning/30 text-warning-foreground",
      iconClassName: "text-warning",
    });
  }

  if (isPendingReview) {
    banners.push({
      icon: <Flag className="w-4 h-4 flex-shrink-0 mt-0.5" />,
      title: "Account Under Review",
      description: "Your account has been flagged for review by our moderation team. No action has been taken yet. You will retain full access while the review is in progress.",
      className: "bg-warning/10 border-warning/30 text-warning-foreground",
      iconClassName: "text-warning",
    });
  }

  if (isAutoHidden || isAdminHidden) {
    const reason = isAdminHidden
      ? "removed by an administrator"
      : "automatically hidden due to reported content";
    banners.push({
      icon: <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />,
      title: "Profile Not Visible",
      description: `Your profile has been ${reason} and is not currently visible to other members. If you believe this is in error, please contact support.`,
      className: "bg-destructive/8 border-destructive/25 text-foreground",
      iconClassName: "text-destructive",
    });
  }

  return (
    <div className="space-y-2 mb-6">
      {banners.map((banner, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3.5 rounded-lg border text-sm ${banner.className}`}
        >
          <span className={banner.iconClassName}>{banner.icon}</span>
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold leading-snug">{banner.title}</p>
            <p className="text-muted-foreground leading-relaxed">
              {banner.description}{" "}
              <Link
                href="/dashboard/settings"
                className="underline underline-offset-2 hover:no-underline font-medium text-foreground"
              >
                View account status
              </Link>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
