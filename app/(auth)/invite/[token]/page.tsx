"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, LoadingButton, AlertMessage, IconBox, PasswordInput } from "@/components/shared";
import { UserPlus, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

interface Props {
  params: Promise<{ token: string }>;
}

const acceptInviteSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;

export default function InvitePage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
  });

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const response = await fetch(`/api/invitations/validate?token=${token}`);
        const result = await response.json();

        if (!response.ok) {
          setValidationError(result.error || "Invalid invitation");
          return;
        }

        setInviteData(result.data);
      } catch {
        setValidationError("Failed to validate invitation");
      } finally {
        setIsValidating(false);
      }
    };

    validateInvite();
  }, [token]);

  const onSubmit = async (data: AcceptInviteFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to accept invitation");
        return;
      }

      router.push("/login?invited=true");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardContent className="pt-10 pb-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Validating invitation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (validationError) {
    return (
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <IconBox icon={XCircle} size="xl" variant="muted" shape="circle" className="mx-auto mb-4 bg-destructive/10 [&_svg]:text-destructive" />
          <CardTitle className="text-2xl font-bold tracking-tight">Invalid Invitation</CardTitle>
          <CardDescription className="text-base">
            {validationError}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
            <p>
              This invitation may have expired or already been used. Please contact the person who
              invited you to request a new invitation.
            </p>
          </div>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full">
              Go to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-0">
      <CardHeader className="space-y-1 text-center">
        <IconBox icon={UserPlus} size="xl" variant="highlight" shape="circle" className="mx-auto mb-4" />
        <CardTitle className="text-2xl font-bold tracking-tight">Accept Invitation</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join {APP_NAME}
          {inviteData?.role === "admin" && " as an administrator"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <AlertMessage variant="error" message={error} />}

          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{inviteData?.email}</span>
            </p>
          </div>

          <FormField label="Password" htmlFor="password" error={errors.password?.message} required>
            <PasswordInput
              id="password"
              placeholder="Create a password"
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
              placeholder="Confirm your password"
              {...register("confirmPassword")}
            />
          </FormField>

          <LoadingButton
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            loading={isLoading}
            loadingText="Creating account..."
          >
            Accept & Create Account
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
