"use client";

import { FileText, PenLine, Eye, Tag, Layers, Search, CalendarClock, ChartBar as BarChart3 } from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: PenLine,
    title: "Post Editor",
    description: "Rich text editor for writing and formatting blog content.",
  },
  {
    icon: Eye,
    title: "Draft & Publish",
    description: "Save drafts and schedule posts for future publishing.",
  },
  {
    icon: Tag,
    title: "Categories & Tags",
    description: "Organize content with categories, tags, and featured flags.",
  },
  {
    icon: Layers,
    title: "Media Library",
    description: "Upload and manage images and video embeds for posts.",
  },
  {
    icon: Search,
    title: "SEO Controls",
    description: "Set meta titles, descriptions, and slugs per post.",
  },
  {
    icon: BarChart3,
    title: "Post Analytics",
    description: "Track views, read time, and engagement per article.",
  },
];

export default function AdminBlogPage() {
  return (
    <ComingSoonPage
      icon={FileText}
      title="Blog Management"
      subtitle="Create, edit, and publish platform content"
      description="Manage the Film Installers blog from end to end. Write install guides, industry news, and community spotlights with a full-featured content management interface."
      features={features}
      backHref="/admin"
      backLabel="Back to Admin"
    />
  );
}
