"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useApiMutation } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  ProfileInfoRow,
  SectionHeader,
  BadgeList,
  ConfirmationDialog,
  ComingSoonCard,
} from "@/components/shared";
import { getStateName, getServiceLabel, getEmployeeCountLabel, formatDate } from "@/lib/formatters";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Crown,
  LogOut,
  ExternalLink,
  Briefcase,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function TeamDashboardPage() {
  const router = useRouter();
  const { userData, refreshUser } = useAuth();
  const teamProfile = userData?.teamProfile;

  const [leaveOpen, setLeaveOpen] = useState(false);

  const leaveMutation = useApiMutation<{ employer_profile_id: string }, unknown>(
    "/api/company/team/leave",
    "POST"
  );

  if (!teamProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No team profile found.</p>
      </div>
    );
  }

  const { teamMember, employerProfile } = teamProfile;
  const isOwner = teamMember.role === "owner";

  const handleLeave = async () => {
    try {
      await leaveMutation.mutateAsync({ employer_profile_id: employerProfile.id });
      await refreshUser();
      router.push("/dashboard");
    } catch (err) {
      setLeaveOpen(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Team Dashboard"
          description={`You are a member of ${employerProfile.company_name}`}
          badge={
            <Badge variant={isOwner ? "default" : "secondary"} className={isOwner ? "bg-amber-500 text-white border-amber-500" : ""}>
              {isOwner ? (
                <span className="flex items-center gap-1">
                  <Crown className="h-3 w-3" /> Owner
                </span>
              ) : "Member"}
            </Badge>
          }
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Company Overview
              </CardTitle>
              {isOwner && (
                <Link href="/dashboard/employer">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Manage Company
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <SectionHeader title="Company Details" />
                <ProfileInfoRow icon={Building2}>{employerProfile.company_name}</ProfileInfoRow>
                <ProfileInfoRow icon={MapPin}>
                  {employerProfile.hq_city}, {getStateName(employerProfile.hq_state)}
                </ProfileInfoRow>
                <ProfileInfoRow icon={Phone}>{employerProfile.company_phone}</ProfileInfoRow>
                <ProfileInfoRow icon={Mail}>{employerProfile.company_email}</ProfileInfoRow>
                <ProfileInfoRow icon={Users}>
                  {getEmployeeCountLabel(employerProfile.employee_count)}
                </ProfileInfoRow>
              </div>

              <div className="space-y-3">
                <SectionHeader title="Your Membership" />
                <ProfileInfoRow icon={Users}>
                  <span className="capitalize">{teamMember.role}</span>
                </ProfileInfoRow>
                <ProfileInfoRow icon={Calendar}>
                  Joined {formatDate(teamMember.joined_at, "short")}
                </ProfileInfoRow>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={employerProfile.is_actively_hiring ? "default" : "secondary"} className={employerProfile.is_actively_hiring ? "bg-success" : ""}>
                    {employerProfile.is_actively_hiring ? "Actively Hiring" : "Not Hiring"}
                  </Badge>
                  {employerProfile.is_vendor && (
                    <Badge variant="outline">Vendor</Badge>
                  )}
                </div>
              </div>
            </div>

            {employerProfile.employer_services && employerProfile.employer_services.length > 0 && (
              <div className="space-y-2 pt-1">
                <SectionHeader title="Services Offered" />
                <BadgeList
                  items={employerProfile.employer_services}
                  getLabel={(s) => getServiceLabel(s.service_type)}
                  variant="secondary"
                  emptyText="No services listed"
                />
              </div>
            )}

            {employerProfile.company_description && (
              <div className="space-y-2 pt-1">
                <SectionHeader title="About" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {employerProfile.company_description}
                </p>
              </div>
            )}

            {!isOwner && (
              <div className="pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Leave Team
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <ComingSoonCard
          description="More team features are on the way"
          features={[
            { title: "Team Chat", description: "Message your team" },
            { title: "Shared Jobs", description: "Collaborate on job postings" },
            { title: "Team Analytics", description: "View team activity" },
          ]}
        />
      </div>

      {!isOwner && (
        <ConfirmationDialog
          open={leaveOpen}
          onOpenChange={(open) => { if (!leaveMutation.isLoading) setLeaveOpen(open); }}
          onConfirm={handleLeave}
          title="Leave Team"
          description={`Are you sure you want to leave ${employerProfile.company_name}? You will lose access to the team profile and will need a new invitation to rejoin.`}
          confirmText="Leave Team"
          variant="destructive"
          loading={leaveMutation.isLoading}
        />
      )}
    </>
  );
}
