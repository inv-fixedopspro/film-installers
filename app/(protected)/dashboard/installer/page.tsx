"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, IconBox, ComingSoonCard } from "@/components/shared";
import { InstallerInfoSection, InstallerPhotoSection } from "@/components/installer";
import { FileText, CirclePlus as PlusCircle, Pencil } from "lucide-react";

export default function InstallerDashboardPage() {
  const { userData, refreshUser } = useAuth();
  const profile = userData?.installerProfile;

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No installer profile found.</p>
      </div>
    );
  }

  const hasResume = !!profile.resume_id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={`${profile.first_name} ${profile.last_name}`}
        description="Manage your installer profile and opportunities"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <InstallerInfoSection profile={profile} onRefresh={refreshUser} />
        <InstallerPhotoSection
          installerProfileId={profile.id}
          photoStoragePath={profile.photo_storage_path ?? null}
          onRefresh={refreshUser}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <IconBox
              icon={FileText}
              size="md"
              variant={hasResume ? "highlight" : "muted"}
              shape="circle"
            />
            <div>
              <CardTitle>Resume</CardTitle>
              <CardDescription>
                {hasResume ? "Your resume is ready to share" : "No resume created yet"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasResume ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your resume is live and visible to employers based on your privacy settings.
              </p>
              <Button asChild size="sm" variant="outline" className="w-full gap-2">
                <Link href="/dashboard/resume">
                  <Pencil className="h-4 w-4" />
                  Edit Resume
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Create a professional resume to showcase your skills and experience to employers.
              </p>
              <Button
                asChild
                size="sm"
                className="w-full gap-2 bg-gradient-primary hover:opacity-90"
              >
                <Link href="/dashboard/resume">
                  <PlusCircle className="h-4 w-4" />
                  Build Your Resume
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ComingSoonCard
        description="More features are on the way to help you find your next opportunity"
        features={[
          { title: "Job Board", description: "Browse open positions" },
          { title: "Messages", description: "Connect with employers" },
          { title: "Profile Visibility", description: "Control who sees you" },
        ]}
      />
    </div>
  );
}
