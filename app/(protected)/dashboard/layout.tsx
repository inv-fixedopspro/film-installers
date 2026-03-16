"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthenticatedHeader, ModerationBanner } from "@/components/shared";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { userData, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (userData && !userData.onboarding_completed) {
      router.push("/onboarding/select-type");
      return;
    }

    if (pathname === "/dashboard" && userData?.active_profile_type) {
      router.push(`/dashboard/${userData.active_profile_type}`);
    }
  }, [userData, loading, router, pathname]);

  if (loading) {
    return null;
  }

  if (userData && !userData.onboarding_completed) {
    return null;
  }

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
