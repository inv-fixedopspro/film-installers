"use client";

import { useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import type { ProfileType } from "@/lib/types/database";

export function useAuthState() {
  const { user, userData, loading, refreshUser, signOut, switchProfile } = useAuth();

  const state = useMemo(() => {
    const isAuthenticated = !!user;
    const hasProfile = !!userData;
    const isEmailVerified = !!userData?.email_verified_at;
    const isOnboardingComplete = !!userData?.onboarding_completed;
    const activeProfileType = userData?.active_profile_type || null;

    const hasInstallerProfile = !!userData?.installerProfile;
    const hasEmployerProfile = !!userData?.employerProfile;
    const hasTeamProfile = !!userData?.teamProfile;
    const hasBothProfiles = hasInstallerProfile && hasEmployerProfile;

    const canCreateInstallerProfile = hasProfile && !hasInstallerProfile;
    const canCreateEmployerProfile = hasProfile && !hasEmployerProfile;

    const isAdmin = userData?.role === "admin";
    const isUser = userData?.role === "user";

    const isActiveInstaller = activeProfileType === "installer";
    const isActiveEmployer = activeProfileType === "employer";
    const isActiveTeamMember = activeProfileType === "team";

    const needsOnboarding = isAuthenticated && hasProfile && isEmailVerified && !isOnboardingComplete;
    const needsEmailVerification = isAuthenticated && hasProfile && !isEmailVerified;

    return {
      isAuthenticated,
      hasProfile,
      isEmailVerified,
      isOnboardingComplete,
      activeProfileType,
      hasInstallerProfile,
      hasEmployerProfile,
      hasTeamProfile,
      hasBothProfiles,
      canCreateInstallerProfile,
      canCreateEmployerProfile,
      isAdmin,
      isUser,
      isActiveInstaller,
      isActiveEmployer,
      isActiveTeamMember,
      needsOnboarding,
      needsEmailVerification,
    };
  }, [user, userData]);

  const getActiveProfile = useMemo(() => {
    if (!userData) return null;

    if (userData.active_profile_type === "installer") {
      return userData.installerProfile;
    }

    if (userData.active_profile_type === "employer") {
      return userData.employerProfile;
    }

    if (userData.active_profile_type === "team") {
      return userData.teamProfile;
    }

    return null;
  }, [userData]);

  const getProfileDisplayName = useMemo(() => {
    if (!userData) return "";

    if (userData.active_profile_type === "installer" && userData.installerProfile) {
      return `${userData.installerProfile.first_name} ${userData.installerProfile.last_name}`;
    }

    if (userData.active_profile_type === "employer" && userData.employerProfile) {
      return userData.employerProfile.company_name;
    }

    if (userData.active_profile_type === "team" && userData.teamProfile) {
      return userData.teamProfile.employerProfile.company_name;
    }

    return userData.email;
  }, [userData]);

  const checkProfileTypeExists = (type: ProfileType): boolean => {
    if (!userData) return false;
    if (type === "installer") return !!userData.installerProfile;
    if (type === "employer") return !!userData.employerProfile;
    if (type === "team") return !!userData.teamProfile;
    return false;
  };

  return {
    user,
    userData,
    loading,
    refreshUser,
    signOut,
    switchProfile,
    ...state,
    activeProfile: getActiveProfile,
    displayName: getProfileDisplayName,
    checkProfileTypeExists,
  };
}
