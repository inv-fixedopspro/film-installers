"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { loginSchema, LoginFormData } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField, LoadingButton, AlertMessage, PasswordInput, AuthFormCard } from "@/components/shared";
import { APP_NAME } from "@/lib/constants";
import { useFormSubmit } from "@/hooks";

interface LoginResponse {
  message?: string;
  redirectTo: string;
  requiresVerification?: boolean;
  email?: string;
  user?: {
    id: string;
    email: string;
    role: string;
    onboardingCompleted: boolean;
    activeProfileType: string | null;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { submitHandler, isSubmitting, submitError } = useFormSubmit<LoginFormData, LoginResponse>(
    "/api/auth/login",
    form,
    {
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: (data) => {
        if (data.requiresVerification && data.email) {
          setVerificationEmail(data.email);
          setResendSuccess(false);
          setResendError(null);
        } else {
          router.push(data.redirectTo);
        }
      },
    }
  );

  const handleResendVerification = async () => {
    if (!verificationEmail || isResending) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        setResendSuccess(true);
      } else {
        setResendError(result.error || "Failed to send verification email");
      }
    } catch {
      setResendError("Failed to send verification email. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    setVerificationEmail(null);
    setResendSuccess(false);
    setResendError(null);
  };

  if (verificationEmail) {
    return (
      <AuthFormCard
        title="Email Verification Required"
        description="Your email address has not been verified yet"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to:
            </p>
            <p className="font-medium">{verificationEmail}</p>
            <p className="text-sm text-muted-foreground">
              Please check your inbox (and spam folder) and click the verification link to continue.
            </p>
          </div>

          {resendSuccess && (
            <AlertMessage
              variant="success"
              message="Verification email sent! Please check your inbox."
            />
          )}

          {resendError && (
            <AlertMessage variant="error" message={resendError} />
          )}

          <div className="space-y-3">
            <LoadingButton
              type="button"
              variant="outline"
              className="w-full"
              loading={isResending}
              loadingText="Sending..."
              onClick={handleResendVerification}
            >
              Resend Verification Email
            </LoadingButton>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      title="Welcome Back"
      description={`Sign in to your ${APP_NAME} account`}
    >
      <form onSubmit={form.handleSubmit(submitHandler)} className="space-y-4">
        {submitError && <AlertMessage variant="error" message={submitError} />}

        <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...form.register("email")}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={form.formState.errors.password?.message} required>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            {...form.register("password")}
          />
        </FormField>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/80 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton
          type="submit"
          className="w-full bg-gradient-primary hover:opacity-90"
          loading={isSubmitting}
          loadingText="Signing in..."
        >
          Sign In
        </LoadingButton>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/join" className="text-primary hover:text-primary/80 font-medium">
            Join the Network
          </Link>
        </p>
      </form>
    </AuthFormCard>
  );
}
