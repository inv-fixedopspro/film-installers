"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { userData } = useAuth();

  useEffect(() => {
    if (userData?.onboarding_completed) {
      router.push("/dashboard");
    }
  }, [userData, router]);

  if (userData?.onboarding_completed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">FI</span>
          </div>
          <span className="font-semibold text-foreground">{APP_NAME}</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
