"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertMessage, FormField, LoadingButton, ConfirmationDialog, SectionHeader } from "@/components/shared";
import { toast } from "@/hooks/use-toast";
import { useApiMutation } from "@/hooks";
import { formatDate } from "@/lib/formatters";
import { Users, UserPlus, Mail, Clock, Loader as Loader2, Crown, UserX, X } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: "owner" | "member";
  is_active: boolean;
  created_at: string;
  profiles: { email: string } | null;
}

interface PendingInvitation {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface TeamManagementSectionProps {
  employerProfileId: string;
}

export function TeamManagementSection({ employerProfileId }: TeamManagementSectionProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PendingInvitation | null>(null);

  const inviteMutation = useApiMutation<{ employer_profile_id: string; email: string }, unknown>(
    "/api/company/team/invite",
    "POST"
  );

  const removeMutation = useApiMutation<{ employer_profile_id: string; target_user_id: string }, unknown>(
    "/api/company/team/members",
    "DELETE"
  );

  const revokeMutation = useApiMutation<{ invitation_id: string }, unknown>(
    "/api/company/invitations/revoke",
    "POST"
  );

  const fetchTeamData = useCallback(async () => {
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/company/team/members?employer_profile_id=${employerProfileId}`);
      const result = await res.json();
      if (!res.ok) {
        setFetchError(result.error || "Failed to load team data");
        return;
      }
      setMembers(result.data?.members ?? []);
      setInvitations(result.data?.invitations ?? []);
    } catch {
      setFetchError("Failed to load team data");
    } finally {
      setIsLoadingData(false);
    }
  }, [employerProfileId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const handleInviteSubmit = async () => {
    setInviteError(null);
    if (!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      setInviteError("Please enter a valid email address");
      return;
    }
    try {
      await inviteMutation.mutateAsync({ employer_profile_id: employerProfileId, email: inviteEmail.trim() });
      toast({ title: "Invitation sent", description: `Invite sent to ${inviteEmail.trim()}` });
      setInviteEmail("");
      setInviteOpen(false);
      await fetchTeamData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync({
        employer_profile_id: employerProfileId,
        target_user_id: removeTarget.user_id,
      });
      toast({ title: "Team member removed" });
      setRemoveTarget(null);
      await fetchTeamData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to remove member", variant: "destructive" });
      setRemoveTarget(null);
    }
  };

  const handleRevokeInvitation = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync({ invitation_id: revokeTarget.id });
      toast({ title: "Invitation revoked" });
      setRevokeTarget(null);
      await fetchTeamData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to revoke invitation", variant: "destructive" });
      setRevokeTarget(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Team Management
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => { setInviteEmail(""); setInviteError(null); setInviteOpen(true); }}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : fetchError ? (
            <AlertMessage variant="error" message={fetchError} />
          ) : (
            <>
              <div className="space-y-3">
                <SectionHeader title="Active Members" description={`${members.length} member${members.length !== 1 ? "s" : ""}`} />
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No team members yet. Invite someone to get started.</p>
                ) : (
                  <div className="divide-y divide-border rounded-lg border">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between px-4 py-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {member.role === "owner" ? (
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {member.profiles?.email ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Joined {formatDate(member.created_at, "short")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={member.role === "owner" ? "default" : "secondary"} className="text-xs">
                            {member.role === "owner" ? "Owner" : "Member"}
                          </Badge>
                          {member.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setRemoveTarget(member)}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {invitations.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <SectionHeader
                      title="Pending Invitations"
                      description={`${invitations.length} pending`}
                    />
                    <div className="divide-y divide-border rounded-lg border">
                      {invitations.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between px-4 py-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires {formatDate(inv.expires_at, "short")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setRevokeTarget(inv)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!inviteMutation.isLoading) setInviteOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you want to invite. They will receive an invitation link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {inviteError && <AlertMessage variant="error" message={inviteError} />}
            <FormField label="Email Address" htmlFor="invite-email" error={undefined} required>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleInviteSubmit()}
                disabled={inviteMutation.isLoading}
              />
            </FormField>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={inviteMutation.isLoading}
            >
              Cancel
            </Button>
            <LoadingButton
              loading={inviteMutation.isLoading}
              loadingText="Sending..."
              onClick={handleInviteSubmit}
            >
              Send Invitation
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        description={`Remove ${removeTarget?.profiles?.email ?? "this member"} from your team? They will lose access to the team profile immediately.`}
        confirmText="Remove Member"
        variant="destructive"
        loading={removeMutation.isLoading}
      />

      <ConfirmationDialog
        open={!!revokeTarget}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}
        onConfirm={handleRevokeInvitation}
        title="Revoke Invitation"
        description={`Revoke the invitation sent to ${revokeTarget?.email ?? "this email"}? The invitation link will no longer work.`}
        confirmText="Revoke Invitation"
        variant="destructive"
        loading={revokeMutation.isLoading}
      />
    </>
  );
}
