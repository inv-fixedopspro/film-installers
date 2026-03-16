"use client";

import {
  MessageSquare,
  Users,
  Pin,
  TrendingUp,
  Star,
  BookOpen,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { ComingSoonPage } from "@/components/shared";

const features = [
  {
    icon: MessageSquare,
    title: "Discussion Threads",
    description: "Ask questions, share tips, and discuss anything in the industry.",
  },
  {
    icon: Pin,
    title: "Pinned Resources",
    description: "Admins curate the most valuable threads and pin them for easy access.",
  },
  {
    icon: TrendingUp,
    title: "Trending Topics",
    description: "See what the community is talking about right now.",
  },
  {
    icon: Star,
    title: "Best Answers",
    description: "Community-voted replies surface the most helpful responses.",
  },
  {
    icon: BookOpen,
    title: "Guides & Write-Ups",
    description: "Long-form posts for installs, reviews, and technical guides.",
  },
  {
    icon: ShieldCheck,
    title: "Moderated Community",
    description: "A respectful space kept clean by community guidelines and admin oversight.",
  },
];

export default function ForumPage() {
  return (
    <div className="max-w-4xl mx-auto py-4">
      <ComingSoonPage
        icon={MessageSquare}
        title="Forum"
        subtitle="Community discussions for film professionals"
        description="A dedicated space for installers and shop owners to share knowledge, ask questions, and connect with peers across the industry. Everything from installs to business advice."
        features={features}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
    </div>
  );
}
