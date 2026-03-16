"use client";

import { Server, Key, Mail, Bell, Database, ShieldCheck, Activity, FileSliders as Sliders } from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: Sliders,
    title: "Platform Settings",
    description: "Toggle features, manage feature flags, and control platform behavior.",
  },
  {
    icon: Mail,
    title: "Email Configuration",
    description: "Manage SMTP settings, sender addresses, and email templates.",
  },
  {
    icon: Bell,
    title: "Notification Rules",
    description: "Configure when and how the platform sends automated notifications.",
  },
  {
    icon: Key,
    title: "API Keys",
    description: "Manage third-party integrations and API credentials.",
  },
  {
    icon: Activity,
    title: "System Health",
    description: "Monitor uptime, error rates, and background job status.",
  },
  {
    icon: Database,
    title: "Data Management",
    description: "Run cleanup jobs, manage backups, and review database health.",
  },
];

export default function AdminSystemPage() {
  return (
    <ComingSoonPage
      icon={Server}
      title="System"
      subtitle="Platform configuration and infrastructure management"
      description="Administrative tools for configuring the Film Installers platform. Manage settings, integrations, email delivery, and monitor system health from one place."
      features={features}
      backHref="/admin"
      backLabel="Back to Admin"
    />
  );
}
