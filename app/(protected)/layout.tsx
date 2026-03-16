"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { PageLoading } from "@/components/shared";

function ProtectedContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (userData && !userData.email_verified_at) {
        router.push(`/verify-email?email=${encodeURIComponent(userData.email)}`);
      } else if (userData && userData.role === "admin") {
        router.push("/admin");
      }
    }
  }, [user, userData, loading, router]);

  if (loading) {
    return <PageLoading />;
  }

  if (!user || (userData && !userData.email_verified_at) || (userData && userData.role === "admin")) {
    return null;
  }

  return <>{children}</>;
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </AuthProvider>
  );
}
