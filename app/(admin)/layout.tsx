"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";
import { AuthenticatedHeader, PageLoading } from "@/components/shared";

function AdminContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { userData, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!userData) {
      router.push("/login");
      return;
    }

    if (userData.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [userData, loading, router]);

  if (loading) {
    return <PageLoading />;
  }

  if (!userData || userData.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedHeader variant="admin" />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminContent>{children}</AdminContent>
    </AuthProvider>
  );
}
