"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, TriangleAlert as AlertTriangle, X, RefreshCw, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DeletionRequest {
  id: string;
  status: "pending" | "cancelled" | "completed";
  requested_at: string;
  scheduled_delete_at: string;
  cancelled_at: string | null;
}

interface AccountDeletionSectionProps {
  onDeleteConfirmed: () => void;
}

export function AccountDeletionSection({ onDeleteConfirmed }: AccountDeletionSectionProps) {
  const [pendingRequest, setPendingRequest] = useState<DeletionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch("/api/user/deletion-request");
      const json = await res.json();
      if (json.success) setPendingRequest(json.data.request);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  async function handleConfirmDelete() {
    if (confirmText !== "DELETE") return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/deletion-request", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to submit deletion request");
      } else {
        setDialogOpen(false);
        setConfirmText("");
        await fetchRequest();
        onDeleteConfirmed();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelDeletion() {
    if (!pendingRequest) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch("/api/user/deletion-request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", requestId: pendingRequest.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to cancel deletion request");
      } else {
        setPendingRequest(null);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return null;

  if (pendingRequest) {
    const scheduledDate = new Date(pendingRequest.scheduled_delete_at);
    const daysRemaining = Math.max(0, Math.ceil((scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Account Deletion Scheduled
          </CardTitle>
          <CardDescription>
            Your account is scheduled for permanent deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-destructive/8 border border-destructive/20 space-y-2">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Deletion in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Scheduled for{" "}
                  {scheduledDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  . All your personal data will be permanently removed at that time.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleCancelDeletion}
            disabled={cancelling}
            className="w-full bg-gradient-primary hover:opacity-90"
          >
            {cancelling ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Deletion — Keep My Account
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You can cancel this request at any time before the scheduled deletion date.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete My Account
          </CardTitle>
          <CardDescription>
            Permanently remove your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
            <p className="text-sm font-medium text-foreground">What happens when you delete your account</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>A 30-day grace period begins — you can cancel at any time</li>
              <li>After 30 days, your profile, experience records, and personal data are permanently deleted</li>
              <li>You will be logged out immediately after confirming</li>
              <li>Certain records may be anonymized and retained for platform integrity</li>
            </ul>
          </div>

          <Button
            onClick={() => setDialogOpen(true)}
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setConfirmText("");
          setError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription>
              This will schedule your account for permanent deletion in 30 days.
              You will be logged out immediately. You can cancel within the grace period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20">
              <p className="text-sm text-destructive font-medium">
                This action cannot be undone after the 30-day grace period.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Type <strong className="text-foreground font-mono">DELETE</strong> to confirm
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setConfirmText("");
                  setError(null);
                }}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={confirmText !== "DELETE" || submitting}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
