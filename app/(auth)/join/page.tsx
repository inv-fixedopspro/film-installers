"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "@/lib/validations/auth";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, LoadingButton, AlertMessage, PasswordInput, AuthFormCard } from "@/components/shared";
import { APP_NAME } from "@/lib/constants";
import { useFormSubmit } from "@/hooks";

export default function JoinPage() {
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ageConfirmed: false,
      termsAccepted: false,
    },
  });

  const { submitHandler, isSubmitting, submitError } = useFormSubmit<RegisterFormData>(
    "/api/auth/register",
    form,
    {
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: () => {
        const email = form.getValues("email");
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      },
    }
  );

  return (
    <AuthFormCard
      title="Join the Network"
      description={`Create your account to connect with the ${APP_NAME}`}
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
            placeholder="Create a password"
            showHint
            {...form.register("password")}
          />
        </FormField>

        <FormField
          label="Confirm Password"
          htmlFor="confirmPassword"
          error={form.formState.errors.confirmPassword?.message}
          required
        >
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your password"
            {...form.register("confirmPassword")}
          />
        </FormField>

        <div className="space-y-3 pt-1">
          <Controller
            name="ageConfirmed"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="ageConfirmed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <label
                    htmlFor="ageConfirmed"
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I am <strong className="text-foreground font-medium">18 years of age or older</strong>
                  </label>
                </div>
                {form.formState.errors.ageConfirmed && (
                  <p className="text-xs text-destructive pl-7">
                    {form.formState.errors.ageConfirmed.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="termsAccepted"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="termsAccepted"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-foreground underline underline-offset-4 hover:no-underline font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-foreground underline underline-offset-4 hover:no-underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {form.formState.errors.termsAccepted && (
                  <p className="text-xs text-destructive pl-7">
                    {form.formState.errors.termsAccepted.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        <LoadingButton
          type="submit"
          className="w-full bg-gradient-primary hover:opacity-90"
          loading={isSubmitting}
          loadingText="Creating account..."
        >
          Join Network
        </LoadingButton>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </AuthFormCard>
  );
}
