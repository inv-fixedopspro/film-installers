"use client";

import { useRouter } from "next/navigation";
import { useAuthState } from "@/hooks";
import { AppHeader } from "./app-header";

interface AuthenticatedHeaderProps {
  variant: "user" | "admin";
  cartItemCount?: number;
}

export function AuthenticatedHeader({ variant, cartItemCount = 0 }: AuthenticatedHeaderProps) {
  const router = useRouter();
  const {
    userData,
    signOut,
    switchProfile,
    hasInstallerProfile,
    hasEmployerProfile,
    activeProfileType,
    canCreateInstallerProfile,
    canCreateEmployerProfile,
  } = useAuthState();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
    router.replace("/login");
  };

  const handleSwitchProfile = async (profileType: "installer" | "employer") => {
    await switchProfile(profileType);
    router.push(`/dashboard/${profileType}`);
  };

  const avatarStoragePath =
    activeProfileType === "installer"
      ? (userData?.installerProfile?.photo_storage_path ?? null)
      : activeProfileType === "employer"
        ? (userData?.employerProfile?.logo_storage_path ?? null)
        : null;

  return (
    <AppHeader
      variant={variant}
      cartItemCount={cartItemCount}
      userData={userData ? { email: userData.email } : null}
      activeProfileType={activeProfileType}
      hasInstallerProfile={hasInstallerProfile}
      hasEmployerProfile={hasEmployerProfile}
      canCreateInstallerProfile={canCreateInstallerProfile}
      canCreateEmployerProfile={canCreateEmployerProfile}
      avatarStoragePath={avatarStoragePath}
      onSignOut={handleSignOut}
      onSwitchProfile={handleSwitchProfile}
    />
  );
}
