"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared";
import { Users, Search, ChevronLeft, ChevronRight, Loader as Loader2, ExternalLink, Flag, TriangleAlert as AlertTriangle } from "lucide-react";
import type { AccountStatus, ContentVisibility } from "@/lib/types/database";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  account_status: AccountStatus;
  content_visibility: ContentVisibility;
  unresolved_flag_count: number;
  auto_hidden_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  installer_profiles: { id: string; first_name: string; last_name: string }[] | null;
  employer_profiles: { id: string; company_name: string }[] | null;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const STATUS_BADGE: Record<AccountStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  warned: { label: "Warned", variant: "secondary" },
  pending_review: { label: "Pending Review", variant: "secondary" },
  restricted: { label: "Restricted", variant: "destructive" },
  banned: { label: "Banned", variant: "destructive" },
};

const VISIBILITY_BADGE: Record<ContentVisibility, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  visible: { label: "Visible", variant: "outline" },
  auto_hidden: { label: "Auto-Hidden", variant: "secondary" },
  admin_hidden: { label: "Admin-Hidden", variant: "destructive" },
  restored: { label: "Restored", variant: "default" },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="View and manage all registered users and their moderation status"
      />

      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-60">
          <Input
            placeholder="Search by email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <Select value={statusFilter || "all"} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="warned">Warned</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="restricted">Restricted</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3 rounded-full bg-muted">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No users found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {data.total} user{data.total !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </div>

          <div className="space-y-2">
            {data.users.map((user) => {
              const statusCfg = STATUS_BADGE[user.account_status];
              const visCfg = VISIBILITY_BADGE[user.content_visibility];
              const installerProfile = user.installer_profiles?.[0];
              const employerProfile = user.employer_profiles?.[0];

              const hasModerationIssue =
                user.account_status !== "active" ||
                user.content_visibility === "auto_hidden" ||
                user.content_visibility === "admin_hidden";

              return (
                <Card
                  key={user.id}
                  className={`cursor-pointer transition-colors hover:bg-accent/40 ${hasModerationIssue ? "border-warning/40" : ""}`}
                  onClick={() => router.push(`/admin/users/${user.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{user.email}</p>
                          {user.role === "admin" && (
                            <Badge variant="default" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                          {installerProfile && (
                            <span>{installerProfile.first_name} {installerProfile.last_name} (Installer)</span>
                          )}
                          {employerProfile && (
                            <span>{employerProfile.company_name} (Employer)</span>
                          )}
                          {!installerProfile && !employerProfile && (
                            <span className="italic">No profiles</span>
                          )}
                          <span>Joined {new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {user.unresolved_flag_count > 0 && (
                          <div className="flex items-center gap-1 text-sm text-warning">
                            <Flag className="w-3.5 h-3.5" />
                            <span>{user.unresolved_flag_count}</span>
                          </div>
                        )}
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                        {user.content_visibility !== "visible" && (
                          <Badge variant={visCfg.variant}>{visCfg.label}</Badge>
                        )}
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.page} of {data.total_pages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
