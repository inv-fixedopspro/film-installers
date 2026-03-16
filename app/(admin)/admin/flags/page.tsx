"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared";
import { Flag, ChevronLeft, ChevronRight, MoveHorizontal as MoreHorizontal, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Shield, Ban, Eye, RefreshCw, Loader as Loader2 } from "lucide-react";
import type { FlagReviewStatus, FlagReviewPriority, FlagCategory, FlagContentType, ModerationActionType } from "@/lib/types/database";

interface FlaggedUser {
  id: string;
  email: string;
  account_status: string;
}

interface ContentFlagData {
  id: string;
  content_type: FlagContentType;
  flag_category: FlagCategory;
  flag_reason_detail: string | null;
  content_snapshot: Record<string, unknown> | null;
  content_url: string | null;
  is_duplicate: boolean;
  created_at: string;
  flagger_user_id: string;
  flagged_user_id: string;
}

interface FlagReviewRow {
  id: string;
  status: FlagReviewStatus;
  priority: FlagReviewPriority;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  content_flags: ContentFlagData | null;
  flagger: FlaggedUser | null;
  flagged_user: FlaggedUser | null;
}

interface FlagQueueResponse {
  reviews: FlagReviewRow[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const PRIORITY_CONFIG: Record<FlagReviewPriority, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "outline" },
  normal: { label: "Normal", variant: "secondary" },
  high: { label: "High", variant: "default" },
  critical: { label: "Critical", variant: "destructive" },
};

const CATEGORY_LABELS: Record<FlagCategory, string> = {
  spam: "Spam",
  fake_profile: "Fake Profile",
  inappropriate_content: "Inappropriate Content",
  harassment: "Harassment",
  misleading_information: "Misleading Info",
  other: "Other",
};

const CONTENT_TYPE_LABELS: Record<FlagContentType, string> = {
  installer_profile: "Installer Profile",
  employer_profile: "Employer Profile",
  user_account: "User Account",
  resume: "Resume",
};

const STATUS_TABS: { value: FlagReviewStatus | "all"; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under Review" },
  { value: "resolved_actioned", label: "Actioned" },
  { value: "resolved_dismissed", label: "Dismissed" },
  { value: "resolved_duplicate", label: "Duplicate" },
];

export default function AdminFlagsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<FlagReviewStatus>((searchParams.get("status") as FlagReviewStatus) || "pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FlagQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/flags?status=${status}&page=${page}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleReview = async (
    reviewId: string,
    newStatus: FlagReviewStatus,
    actionType?: ModerationActionType,
    reason?: string
  ) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch(`/api/admin/flags/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          action_type: actionType ?? null,
          reason: reason ?? null,
        }),
      });
      const json = await res.json();
      if (json.success) fetchFlags();
    } finally {
      setActionLoading(null);
    }
  };

  const isResolved = (s: FlagReviewStatus) =>
    s.startsWith("resolved_");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flag Review Queue"
        description="Review and act on content flags submitted by users"
      />

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={status === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatus(tab.value as FlagReviewStatus); setPage(1); }}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={fetchFlags}
        >
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="p-3 rounded-full bg-muted">
              <Flag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No flags to review</p>
            <p className="text-sm text-muted-foreground">
              The {status.replace("_", " ")} queue is empty.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((review) => {
            const flag = review.content_flags;
            const priorityCfg = PRIORITY_CONFIG[review.priority];
            const isActioning = actionLoading === review.id;
            const resolved = isResolved(review.status);

            return (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={priorityCfg.variant}>{priorityCfg.label} Priority</Badge>
                        {flag && (
                          <>
                            <Badge variant="outline">{CONTENT_TYPE_LABELS[flag.content_type]}</Badge>
                            <Badge variant="secondary">{CATEGORY_LABELS[flag.flag_category]}</Badge>
                          </>
                        )}
                        {flag?.is_duplicate && (
                          <Badge variant="outline" className="text-muted-foreground">Duplicate</Badge>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 flex-shrink-0">Flagged user</span>
                          <button
                            className="font-medium truncate hover:underline text-left"
                            onClick={() => router.push(`/admin/users/${review.flagged_user?.id}`)}
                          >
                            {review.flagged_user?.email ?? "Unknown"}
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 flex-shrink-0">Reported by</span>
                          <span className="truncate">{review.flagger?.email ?? "Unknown"}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 flex-shrink-0">Submitted</span>
                          <span>{flag ? new Date(flag.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</span>
                        </div>
                        {review.reviewed_at && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-20 flex-shrink-0">Reviewed</span>
                            <span>{new Date(review.reviewed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          </div>
                        )}
                      </div>

                      {flag?.flag_reason_detail && (
                        <div className="text-sm p-3 rounded-md bg-muted">
                          <span className="text-muted-foreground">Reason: </span>
                          <span>{flag.flag_reason_detail}</span>
                        </div>
                      )}

                      {flag?.content_snapshot && Object.keys(flag.content_snapshot).length > 0 && (
                        <div className="text-sm p-3 rounded-md bg-muted border">
                          <p className="text-muted-foreground font-medium mb-1.5">Content snapshot</p>
                          <div className="space-y-1">
                            {Object.entries(flag.content_snapshot).slice(0, 5).map(([k, v]) => (
                              <div key={k} className="flex gap-2">
                                <span className="text-muted-foreground capitalize min-w-[100px]">
                                  {k.replace(/_/g, " ")}
                                </span>
                                <span className="truncate">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {review.reviewer_notes && (
                        <div className="text-sm p-3 rounded-md bg-muted">
                          <span className="text-muted-foreground">Admin notes: </span>
                          <span>{review.reviewer_notes}</span>
                        </div>
                      )}
                    </div>

                    {!resolved && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isActioning}
                          onClick={() => handleReview(review.id, "resolved_dismissed", "flag_dismissed")}
                        >
                          {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                          Dismiss
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" disabled={isActioning}>
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Uphold
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => handleReview(review.id, "resolved_actioned", "flag_upheld", "Flag upheld - no further action")}
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Uphold — No action
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleReview(review.id, "resolved_actioned", "warning", "Formal warning issued via flag review")}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Warn user
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReview(review.id, "resolved_actioned", "hide", "Content hidden via flag review")}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Hide content
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReview(review.id, "resolved_actioned", "restrict", "Account restricted via flag review")}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Restrict account
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleReview(review.id, "resolved_actioned", "ban", "Account banned via flag review")}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Ban account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleReview(review.id, "resolved_duplicate", "flag_dismissed", "Marked as duplicate")}
                            >
                              <MoreHorizontal className="w-4 h-4 mr-2" />
                              Mark duplicate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/admin/users/${review.flagged_user?.id}`)}
                        >
                          View user
                        </Button>
                      </div>
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
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.page_size + 1}–{Math.min(data.page * data.page_size, data.total)} of {data.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
