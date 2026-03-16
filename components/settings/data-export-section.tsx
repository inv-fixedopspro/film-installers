"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, Clock, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ExportRequest {
  id: string;
  status: "pending" | "processing" | "ready" | "expired" | "failed";
  requested_at: string;
  completed_at: string | null;
  download_expires_at: string | null;
}

const STATUS_CONFIG: Record<ExportRequest["status"], {
  label: string;
  icon: typeof Clock;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" },
  processing: { label: "Processing", icon: RefreshCw, variant: "secondary" },
  ready: { label: "Ready", icon: CheckCircle, variant: "default" },
  expired: { label: "Expired", icon: XCircle, variant: "outline" },
  failed: { label: "Failed", icon: XCircle, variant: "destructive" },
};

export function DataExportSection() {
  const [requests, setRequests] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/user/data-export");
      const json = await res.json();
      if (json.success) setRequests(json.data.requests);
    } catch {
      // silently fail on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleRequest() {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/user/data-export", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to submit request");
      } else {
        setSuccessMessage(json.data.message);
        await fetchRequests();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const latestActive = requests.find((r) => r.status === "pending" || r.status === "processing" || r.status === "ready");
  const hasActiveRequest = !!latestActive;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download My Data
        </CardTitle>
        <CardDescription>
          Request a copy of all your personal data stored on the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <p className="text-sm font-medium text-foreground">What is included in your export</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Account information (email, registration date)</li>
            <li>Installer or employer profile data</li>
            <li>Experience and credential records</li>
            <li>Consent history (accepted versions and timestamps)</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">
            Your data will be compiled into a JSON file. Download links are valid for 48 hours.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
            {successMessage}
          </div>
        )}

        {latestActive && (
          <div className="p-4 rounded-lg bg-muted border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Current Request</p>
              <StatusBadge status={latestActive.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Requested {new Date(latestActive.requested_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {latestActive.status === "ready" && latestActive.download_expires_at && (
              <p className="text-xs text-muted-foreground mt-1">
                Link expires {new Date(latestActive.download_expires_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
            {latestActive.status === "pending" || latestActive.status === "processing" ? (
              <p className="text-xs text-muted-foreground mt-2">
                Your export is being prepared. This typically takes a few minutes.
              </p>
            ) : null}
          </div>
        )}

        <Button
          onClick={handleRequest}
          disabled={submitting || hasActiveRequest}
          variant="outline"
          className="w-full"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : hasActiveRequest ? (
            <>
              <Clock className="h-4 w-4 mr-2" />
              Request Already Pending
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Request Data Export
            </>
          )}
        </Button>
        {hasActiveRequest && (
          <p className="text-xs text-center text-muted-foreground">
            You can submit a new request once your current one is complete or expires.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ExportRequest["status"] }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
