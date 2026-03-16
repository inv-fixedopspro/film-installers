"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employerProfileSchema, EmployerProfileFormData } from "@/lib/validations/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormSection,
  LoadingButton,
  StateSelector,
  PhoneInput,
  YesNoToggle,
  EmployeeCountSelect,
  ServiceCheckboxes,
  AlertMessage,
  IconBox,
  BackLink,
  FormPageContainer,
} from "@/components/shared";
import { Building2 } from "lucide-react";
import { useFormSubmit, useAuthState } from "@/hooks";

interface EmployerProfileFormProps {
  variant?: "dashboard" | "onboarding";
  backHref?: string;
  backLabel?: string;
  successRedirect?: string;
}

export function EmployerProfileForm({
  variant = "dashboard",
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
  successRedirect = "/dashboard/employer",
}: EmployerProfileFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuthState();

  const form = useForm<EmployerProfileFormData>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      is_actively_hiring: false,
      is_vendor: false,
      is_distributor: false,
      services: [],
    },
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  const { submitHandler, isSubmitting, submitError } = useFormSubmit<EmployerProfileFormData>(
    "/api/profiles/employer",
    form,
    {
      showSuccessToast: false,
      showErrorToast: false,
      onSuccess: async () => {
        await refreshUser();
        router.push(successRedirect);
      },
    }
  );

  const formContent = (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      {submitError && <AlertMessage variant="error" message={submitError} />}

      <FormSection title="Contact Information">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="First Name" htmlFor="contact_first_name" error={errors.contact_first_name?.message} required>
            <Input id="contact_first_name" placeholder="John" {...register("contact_first_name")} />
          </FormField>
          <FormField label="Last Name" htmlFor="contact_last_name" error={errors.contact_last_name?.message} required>
            <Input id="contact_last_name" placeholder="Doe" {...register("contact_last_name")} />
          </FormField>
        </div>

        <FormField label="Your Phone Number" htmlFor="contact_phone" error={errors.contact_phone?.message} required>
          <Controller
            name="contact_phone"
            control={control}
            render={({ field }) => (
              <PhoneInput value={field.value || ""} onChange={field.onChange} />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Company Information">
        <FormField label="Company Name" htmlFor="company_name" error={errors.company_name?.message} required>
          <Input id="company_name" placeholder="Acme Tint Co." {...register("company_name")} />
        </FormField>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="Company Email" htmlFor="company_email" error={errors.company_email?.message} required>
            <Input id="company_email" type="email" placeholder="info@company.com" {...register("company_email")} />
          </FormField>
          <FormField label="Company Phone" htmlFor="company_phone" error={errors.company_phone?.message} required>
            <Controller
              name="company_phone"
              control={control}
              render={({ field }) => (
                <PhoneInput value={field.value || ""} onChange={field.onChange} />
              )}
            />
          </FormField>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="HQ City" htmlFor="hq_city" error={errors.hq_city?.message} required>
            <Input id="hq_city" placeholder="Los Angeles" {...register("hq_city")} />
          </FormField>
          <FormField label="HQ State" htmlFor="hq_state" error={errors.hq_state?.message} required>
            <Controller
              name="hq_state"
              control={control}
              render={({ field }) => (
                <StateSelector value={field.value || ""} onValueChange={field.onChange} />
              )}
            />
          </FormField>
        </div>

        <FormField label="Number of Employees" htmlFor="employee_count" error={errors.employee_count?.message} required>
          <Controller
            name="employee_count"
            control={control}
            render={({ field }) => (
              <EmployeeCountSelect
                value={field.value || ""}
                onValueChange={field.onChange}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Company Status">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Are you actively hiring?</span>
            <Controller
              name="is_actively_hiring"
              control={control}
              render={({ field }) => (
                <YesNoToggle value={field.value} onValueChange={field.onChange} />
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium">Are you a vendor?</span>
              <p className="text-xs text-muted-foreground">Provides B2B services at client locations without a fixed storefront</p>
            </div>
            <Controller
              name="is_vendor"
              control={control}
              render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onValueChange={field.onChange} />
              )}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-medium">Are you a distributor or supplier?</span>
              <p className="text-xs text-muted-foreground">Primary business is selling or distributing film, supplies, or materials</p>
            </div>
            <Controller
              name="is_distributor"
              control={control}
              render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onValueChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Services Offered" description="Select all services your company offers">
        <Controller
          name="services"
          control={control}
          render={({ field }) => (
            <ServiceCheckboxes value={field.value || []} onValueChange={field.onChange} />
          )}
        />
        {errors.services && (
          <p className="text-sm text-destructive">{errors.services.message}</p>
        )}
      </FormSection>

      <LoadingButton
        type="submit"
        className="w-full bg-gradient-primary hover:opacity-90"
        loading={isSubmitting}
        loadingText="Creating profile..."
      >
        Create Profile
      </LoadingButton>
    </form>
  );

  if (variant === "onboarding") {
    return (
      <FormPageContainer
        icon={Building2}
        iconVariant="secondary"
        title="Create Employer Profile"
        description="Tell us about your company"
        backLink={backHref}
        maxWidth="2xl"
      >
        {formContent}
      </FormPageContainer>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader>
          <BackLink href={backHref} label={backLabel} className="mb-4" />
          <div className="flex items-center gap-4">
            <IconBox icon={Building2} size="lg" variant="secondary" />
            <div>
              <CardTitle className="text-2xl">Create Employer Profile</CardTitle>
              <CardDescription>Add an employer profile to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    </div>
  );
}
