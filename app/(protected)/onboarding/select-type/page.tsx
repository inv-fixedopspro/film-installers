"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconBox, FeatureListItem } from "@/components/shared";
import { APP_NAME } from "@/lib/constants";
import { Wrench, Building2, Users, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SelectTypePage() {
  const router = useRouter();

  return (
    <div className="w-full max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to {APP_NAME}</h1>
        <p className="text-muted-foreground">Let&apos;s set up your profile. Which best describes you?</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <button
          onClick={() => router.push("/onboarding/installer")}
          className="text-left"
        >
          <Card className={cn(
            "h-full shadow-lg border-2 border-transparent transition-all cursor-pointer",
            "hover:border-primary hover:shadow-xl"
          )}>
            <CardHeader>
              <IconBox icon={Wrench} size="lg" variant="primary" className="mb-4" />
              <CardTitle className="text-xl">I&apos;m an Installer</CardTitle>
              <CardDescription className="text-base">
                I install window tint, PPF, vinyl wrap, or architectural glass
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <FeatureListItem>
                  Find employers actively hiring in your area
                </FeatureListItem>
                <FeatureListItem>
                  Showcase your experience and build a resume
                </FeatureListItem>
                <FeatureListItem>
                  Connect with companies that match your skills
                </FeatureListItem>
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => router.push("/onboarding/employer")}
          className="text-left"
        >
          <Card className={cn(
            "h-full shadow-lg border-2 border-transparent transition-all cursor-pointer",
            "hover:border-primary hover:shadow-xl"
          )}>
            <CardHeader>
              <IconBox icon={Building2} size="lg" variant="secondary" className="mb-4" />
              <CardTitle className="text-xl">I&apos;m an Employer</CardTitle>
              <CardDescription className="text-base">
                I own or manage a business that needs skilled film installers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <FeatureListItem>
                  Find qualified installers in your area
                </FeatureListItem>
                <FeatureListItem>
                  Post job opportunities and connect directly
                </FeatureListItem>
                <FeatureListItem>
                  Build and manage your company team
                </FeatureListItem>
              </div>
            </CardContent>
          </Card>
        </button>

        <div className="text-left">
          <Card className="h-full shadow-lg border-2 border-border">
            <CardHeader>
              <IconBox icon={Users} size="lg" variant="muted" className="mb-4" />
              <CardTitle className="text-xl">Join a Team</CardTitle>
              <CardDescription className="text-base">
                I have an invitation to join a company already on {APP_NAME}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/60" />
                  <p>
                    Team access is invitation-only. Ask your employer to send you an invite link from their company dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        You can add additional profile types later from your dashboard.
      </p>
    </div>
  );
}
