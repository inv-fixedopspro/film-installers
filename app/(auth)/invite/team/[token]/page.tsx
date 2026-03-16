"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  TokenStatusCard,
  AlertMessage,
  LoadingButton,
  PageLoading,
} from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, LogIn } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

interface InvitationData {
  invitation_id: string;
  email: string;
  expires_at: string;
  employer_profile: {
    id: string;
    company_name: string;
    company_slug: string | null;
    hq_city: string;
    hq_state: string;
    logo_storage_path: string | null;
  };
}

type PageState =
  | "validating"
  | "invalid"
  | "unauthenticated"
  | "wrong_email"
  | "already_on_team"
  | "confirm"
  | "accepting"
  | "success"
  | "error";

export default function TeamInvitePage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const { user, userData, loading: authLoading, refreshUser } = useAuth();

  const [pageState, setPageState] = useState<PageState>("validating");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [invalidReason, setInvalidReason] = useState<string>("");
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const validateToken = useCallback(async () => {
    setPageState("validating");
    try {
      const res = await fetch(`/api/invitations/team-validate?token=${encodeURIComponent(token)}`);
      const result = await res.json();

      if (!res.ok) {
        setInvalidReason(result.error || "This invitation link is invalid or has expired.");
        setPageState("invalid");
        return;
      }

      setInvitation(result.data);

      if (!user) {
        setPageState("unauthenticated");
        return;
      }

      const userEmail = userData?.email ?? user.email ?? "";

      if (userEmail.toLowerCase() !== result.data.email.toLowerCase()) {
        setPageState("wrong_email");
        return;
      }

      if (userData?.team_member_id) {
        setPageState("already_on_team");
        return;
      }

      setPageState("confirm");
    } catch {
      setInvalidReason("Failed to validate the invitation. Please try again.");
      setPageState("invalid");
    }
  }, [token, user, userData]);

  useEffect(() => {
    if (authLoading) return;
    validateToken();
  }, [authLoading, validateToken]);

  async function handleAccept() {
    setPageState("accepting");
    setAcceptError(null);
    try {
      const res = await fetch("/api/invitations/team-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await res.json();

      if (!res.ok) {
        setAcceptError(result.error || "Failed to accept the invitation.");
        setPageState("confirm");
        return;
      }

      await refreshUser();
      setPageState("success");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setAcceptError("An unexpected error occurred. Please try again.");
      setPageState("confirm");
    }
  }

  if (pageState === "validating") {
    return <PageLoading message="Validating invitation..." variant="content" />;
  }

  if (pageState === "invalid") {
    return (
      <TokenStatusCard
        status="error"
        title="Invitation Invalid"
        message={invalidReason}
        helpText="Ask the company owner to send a new invitation link."
        buttonText="Go to Sign In"
        buttonHref="/login"
        buttonVariant="outline"
      />
    );
  }

  if (pageState === "success") {
    return (
      <TokenStatusCard
        status="success"
        title="Welcome to the team!"
        message={`You've joined ${invitation?.employer_profile.company_name}. Redirecting to your dashboard...`}
        showButton={false}
      />
    );
  }

  if (!invitation) return null;

  const { employer_profile } = invitation;

  const companyCard = (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Building2 className="w-6 h-6 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{employer_profile.company_name}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          {employer_profile.hq_city}, {employer_profile.hq_state}
        </p>
      </div>
    </div>
  );

  if (pageState === "unauthenticated") {
    const redirectUrl = `/invite/team/${token}`;
    return (
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Team Invitation</CardTitle>
          <CardDescription className="text-base">
            You&apos;ve been invited to join a company on Film Installers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {companyCard}

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground mb-1">Invitation sent to</p>
            <p className="text-sm font-medium text-foreground">{invitation.email}</p>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            You need to be signed in with the invited email address to accept this invitation.
          </p>

          <div className="space-y-2">
            <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="block">
              <Button className="w-full" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Accept
              </Button>
            </Link>
            <Link href={`/join?redirect=${encodeURIComponent(redirectUrl)}`} className="block">
              <Button variant="outline" className="w-full" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "wrong_email") {
    return (
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Wrong Account</CardTitle>
          <CardDescription className="text-base">
            This invitation was sent to a different email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {companyCard}

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Invitation email:</p>
            <p className="text-sm text-muted-foreground font-mono">{invitation.email}</p>
            <p className="text-sm font-medium text-foreground mt-2">Signed in as:</p>
            <p className="text-sm text-muted-foreground font-mono">
              {userData?.email ?? user?.email}
            </p>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Sign in with the correct account to accept this invitation.
          </p>

          <div className="space-y-2">
            <Link href={`/login?redirect=${encodeURIComponent(`/invite/team/${token}`)}`} className="block">
              <Button variant="outline" className="w-full">
                Sign In with a Different Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "already_on_team") {
    return (
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Already on a Team</CardTitle>
          <CardDescription className="text-base">
            Your account is already linked to a company team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {companyCard}

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You can only be a member of one company team at a time. To accept this invitation you would need to leave your current team first.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/dashboard" className="block">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="text-center space-y-1">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">Join the Team</CardTitle>
        <CardDescription className="text-base">
          Confirm your invitation to join this company
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {companyCard}

        <div className="rounded-lg border border-border bg-card p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Accepting as</p>
          <p className="text-sm font-medium text-foreground">{userData?.email ?? user?.email}</p>
          <Badge variant="outline" className="mt-1 text-xs">Team Member</Badge>
        </div>

        {acceptError && <AlertMessage variant="error" message={acceptError} />}

        <div className="space-y-2">
          <LoadingButton
            className="w-full"
            size="lg"
            loading={pageState === "accepting"}
            loadingText="Joining team..."
            onClick={handleAccept}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Accept Invitation
          </LoadingButton>
          <Link href="/dashboard" className="block">
            <Button variant="ghost" className="w-full text-muted-foreground">
              Decline
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
