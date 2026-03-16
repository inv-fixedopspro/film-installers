"use client";

import { ReactNode } from "react";
import { AuthenticatedHeader, ModerationBanner } from "@/components/shared";

export default function ForumLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary">
      <AuthenticatedHeader variant="user" />
      <main className="container mx-auto px-4 py-8">
        <ModerationBanner />
        {children}
      </main>
    </div>
  );
}
