import type {
  AdPackageTier,
  AdSlotType,
  AdPageContext,
  AdTargetAudience,
  AdTrafficTier,
  AdCampaignStatus,
  AdPaymentStatus,
} from "@/lib/types/database";

export const AD_SLOT_DIMENSIONS: Record<AdSlotType, { width: number; height: number; mobileWidth?: number; mobileHeight?: number }> = {
  leaderboard: { width: 728, height: 90 },
  banner: { width: 468, height: 60 },
  sidebar: { width: 300, height: 250 },
  inline: { width: 728, height: 90, mobileWidth: 320, mobileHeight: 100 },
  sticky_footer: { width: 728, height: 90, mobileWidth: 320, mobileHeight: 50 },
};

export const AD_SLOT_TYPES: { value: AdSlotType; label: string }[] = [
  { value: "leaderboard", label: "Leaderboard (728x90)" },
  { value: "banner", label: "Banner (468x60)" },
  { value: "sidebar", label: "Sidebar (300x250)" },
  { value: "inline", label: "Inline (728x90 / 320x100)" },
  { value: "sticky_footer", label: "Sticky Footer (728x90 / 320x50)" },
];

export const AD_PAGE_CONTEXTS: { value: AdPageContext; label: string; isPublic: boolean; trafficTier: AdTrafficTier }[] = [
  { value: "home", label: "Home Page", isPublic: true, trafficTier: "high" },
  { value: "jobs", label: "Jobs Board", isPublic: false, trafficTier: "high" },
  { value: "forum", label: "Forum", isPublic: false, trafficTier: "medium" },
  { value: "network", label: "Network", isPublic: false, trafficTier: "medium" },
  { value: "marketplace", label: "Marketplace", isPublic: false, trafficTier: "medium" },
  { value: "blog", label: "Blog", isPublic: true, trafficTier: "medium" },
  { value: "shop", label: "Shop", isPublic: true, trafficTier: "low" },
  { value: "dashboard", label: "Dashboard", isPublic: false, trafficTier: "high" },
];

export const AD_TARGET_AUDIENCES: { value: AdTargetAudience; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "installer", label: "Installers Only" },
  { value: "employer", label: "Employers Only" },
];

export const AD_TRAFFIC_TIERS: { value: AdTrafficTier; label: string }[] = [
  { value: "high", label: "High Traffic" },
  { value: "medium", label: "Medium Traffic" },
  { value: "low", label: "Low Traffic" },
];

export const AD_PACKAGE_TIERS: { value: AdPackageTier; label: string; description: string }[] = [
  { value: "starter", label: "Starter", description: "Basic visibility on select pages" },
  { value: "professional", label: "Professional", description: "Expanded reach across multiple pages" },
  { value: "premium", label: "Premium", description: "Priority placement on high-traffic pages" },
  { value: "elite", label: "Elite", description: "Maximum visibility across the entire platform" },
];

export const AD_DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: "1 Week" },
  { value: 14, label: "2 Weeks" },
  { value: 30, label: "1 Month" },
  { value: 90, label: "3 Months" },
];

export const AD_ROTATION_INTERVAL_MS = 4000;

export const AD_MAX_FILE_SIZE_KB = 2048;
export const AD_MAX_FILE_SIZE_BYTES = AD_MAX_FILE_SIZE_KB * 1024;

export const AD_ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const AD_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

export const AD_CAMPAIGN_STATUSES: { value: AdCampaignStatus; label: string; color: string }[] = [
  { value: "draft", label: "Draft", color: "bg-muted text-muted-foreground" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "active", label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "paused", label: "Paused", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

export const AD_PAYMENT_STATUSES: { value: AdPaymentStatus; label: string; color: string }[] = [
  { value: "unpaid", label: "Unpaid", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "invoiced", label: "Invoiced", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "refunded", label: "Refunded", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" },
];

export function getCampaignStatusConfig(status: AdCampaignStatus) {
  return AD_CAMPAIGN_STATUSES.find((s) => s.value === status) ?? AD_CAMPAIGN_STATUSES[0];
}

export function getPaymentStatusConfig(status: AdPaymentStatus) {
  return AD_PAYMENT_STATUSES.find((s) => s.value === status) ?? AD_PAYMENT_STATUSES[0];
}

export function getSlotDimensions(slotType: AdSlotType, isMobile = false) {
  const dims = AD_SLOT_DIMENSIONS[slotType];
  if (isMobile && dims.mobileWidth && dims.mobileHeight) {
    return { width: dims.mobileWidth, height: dims.mobileHeight };
  }
  return { width: dims.width, height: dims.height };
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
