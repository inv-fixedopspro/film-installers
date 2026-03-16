"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import type {
  Profile,
  InstallerProfileWithExperience,
  EmployerProfileWithServices,
  ProfileType,
  TeamProfile,
} from "@/lib/types/database";

export interface UserData extends Profile {
  installerProfile: InstallerProfileWithExperience | null;
  employerProfile: EmployerProfileWithServices | null;
  teamProfile: TeamProfile | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  switchProfile: (profileType: ProfileType) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isSigningOut = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserData = useCallback(async (userId: string): Promise<UserData | null> => {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw new Error("Failed to fetch user profile");
    }

    if (!profile) return null;

    const [installerResult, employerResult] = await Promise.all([
      supabase
        .from("installer_profiles")
        .select(`
          *,
          installer_experience (*),
          resume:installer_resumes!installer_profiles_resume_id_fkey (*)
        `)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("employer_profiles")
        .select(`
          *,
          employer_services (*)
        `)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    let teamProfile: TeamProfile | null = null;

    if (profile.team_member_id) {
      const { data: teamMember } = await supabase
        .from("company_team_members")
        .select(`
          *,
          employer_profiles (
            *,
            employer_services (*)
          )
        `)
        .eq("id", profile.team_member_id)
        .eq("is_active", true)
        .maybeSingle();

      if (teamMember) {
        const { employer_profiles: ep, ...memberRow } = teamMember as typeof teamMember & {
          employer_profiles: EmployerProfileWithServices | null;
        };
        if (ep) {
          teamProfile = {
            teamMember: memberRow,
            employerProfile: ep,
          };
        }
      }
    }

    return {
      ...profile,
      installerProfile: installerResult.data || null,
      employerProfile: employerResult.data || null,
      teamProfile,
    };
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      setUser(currentUser);

      if (currentUser) {
        const data = await fetchUserData(currentUser.id);
        setUserData(data);
      } else {
        setUserData(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh user data";
      setError(message);
      console.error("Auth refresh error:", err);
    }
  }, [supabase, fetchUserData]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      isSigningOut.current = true;

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to sign out");
      }

      setUser(null);
      setUserData(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign out";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      isSigningOut.current = false;
    }
  }, []);

  const switchProfile = useCallback(async (profileType: ProfileType): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch("/api/profiles/active", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to switch profile");
      }

      await refreshUser();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to switch profile";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  }, [refreshUser]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (isSigningOut.current) return;

        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
          (async () => {
            await refreshUser();
          })();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUser, supabase.auth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        error,
        refreshUser,
        signOut,
        switchProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
