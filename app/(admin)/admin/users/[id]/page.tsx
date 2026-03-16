"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ComingSoonCard, PageHeader } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, Loader as Loader2, TriangleAlert as AlertTriangle, Ban, Shield, Eye, RotateCcw, Flag, CircleCheck as CheckCircle, Circle as XCircle, User, Clock } from "lucide-react";
import type { AccountStatus, ContentVisibility, ModerationActionType, FlagCategory, FlagContentType, FlagReviewStatus } from "@/lib/types/database";

interface UserDetail {
  id: string;
  email: string;
  role: string;
  account_status: AccountStatus;
  content_visibility: ContentVisibility;
  unresolved_flag_count: number;
  auto_hidden_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  installer_profiles: { id: string; first_name: string; last_name: string; city: string; state: string } | null;
  employer_profiles: { id: string; company_name: string; hq_city: string; hq_state: string } | null;
}

interface ModerationActionRow {
  id: string;
  action_type: ModerationActionType;
  reason: string;
  notes: string | null;
  admin_user_id: string;
  created_at: string;
  expires_at: string | null;
}

interface FlagRow {
  id: string;
  content_type: FlagContentType;
  flag_category: FlagCategory;
  flag_reason_detail: string | null;
  created_at: string;
  is_duplicate: boolean;
  flag_reviews: {
    status: FlagReviewStatus;
    priority: string;
    reviewed_at: string | null;
  }[] | null;
}

const ACTION_LABELS: Record<ModerationActionType, string> = {
  warning: "Warning issued",
  hide: "Content hidden",
  restore: "Content restored",
  restrict: "Account restricted",
  unrestrict: "Restriction lifted",
  ban: "Account banned",
  unban: "Account unbanned",
  flag_upheld: "Flag upheld",
  flag_dismissed: "Flag dismissed",
};

const ACTION_ICONS: Record<ModerationActionType, React.ReactNode> = {
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  hide: <Eye className="w-4 h-4 text-muted-foreground" />,
  restore: <RotateCcw className="w-4 h-4 text-success" />,
  restrict: <Shield className="w-4 h-4 text-destructive" />,
  unrestrict: <Shield className="w-4 h-4 text-success" />,
  ban: <Ban className="w-4 h-4 text-destructive" />,
  unban: <CheckCircle className="w-4 h-4 text-success" />,
  flag_upheld: <Flag className="w-4 h-4 text-warning" />,
  flag_dismissed: <XCircle className="w-4 h-4 text-muted-foreground" />,
};

const STATUS_BADGE: Record<AccountStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  warned: { label: "Warned", variant: "secondary" },
  pending_review: { label: "Pending Review", variant: "secondary" },
  restricted: { label: "Restricted", variant: "destructive" },
  banned: { label: "Banned", variant: "destructive" },
};

const CATEGORY_LABELS: Record<FlagCategory, string> = {
  spam: "Spam",
  fake_profile: "Fake Profile",
  inappropriate_content: "Inappropriate Content",
  harassment: "Harassment",
  misleading_information: "Misleading Info",
  other: "Other",
};

type ActionType = "warning" | "restrict" | "unrestrict" | "ban" | "unban" | "restore";

interface ActionConfig {
  label: string;
  description: string;
  action: ActionType;
  variant: "default" | "outline" | "destructive" | "secondary";
  icon: React.ReactNode;
}

function getAvailableActions(user: UserDetail): ActionConfig[] {
  const actions: ActionConfig[] = [];
  const { account_status, content_visibility } = user;

  if (account_status !== "banned") {
    actions.push({
      label: "Issue Warning",
      description: "Send a formal warning to this user",
      action: "warning",
      variant: "outline",
      icon: <AlertTriangle className="w-4 h-4" />,
    });
  }

  if (account_status !== "restricted" && account_status !== "banned") {
    actions.push({
      label: "Restrict Account",
      description: "Limit this user's platform access",
      action: "restrict",
      variant: "secondary",
      icon: <Shield className="w-4 h-4" />,
    });
  }

  if (account_status === "restricted") {
    actions.push({
      label: "Lift Restriction",
      description: "Restore full platform access",
      action: "unrestrict",
      variant: "outline",
      icon: <CheckCircle className="w-4 h-4" />,
    });
  }

  if (account_status !== "banned") {
    actions.push({
      label: "Ban Account",
      description: "Permanently suspend this user",
      action: "ban",
      variant: "destructive",
      icon: <Ban className="w-4 h-4" />,
    });
  }

  if (account_status === "banned") {
    actions.push({
      label: "Unban Account",
      description: "Remove the suspension from this user",
      action: "unban",
      variant: "outline",
      icon: <RotateCcw className="w-4 h-4" />,
    });
  }

  if (content_visibility === "auto_hidden" || content_visibility === "admin_hidden") {
    actions.push({
      label: "Restore Content",
      description: "Make this user's profile visible again",
      action: "restore",
      variant: "outline",
      icon: <Eye className="w-4 h-4" />,
    });
  }

  return actions;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [actions, setActions] = useState<ModerationActionRow[]>([]);
  const [flagsAgainst, setFlagsAgainst] = useState<FlagRow[]>([]);
  const [flagsSubmitted, setFlagsSubmitted] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, actionsRes, flagsAgainstRes, flagsSubmittedRes] = await Promise.all([
        fetch(`/api/admin/users?search=${id}&page=1`).then((r) => r.json()),
        fetch(`/api/admin/moderation-history/${id}`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/admin/flags?flagged_user=${id}&page=1`).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(`/api/admin/flags?flagger_user=${id}&page=1`).then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (userRes.success) {
        const found = userRes.data.users.find((u: UserDetail) => u.id === id);
        if (found) setUser(found);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserDirect = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, actionsRes, flagsRes] = await Promise.all([
        fetch(`/api/admin/users?page=1`).then((r) => r.json()),
        fetch(`/api/admin/moderation-history?user_id=${id}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/admin/user-flags?user_id=${id}`).then((r) => r.json()).catch(() => null),
      ]);

      if (profileRes.success) {
        const found = profileRes.data.users.find((u: UserDetail) => u.id === id);
        if (found) setUser(found);
      }
      if (actionsRes?.success) setActions(actionsRes.data?.actions ?? []);
      if (flagsRes?.success) {
        setFlagsAgainst(flagsRes.data?.against ?? []);
        setFlagsSubmitted(flagsRes.data?.submitted ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const profilesRes = await fetch(`/api/admin/users?page=1`);
        const profilesJson = await profilesRes.json();
        if (profilesJson.success) {
          const found = (profilesJson.data.users as UserDetail[]).find((u) => u.id === id);
          setUser(found ?? null);
        }

        const [actRes, flagsAgainstRes, flagsSubRes] = await Promise.allSettled([
          fetch(`/api/admin/moderation-history?user_id=${id}`).then((r) => r.json()),
          fetch(`/api/admin/user-flags?user_id=${id}&type=against`).then((r) => r.json()),
          fetch(`/api/admin/user-flags?user_id=${id}&type=submitted`).then((r) => r.json()),
        ]);

        if (actRes.status === "fulfilled" && actRes.value?.success) {
          setActions(actRes.value.data?.actions ?? []);
        }
        if (flagsAgainstRes.status === "fulfilled" && flagsAgainstRes.value?.success) {
          setFlagsAgainst(flagsAgainstRes.value.data?.flags ?? []);
        }
        if (flagsSubRes.status === "fulfilled" && flagsSubRes.value?.success) {
          setFlagsSubmitted(flagsSubRes.value.data?.flags ?? []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const handleAction = async () => {
    if (!reason.trim()) {
      setActionError("A reason is required.");
      return;
    }
    setSubmitting(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/users/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: activeAction,
          reason: reason.trim(),
          notes: notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveAction(null);
        setReason("");
        setNotes("");
        const profilesRes = await fetch(`/api/admin/users?page=1`);
        const profilesJson = await profilesRes.json();
        if (profilesJson.success) {
          const found = (profilesJson.data.users as UserDetail[]).find((u) => u.id === id);
          setUser(found ?? null);
        }
      } else {
        setActionError(json.error ?? "Action failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/admin/users")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to users
        </Button>
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const statusCfg = STATUS_BADGE[user.account_status];
  const availableActions = getAvailableActions(user);
  const installerProfile = user.installer_profiles;
  const employerProfile = user.employer_profiles;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/users")}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Users
        </Button>
      </div>

      <PageHeader
        title={user.email}
        description={`Member since ${new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <Badge variant={user.role === "admin" ? "default" : "outline"}>{user.role}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Account Status</p>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Content Visibility</p>
                  <p className="font-medium capitalize">{user.content_visibility.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unresolved Flags</p>
                  <p className={`font-medium ${user.unresolved_flag_count > 0 ? "text-warning" : ""}`}>
                    {user.unresolved_flag_count}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Onboarding</p>
                  <p className="font-medium">{user.onboarding_completed ? "Complete" : "Incomplete"}</p>
                </div>
              </div>

              {(installerProfile || employerProfile) && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-muted-foreground uppercase text-xs tracking-wide">Profiles</p>
                    {installerProfile && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Installer</span>
                        <span>{installerProfile.first_name} {installerProfile.last_name} — {installerProfile.city}, {installerProfile.state}</span>
                      </div>
                    )}
                    {employerProfile && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employer</span>
                        <span>{employerProfile.company_name} — {employerProfile.hq_city}, {employerProfile.hq_state}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Moderation History
              </CardTitle>
              <CardDescription>All actions taken on this account</CardDescription>
            </CardHeader>
            <CardContent>
              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No moderation actions on record.</p>
              ) : (
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted text-sm">
                      <div className="mt-0.5 flex-shrink-0">{ACTION_ICONS[action.action_type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{ACTION_LABELS[action.action_type]}</p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(action.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{action.reason}</p>
                        {action.notes && <p className="text-muted-foreground mt-0.5 italic">Note: {action.notes}</p>}
                        {action.expires_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires: {new Date(action.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Flags Against This User
              </CardTitle>
              <CardDescription>Content reports submitted about this user</CardDescription>
            </CardHeader>
            <CardContent>
              {flagsAgainst.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No flags on record.</p>
              ) : (
                <div className="space-y-2">
                  {flagsAgainst.map((flag) => {
                    const review = flag.flag_reviews?.[0];
                    return (
                      <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                        <div>
                          <p className="font-medium">{CATEGORY_LABELS[flag.flag_category]}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {flag.content_type.replace(/_/g, " ")} ·{" "}
                            {new Date(flag.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          {flag.flag_reason_detail && (
                            <p className="text-muted-foreground mt-1 truncate max-w-sm">{flag.flag_reason_detail}</p>
                          )}
                        </div>
                        {review && (
                          <Badge variant="outline" className="flex-shrink-0 capitalize">
                            {review.status.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Flags Submitted by This User</CardTitle>
              <CardDescription>Reports this user has filed against others</CardDescription>
            </CardHeader>
            <CardContent>
              {flagsSubmitted.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No flags submitted.</p>
              ) : (
                <div className="space-y-2">
                  {flagsSubmitted.map((flag) => {
                    const review = flag.flag_reviews?.[0];
                    return (
                      <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg bg-muted text-sm">
                        <div>
                          <p className="font-medium">{CATEGORY_LABELS[flag.flag_category]}</p>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {flag.content_type.replace(/_/g, " ")} ·{" "}
                            {new Date(flag.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        {review && (
                          <Badge variant="outline" className="flex-shrink-0 capitalize">
                            {review.status.replace(/_/g, " ")}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <ComingSoonCard
            title="Additional Admin Tools"
            description="More capabilities coming soon"
            features={[
              { title: "Email Notifications", description: "Send moderation emails directly from this panel" },
              { title: "Bulk Actions", description: "Apply actions to multiple users at once" },
              { title: "Activity Log", description: "Full audit trail of all user actions on the platform" },
            ]}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Moderate this account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableActions.map((cfg) => (
                <Button
                  key={cfg.action}
                  variant={cfg.variant}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setActiveAction(cfg.action);
                    setReason("");
                    setNotes("");
                    setActionError("");
                  }}
                >
                  {cfg.icon}
                  {cfg.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!activeAction} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {availableActions.find((a) => a.action === activeAction)?.label}
            </DialogTitle>
            <DialogDescription>
              {availableActions.find((a) => a.action === activeAction)?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Private notes visible only to admins..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveAction(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={activeAction === "ban" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
