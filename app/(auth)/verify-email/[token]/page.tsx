"use client";

import { use, useEffect, useState } from "react";
import { TokenStatusCard } from "@/components/shared";

interface Props {
  params: Promise<{ token: string }>;
}

export default function VerifyEmailTokenPage({ params }: Props) {
  const { token } = use(params);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(result.error || "Verification failed");
          return;
        }

        setStatus("success");
      } catch {
        setStatus("error");
        setErrorMessage("An unexpected error occurred");
      }
    };

    verifyEmail();
  }, [token]);

  if (status === "loading") {
    return <TokenStatusCard status="loading" message="Verifying your email..." />;
  }

  if (status === "error") {
    return (
      <TokenStatusCard
        status="error"
        title="Verification Failed"
        message={errorMessage || "Verification failed"}
        helpText={
          <p>
            The verification link may have expired or already been used. Please request a new
            verification email.
          </p>
        }
        buttonText="Back to Sign In"
        buttonHref="/login"
        buttonVariant="outline"
      />
    );
  }

  return (
    <TokenStatusCard
      status="success"
      title="Email Verified!"
      message="Your email has been successfully verified. You can now sign in to your account."
      buttonText="Continue to Sign In"
      buttonHref="/login"
    />
  );
}
