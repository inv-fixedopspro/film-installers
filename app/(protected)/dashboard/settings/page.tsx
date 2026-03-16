"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, IconBox } from "@/components/shared";
import { User, Shield, Wrench, Building2, TriangleAlert as AlertTriangle, Eye, CircleCheck as CheckCircle } from "lucide-react";
import type { AccountStatus, ContentVisibility } from "@/lib/types/database";
import { DataExportSection, AccountDeletionSection, ConsentHistorySection, AdvertisingPreferencesSection } from "@/components/settings";

const ACCOUNT_STATUS_CONFIG: Record<AccountStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  active: {
    label: "Active",
    variant: "default",
    description: "Your account is in good standing.",
  },
  warned: {
    label: "Warned",
    variant: "secondary",
    description: "Your account has received a formal warning. Please review our community guidelines.",
  },
  pending_review: {
    label: "Pending Review",
    variant: "secondary",
    description: "Your account is being reviewed by our moderation team. No action has been taken yet.",
  },
  restricted: {
    label: "Restricted",
    variant: "destructive",
    description: "Some features have been temporarily disabled. You can still access your dashboard and settings.",
  },
  banned: {
    label: "Suspended",
    variant: "destructive",
    description: "Your account has been suspended. Please contact support to appeal.",
  },
};

const CONTENT_VISIBILITY_CONFIG: Record<ContentVisibility, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; description: string }> = {
  visible: {
    label: "Visible",
    variant: "default",
    description: "Your profile is visible to other members.",
  },
  auto_hidden: {
    label: "Auto-Hidden",
    variant: "secondary",
    description: "Your profile was automatically hidden due to reported content and is not visible to others.",
  },
  admin_hidden: {
    label: "Hidden by Admin",
    variant: "destructive",
    description: "Your profile was removed by an administrator and is not visible to others.",
  },
  restored: {
    label: "Restored",
    variant: "default",
    description: "Your profile visibility was manually restored by an administrator.",
  },
};

export default function SettingsPage() {
  const { userData, hasInstallerProfile, hasEmployerProfile, isAdmin, signOut } = useAuthState();
  const router = useRouter();

  const accountStatus = (userData?.account_status ?? "active") as AccountStatus;
  const contentVisibility = (userData?.content_visibility ?? "visible") as ContentVisibility;
  const unresolvedFlags = userData?.unresolved_flag_count ?? 0;

  const statusConfig = ACCOUNT_STATUS_CONFIG[accountStatus];
  const visibilityConfig = CONTENT_VISIBILITY_CONFIG[contentVisibility];

  const isModerationClean =
    accountStatus === "active" &&
    (contentVisibility === "visible" || contentVisibility === "restored");

  const handleDeleteConfirmed = useCallback(async () => {
    await signOut();
    router.push("/login?deleted=1");
  }, [signOut, router]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your account preferences and data"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{userData?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Administrator" : "User"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="font-medium">
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Your current standing and content visibility on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isModerationClean ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-success/8 border border-success/20">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Account in good standing</p>
                <p className="text-sm text-muted-foreground">
                  No active warnings, restrictions, or visibility issues on your account.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Account Standing</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{statusConfig.description}</p>
                    {unresolvedFlags > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {unresolvedFlags} unresolved flag{unresolvedFlags > 1 ? "s" : ""} on your account
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={statusConfig.variant} className="flex-shrink-0">
                  {statusConfig.label}
                </Badge>
              </div>

              {(contentVisibility === "auto_hidden" || contentVisibility === "admin_hidden") && (
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted">
                  <div className="flex items-start gap-3">
                    <Eye className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Profile Visibility</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{visibilityConfig.description}</p>
                      {userData?.auto_hidden_at && contentVisibility === "auto_hidden" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Hidden since{" "}
                          {new Date(userData.auto_hidden_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={visibilityConfig.variant} className="flex-shrink-0">
                    {visibilityConfig.label}
                  </Badge>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profiles
          </CardTitle>
          <CardDescription>
            Your active profiles on the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              <IconBox icon={Wrench} size="sm" variant="highlight" />
              <div>
                <p className="font-medium">Installer Profile</p>
                <p className="text-sm text-muted-foreground">
                  {hasInstallerProfile
                    ? `${userData?.installerProfile?.first_name} ${userData?.installerProfile?.last_name}`
                    : "Not created"}
                </p>
              </div>
            </div>
            <Badge variant={hasInstallerProfile ? "default" : "outline"}>
              {hasInstallerProfile ? "Active" : "Not Created"}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-3">
              <IconBox icon={Building2} size="sm" variant="secondary" />
              <div>
                <p className="font-medium">Employer Profile</p>
                <p className="text-sm text-muted-foreground">
                  {hasEmployerProfile
                    ? userData?.employerProfile?.company_name
                    : "Not created"}
                </p>
              </div>
            </div>
            <Badge variant={hasEmployerProfile ? "default" : "outline"}>
              {hasEmployerProfile ? "Active" : "Not Created"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <DataExportSection />

      <AdvertisingPreferencesSection />

      <ConsentHistorySection />

      <AccountDeletionSection onDeleteConfirmed={handleDeleteConfirmed} />
    </div>
  );
}
