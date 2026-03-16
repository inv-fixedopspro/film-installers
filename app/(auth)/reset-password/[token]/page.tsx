"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/validations/auth";
import {
  FormField,
  LoadingButton,
  AlertMessage,
  PasswordInput,
  TokenStatusCard,
  AuthFormCard,
} from "@/components/shared";
import { KeyRound, RefreshCw } from "lucide-react";

type PageStatus = "validating" | "valid" | "invalid" | "expired" | "submitting" | "success";

interface Props {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>("validating");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch("/api/auth/validate-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token }),
        });

        const result = await response.json();

        if (!response.ok) {
          if (result.code === "TOKEN_EXPIRED") {
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
          return;
        }

        setStatus("valid");
      } catch {
        setStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setStatus("submitting");
    setSubmitError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          ...data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || "Failed to reset password");
        setStatus("valid");
        return;
      }

      setStatus("success");
    } catch {
      setSubmitError("An unexpected error occurred");
      setStatus("valid");
    }
  };

  if (status === "validating") {
    return <TokenStatusCard status="loading" message="Validating reset link..." />;
  }

  if (status === "invalid") {
    return (
      <TokenStatusCard
        status="error"
        title="Invalid Reset Link"
        message="This password reset link is invalid or has already been used."
        helpText={
          <p>Please request a new password reset link from the login page.</p>
        }
        buttonText="Request New Link"
        buttonHref="/forgot-password"
        buttonVariant="outline"
      />
    );
  }

  if (status === "expired") {
    return (
      <TokenStatusCard
        status="error"
        title="Link Expired"
        icon={RefreshCw}
        message="This password reset link has expired for security reasons."
        helpText={
          <p>Password reset links are valid for 1 hour. Please request a new link to reset your password.</p>
        }
        buttonText="Request New Link"
        buttonHref="/forgot-password"
        onButtonClick={() => router.push("/forgot-password")}
      />
    );
  }

  if (status === "success") {
    return (
      <TokenStatusCard
        status="success"
        title="Password Reset!"
        message="Your password has been successfully reset. You can now sign in with your new password."
        buttonText="Continue to Sign In"
        buttonHref="/login"
      />
    );
  }

  return (
    <AuthFormCard
      title="Reset Password"
      description="Enter your new password below."
      icon={KeyRound}
      iconVariant="highlight"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {submitError && <AlertMessage variant="error" message={submitError} />}

        <FormField label="New Password" htmlFor="password" error={errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="Enter new password"
            showHint
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm new password"
            {...register("confirmPassword")}
          />
        </FormField>

        <LoadingButton
          type="submit"
          className="w-full bg-gradient-primary hover:opacity-90"
          loading={status === "submitting"}
          loadingText="Resetting..."
        >
          Reset Password
        </LoadingButton>
      </form>
    </AuthFormCard>
  );
}
