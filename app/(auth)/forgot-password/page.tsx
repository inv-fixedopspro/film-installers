"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { FormField, LoadingButton, AlertMessage, BackLink, AuthFormCard } from "@/components/shared";
import { Mail, CheckCircle } from "lucide-react";
import { useFormSubmit } from "@/hooks";

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { submitHandler, isSubmitting, submitError } = useFormSubmit<ForgotPasswordFormData>(
    "/api/auth/forgot-password",
    form,
    {
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: () => {
        setIsSuccess(true);
      },
    }
  );

  if (isSuccess) {
    return (
      <AuthFormCard
        title="Check Your Email"
        description="If an account exists with that email, we've sent password reset instructions."
        icon={CheckCircle}
        iconVariant="success"
      >
        <BackLink
          href="/login"
          label="Back to Sign In"
          className="flex justify-center text-primary hover:text-primary/80 font-medium"
        />
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      title="Forgot Password?"
      description="Enter your email and we'll send you a link to reset your password."
      icon={Mail}
      iconVariant="highlight"
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

        <LoadingButton
          type="submit"
          className="w-full bg-gradient-primary hover:opacity-90"
          loading={isSubmitting}
          loadingText="Sending..."
        >
          Send Reset Link
        </LoadingButton>

        <BackLink
          href="/login"
          label="Back to Sign In"
          className="flex justify-center text-sm text-primary hover:text-primary/80 font-medium"
        />
      </form>
    </AuthFormCard>
  );
}
