"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { installerProfileSchema, InstallerProfileFormData } from "@/lib/validations/profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FormField,
  FormSection,
  LoadingButton,
  StateSelector,
  PhoneInput,
  YesNoToggle,
  ExperienceLevelSelector,
  YearsExperienceSelect,
  AlertMessage,
  IconBox,
  BackLink,
  FormPageContainer,
} from "@/components/shared";
import { SERVICE_TYPES } from "@/lib/constants";
import { Wrench } from "lucide-react";
import type { ServiceType, ExperienceYears } from "@/lib/types/database";
import { useAuthState } from "@/hooks";

interface ExperienceEntry {
  service_type: ServiceType;
  years_experience: ExperienceYears;
}

interface InstallerProfileFormProps {
  variant?: "dashboard" | "onboarding";
  backHref?: string;
  backLabel?: string;
  successRedirect?: string;
}

export function InstallerProfileForm({
  variant = "dashboard",
  backHref = "/dashboard",
  backLabel = "Back to Dashboard",
  successRedirect = "/dashboard/installer",
}: InstallerProfileFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<ServiceType>>(new Set());
  const [experienceYears, setExperienceYears] = useState<Record<ServiceType, ExperienceYears>>(
    {} as Record<ServiceType, ExperienceYears>
  );

  const form = useForm<InstallerProfileFormData>({
    resolver: zodResolver(installerProfileSchema),
    defaultValues: {
      is_actively_interviewing: false,
      experience_level: "new_to_industry",
    },
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = form;

  const experienceLevel = watch("experience_level");

  const toggleService = (serviceType: ServiceType) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceType)) {
      newSelected.delete(serviceType);
      const newYears = { ...experienceYears };
      delete newYears[serviceType];
      setExperienceYears(newYears);
    } else {
      newSelected.add(serviceType);
    }
    setSelectedServices(newSelected);
  };

  const onSubmit = async (data: InstallerProfileFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const experience: ExperienceEntry[] = [];

      if (data.experience_level === "experienced") {
        Array.from(selectedServices).forEach((serviceType) => {
          if (experienceYears[serviceType]) {
            experience.push({
              service_type: serviceType,
              years_experience: experienceYears[serviceType],
            });
          }
        });

        if (experience.length === 0) {
          setError("Please select at least one area of experience and specify years");
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch("/api/profiles/installer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          experience: data.experience_level === "experienced" ? experience : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create profile");
        return;
      }

      await refreshUser();
      router.push(successRedirect);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <AlertMessage variant="error" message={error} />}

      <FormSection title="Personal Information">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="First Name" htmlFor="first_name" error={errors.first_name?.message} required>
            <Input id="first_name" placeholder="John" {...register("first_name")} />
          </FormField>
          <FormField label="Last Name" htmlFor="last_name" error={errors.last_name?.message} required>
            <Input id="last_name" placeholder="Doe" {...register("last_name")} />
          </FormField>
        </div>

        <FormField label="Phone Number" htmlFor="phone" error={errors.phone?.message} required>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput value={field.value || ""} onChange={field.onChange} />
            )}
          />
        </FormField>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField label="City" htmlFor="city" error={errors.city?.message} required>
            <Input id="city" placeholder="Los Angeles" {...register("city")} />
          </FormField>
          <FormField label="State" htmlFor="state" error={errors.state?.message} required>
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <StateSelector value={field.value || ""} onValueChange={field.onChange} />
              )}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Availability">
        <FormField label="Are you actively interviewing?" error={errors.is_actively_interviewing?.message}>
          <Controller
            name="is_actively_interviewing"
            control={control}
            render={({ field }) => (
              <YesNoToggle value={field.value} onValueChange={field.onChange} />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Experience Level">
        <Controller
          name="experience_level"
          control={control}
          render={({ field }) => (
            <ExperienceLevelSelector value={field.value} onValueChange={field.onChange} />
          )}
        />
      </FormSection>

      {experienceLevel === "experienced" && (
        <FormSection
          title="Your Experience"
          description="Select your areas of expertise and years of experience"
          variant="highlighted"
        >
          <div className="space-y-4">
            {SERVICE_TYPES.map((service) => (
              <div key={service.value} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={service.value}
                      checked={selectedServices.has(service.value)}
                      onCheckedChange={() => toggleService(service.value)}
                    />
                    <Label htmlFor={service.value} className="font-normal cursor-pointer">
                      {service.label}
                    </Label>
                  </div>
                  {selectedServices.has(service.value) && (
                    <YearsExperienceSelect
                      value={experienceYears[service.value] || ""}
                      onValueChange={(value) =>
                        setExperienceYears({ ...experienceYears, [service.value]: value })
                      }
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {errors.experience && (
            <p className="text-sm text-destructive">{errors.experience.message}</p>
          )}
        </FormSection>
      )}

      <LoadingButton
        type="submit"
        className="w-full bg-gradient-primary hover:opacity-90"
        loading={isLoading}
        loadingText="Creating profile..."
      >
        Create Profile
      </LoadingButton>
    </form>
  );

  if (variant === "onboarding") {
    return (
      <FormPageContainer
        icon={Wrench}
        iconVariant="primary"
        title="Create Installer Profile"
        description="Tell us about yourself and your experience"
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
            <IconBox icon={Wrench} size="lg" variant="primary" />
            <div>
              <CardTitle className="text-2xl">Create Installer Profile</CardTitle>
              <CardDescription>Add an installer profile to your account</CardDescription>
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
