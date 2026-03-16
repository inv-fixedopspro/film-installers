"use client";

import { MonitorPlay, LayoutDashboard, ChartBar as BarChart3, Target, DollarSign, PanelTop, Megaphone, Settings2 } from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: PanelTop,
    title: "Banner Management",
    description: "Upload, schedule, and position ad banners across the platform.",
  },
  {
    icon: Target,
    title: "Audience Targeting",
    description: "Target ads to installers, employers, or specific regions.",
  },
  {
    icon: BarChart3,
    title: "Impression Analytics",
    description: "Track views, clicks, and CTR for each active campaign.",
  },
  {
    icon: DollarSign,
    title: "Campaign Billing",
    description: "Manage advertiser accounts and billing cycles.",
  },
  {
    icon: Megaphone,
    title: "Sponsored Listings",
    description: "Promote installer profiles and job listings as sponsored content.",
  },
  {
    icon: Settings2,
    title: "Ad Configuration",
    description: "Set placements, rotation rules, and frequency caps.",
  },
];

export default function AdminAdSpacePage() {
  return (
    <ComingSoonPage
      icon={MonitorPlay}
      title="Ad Space"
      subtitle="Manage platform advertising and sponsored content"
      description="Control all advertising placements across the Film Installers platform. Manage campaigns, track performance, and configure sponsored listings for brands and businesses."
      features={features}
      backHref="/admin"
      backLabel="Back to Admin"
    />
  );
}
