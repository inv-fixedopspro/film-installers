"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Database, Trash2, Download, TriangleAlert as AlertTriangle, RefreshCw, Loader as Loader2, ChevronLeft, ChevronRight, CircleCheck as CheckCircle, Clock, Circle as XCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared";

interface Metrics {
  pending_deletions: number;
  pending_exports: number;
  overdue_deletions: number;
  overdue_exports: number;
  completed_this_month: number;
}

interface DeletionRequest {
  id: string;
  user_id: string;
  requested_at: string;
  scheduled_delete_at: string;
  status: string;
  cancelled_at: string | null;
  completed_at: string | null;
  user: { id: string; email: string } | null;
  days_remaining: number;
}

interface ExportRequest {
  id: string;
  user_id: string;
  requested_at: string;
  status: string;
  completed_at: string | null;
  download_expires_at: string | null;
  user: { id: string; email: string } | null;
  age_hours: number;
}

interface ListResponse<T> {
  requests: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

type ActiveTab = "overview" | "deletions" | "exports";
type ActionType = "cancel_deletion" | "fulfill_export";

interface PendingAction {
  type: ActionType;
  requestId: string;
  userEmail: string;
}

export default function AdminDataRequestsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<ActiveTab>("overview");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [deletionsData, setDeletionsData] = useState<ListResponse<DeletionRequest> | null>(null);
  const [deletionsStatus, setDeletionsStatus] = useState("pending");
  const [deletionsPage, setDeletionsPage] = useState(1);
  const [deletionsLoading, setDeletionsLoading] = useState(false);

  const [exportsData, setExportsData] = useState<ListResponse<ExportRequest> | null>(null);
  const [exportsStatus, setExportsStatus] = useState("pending");
  const [exportsPage, setExportsPage] = useState(1);
  const [exportsLoading, setExportsLoading] = useState(false);

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch("/api/admin/data-requests?tab=overview");
      const json = await res.json();
      if (json.success) setMetrics(json.data.metrics);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchDeletions = useCallback(async () => {
    setDeletionsLoading(true);
    try {
      const res = await fetch(`/api/admin/data-requests?tab=deletions&status=${deletionsStatus}&page=${deletionsPage}`);
      const json = await res.json();
      if (json.success) setDeletionsData(json.data);
    } finally {
      setDeletionsLoading(false);
    }
  }, [deletionsStatus, deletionsPage]);

  const fetchExports = useCallback(async () => {
    setExportsLoading(true);
    try {
      const res = await fetch(`/api/admin/data-requests?tab=exports&status=${exportsStatus}&page=${exportsPage}`);
      const json = await res.json();
      if (json.success) setExportsData(json.data);
    } finally {
      setExportsLoading(false);
    }
  }, [exportsStatus, exportsPage]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { if (tab === "deletions") fetchDeletions(); }, [tab, fetchDeletions]);
  useEffect(() => { if (tab === "exports") fetchExports(); }, [tab, fetchExports]);

  async function handleAction() {
    if (!pendingAction || !actionReason.trim()) return;
    setActionSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/data-requests/${pendingAction.requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: pendingAction.type, reason: actionReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error ?? "Action failed");
        return;
      }
      setPendingAction(null);
      setActionReason("");
      fetchMetrics();
      if (pendingAction.type === "cancel_deletion") fetchDeletions();
      else fetchExports();
    } catch {
      setActionError("An unexpected error occurred");
    } finally {
      setActionSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Requests"
        description="Manage user data export and account deletion requests"
      />

      <div className="flex gap-2 flex-wrap">
        {(["overview", "deletions", "exports"] as ActiveTab[]).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            className="capitalize"
          >
            {t === "overview" && <Database className="w-4 h-4 mr-1.5" />}
            {t === "deletions" && <Trash2 className="w-4 h-4 mr-1.5" />}
            {t === "exports" && <Download className="w-4 h-4 mr-1.5" />}
            {t}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => { fetchMetrics(); if (tab === "deletions") fetchDeletions(); if (tab === "exports") fetchExports(); }}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {tab === "overview" && (
        <OverviewTab metrics={metrics} loading={metricsLoading} onNavigate={setTab} />
      )}

      {tab === "deletions" && (
        <DeletionsTab
          data={deletionsData}
          loading={deletionsLoading}
          status={deletionsStatus}
          page={deletionsPage}
          onStatusChange={(s) => { setDeletionsStatus(s); setDeletionsPage(1); }}
          onPageChange={setDeletionsPage}
          onNavigateUser={(id) => router.push(`/admin/users/${id}`)}
          onAction={(req) => setPendingAction({ type: "cancel_deletion", requestId: req.id, userEmail: req.user?.email ?? req.user_id })}
        />
      )}

      {tab === "exports" && (
        <ExportsTab
          data={exportsData}
          loading={exportsLoading}
          status={exportsStatus}
          page={exportsPage}
          onStatusChange={(s) => { setExportsStatus(s); setExportsPage(1); }}
          onPageChange={setExportsPage}
          onNavigateUser={(id) => router.push(`/admin/users/${id}`)}
          onAction={(req) => setPendingAction({ type: "fulfill_export", requestId: req.id, userEmail: req.user?.email ?? req.user_id })}
        />
      )}

      <Dialog
        open={!!pendingAction}
        onOpenChange={(open) => {
          if (!open) { setPendingAction(null); setActionReason(""); setActionError(null); }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction?.type === "cancel_deletion" ? (
                <><ShieldAlert className="w-5 h-5 text-warning" /> Cancel Deletion Request</>
              ) : (
                <><CheckCircle className="w-5 h-5 text-success" /> Fulfill Export Request</>
              )}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.type === "cancel_deletion"
                ? `This will cancel the scheduled deletion for ${pendingAction?.userEmail} and keep their account active.`
                : `This will mark the export as ready for ${pendingAction?.userEmail}. Provide a reason for the audit log.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Reason <span className="text-muted-foreground">(required, logged to audit trail)</span></p>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={pendingAction?.type === "cancel_deletion"
                  ? "e.g. User contacted support and requested cancellation"
                  : "e.g. Manual fulfillment — automated job failed"}
                rows={3}
              />
            </div>
            {actionError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {actionError}
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={actionSubmitting}
                onClick={() => { setPendingAction(null); setActionReason(""); setActionError(null); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!actionReason.trim() || actionSubmitting}
                onClick={handleAction}
              >
                {actionSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewTab({ metrics, loading, onNavigate }: {
  metrics: Metrics | null;
  loading: boolean;
  onNavigate: (tab: ActiveTab) => void;
}) {
  const cards = [
    {
      label: "Pending Deletions",
      value: metrics?.pending_deletions ?? 0,
      icon: Trash2,
      tab: "deletions" as ActiveTab,
      urgent: (metrics?.overdue_deletions ?? 0) > 0,
      subtext: metrics?.overdue_deletions ? `${metrics.overdue_deletions} overdue` : "All within grace period",
    },
    {
      label: "Pending Exports",
      value: metrics?.pending_exports ?? 0,
      icon: Download,
      tab: "exports" as ActiveTab,
      urgent: (metrics?.overdue_exports ?? 0) > 0,
      subtext: metrics?.overdue_exports ? `${metrics.overdue_exports} overdue (>72h)` : "All within SLA",
    },
    {
      label: "Completed This Month",
      value: metrics?.completed_this_month ?? 0,
      icon: CheckCircle,
      tab: null,
      urgent: false,
      subtext: "Deletion requests executed",
    },
  ];

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className={`${card.tab ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""} ${card.urgent ? "border-warning/40" : ""}`}
              onClick={card.tab ? () => onNavigate(card.tab!) : undefined}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.urgent ? "bg-warning/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${card.urgent ? "text-warning" : "text-muted-foreground"}`} />
                  </div>
                  {card.urgent && (
                    <Badge variant="destructive" className="text-xs">Needs Attention</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{card.label}</p>
                <p className={`text-xs mt-1 ${card.urgent ? "text-warning" : "text-muted-foreground"}`}>
                  {card.urgent && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {card.subtext}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Trash2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground/60" />
            <p><strong className="text-foreground">Account Deletions</strong> — Users have a 30-day grace period to cancel. Hard deletion of personal data is scheduled automatically after expiry. Overdue means the grace period has already passed.</p>
          </div>
          <div className="flex items-start gap-2">
            <Download className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground/60" />
            <p><strong className="text-foreground">Data Exports</strong> — Must be fulfilled within the legal deadline. Requests older than 72 hours without completion are flagged as overdue. Use &ldquo;Fulfill Export&rdquo; to manually mark and notify the user if automated processing has failed.</p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-foreground/60" />
            <p><strong className="text-foreground">All Admin Actions</strong> — Every action taken in this panel is logged to the moderation audit trail with the admin&apos;s ID and reason provided.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DeletionsTab({ data, loading, status, page, onStatusChange, onPageChange, onNavigateUser, onAction }: {
  data: ListResponse<DeletionRequest> | null;
  loading: boolean;
  status: string;
  page: number;
  onStatusChange: (s: string) => void;
  onPageChange: (p: number) => void;
  onNavigateUser: (id: string) => void;
  onAction: (req: DeletionRequest) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {["pending", "cancelled", "completed"].map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => onStatusChange(s)} className="capitalize">
            {s}
          </Button>
        ))}
        {data && <p className="text-sm text-muted-foreground ml-auto">{data.total} record{data.total !== 1 ? "s" : ""}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.requests.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="p-3 rounded-full bg-muted"><Trash2 className="w-6 h-6 text-muted-foreground" /></div>
          <p className="font-medium">No {status} deletion requests</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.requests.map((req) => {
            const isOverdue = req.days_remaining === 0 && req.status === "pending";
            return (
              <Card key={req.id} className={isOverdue ? "border-destructive/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="font-medium hover:underline text-sm"
                          onClick={() => req.user && onNavigateUser(req.user.id)}
                        >
                          {req.user?.email ?? req.user_id}
                        </button>
                        {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                        {req.status === "pending" && !isOverdue && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />{req.days_remaining}d remaining
                          </Badge>
                        )}
                        {req.status === "cancelled" && <Badge variant="outline" className="text-xs">Cancelled</Badge>}
                        {req.status === "completed" && <Badge variant="default" className="text-xs">Completed</Badge>}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Requested {new Date(req.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        <span>Scheduled {new Date(req.scheduled_delete_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        {req.cancelled_at && <span>Cancelled {new Date(req.cancelled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                        {req.completed_at && <span>Completed {new Date(req.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                      </div>
                    </div>
                    {req.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0 border-warning/30 text-warning hover:bg-warning/5 hover:border-warning/50"
                        onClick={() => onAction(req)}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Cancel Deletion
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {data.total_pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => onPageChange(page + 1)}>
              Next<ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportsTab({ data, loading, status, page, onStatusChange, onPageChange, onNavigateUser, onAction }: {
  data: ListResponse<ExportRequest> | null;
  loading: boolean;
  status: string;
  page: number;
  onStatusChange: (s: string) => void;
  onPageChange: (p: number) => void;
  onNavigateUser: (id: string) => void;
  onAction: (req: ExportRequest) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        {["pending", "processing", "ready", "expired", "failed"].map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => onStatusChange(s)} className="capitalize">
            {s}
          </Button>
        ))}
        {data && <p className="text-sm text-muted-foreground ml-auto">{data.total} record{data.total !== 1 ? "s" : ""}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.requests.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="p-3 rounded-full bg-muted"><Download className="w-6 h-6 text-muted-foreground" /></div>
          <p className="font-medium">No {status} export requests</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.requests.map((req) => {
            const isOverdue = req.age_hours >= 72 && (req.status === "pending" || req.status === "processing");
            return (
              <Card key={req.id} className={isOverdue ? "border-destructive/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="font-medium hover:underline text-sm"
                          onClick={() => req.user && onNavigateUser(req.user.id)}
                        >
                          {req.user?.email ?? req.user_id}
                        </button>
                        {isOverdue && <Badge variant="destructive" className="text-xs">Overdue ({req.age_hours}h)</Badge>}
                        {!isOverdue && req.status === "pending" && <Badge variant="secondary" className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{req.age_hours}h ago</Badge>}
                        {req.status === "processing" && <Badge variant="secondary" className="text-xs">Processing</Badge>}
                        {req.status === "ready" && <Badge variant="default" className="text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Ready</Badge>}
                        {req.status === "expired" && <Badge variant="outline" className="text-xs">Expired</Badge>}
                        {req.status === "failed" && <Badge variant="destructive" className="text-xs">Failed</Badge>}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                        <span>Requested {new Date(req.requested_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        {req.completed_at && <span>Completed {new Date(req.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                        {req.download_expires_at && <span>Expires {new Date(req.download_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                      </div>
                    </div>
                    {(req.status === "pending" || req.status === "processing") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={() => onAction(req)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                        Fulfill Export
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {data.total_pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => onPageChange(page + 1)}>
              Next<ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
