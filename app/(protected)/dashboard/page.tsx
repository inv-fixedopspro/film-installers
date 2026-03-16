"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/hooks";
import { PageLoading } from "@/components/shared";

export default function DashboardPage() {
  const router = useRouter();
  const { loading, activeProfileType, hasInstallerProfile, hasEmployerProfile, hasTeamProfile } = useAuthState();

  useEffect(() => {
    if (!loading) {
      if (activeProfileType === "team") {
        router.push("/dashboard/team");
      } else if (activeProfileType) {
        router.push(`/dashboard/${activeProfileType}`);
      } else if (hasInstallerProfile) {
        router.push("/dashboard/installer");
      } else if (hasEmployerProfile) {
        router.push("/dashboard/employer");
      } else if (hasTeamProfile) {
        router.push("/dashboard/team");
      }
    }
  }, [loading, activeProfileType, hasInstallerProfile, hasEmployerProfile, hasTeamProfile, router]);

  return <PageLoading message="Loading dashboard..." variant="content" />;
}
