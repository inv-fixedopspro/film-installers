"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton, AlertMessage, IconBox, PageLoading } from "@/components/shared";
import { Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to resend verification email");
        return;
      }

      setResendSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="space-y-1 text-center">
        <IconBox icon={Mail} size="xl" variant="highlight" shape="circle" className="mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold tracking-tight">Check Your Email</CardTitle>
        <CardDescription className="text-base">
          We&apos;ve sent a verification link to{" "}
          <span className="font-medium text-foreground">{email || "your email"}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
          <p>
            Click the link in the email to verify your account. If you don&apos;t see it, check your
            spam folder.
          </p>
        </div>

        {error && <AlertMessage variant="error" message={error} />}

        {resendSuccess && (
          <AlertMessage
            variant="success"
            message="Verification email sent successfully!"
            showIcon
          />
        )}

        <div className="space-y-3">
          <LoadingButton
            onClick={handleResend}
            variant="outline"
            className="w-full"
            loading={isResending}
            loadingText="Sending..."
            disabled={!email}
          >
            Resend Verification Email
          </LoadingButton>

          <Link
            href="/login"
            className="block text-center text-sm text-primary hover:text-primary/80 font-medium"
          >
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
