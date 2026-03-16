"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormSection,
  LoadingButton,
  AlertMessage,
  SectionHeader,
  ProfileInfoRow,
  StateSelector,
  PhoneInput,
  ExperienceLevelSelector,
  YearsExperienceSelect,
  YesNoToggle,
  FormSelect,
} from "@/components/shared";
import { getStateName, getServiceLabel, getYearsLabel, getExperienceLevelLabel, formatPhoneDisplay } from "@/lib/formatters";
import { installerProfileSchema, type InstallerProfileFormData } from "@/lib/validations/profile";
import { SERVICE_TYPES } from "@/lib/constants";
import { useFormSubmit } from "@/hooks";
import { Wrench, MapPin, Phone, Briefcase, Clock, Pencil, X, Plus, Trash2 } from "lucide-react";
import type { InstallerProfileWithExperience, ServiceType, ExperienceYears } from "@/lib/types/database";

interface InstallerInfoSectionProps {
  profile: InstallerProfileWithExperience;
  onRefresh: () => Promise<void>;
}

export function InstallerInfoSection({ profile, onRefresh }: InstallerInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  const defaultValues: InstallerProfileFormData = {
    first_name: profile.first_name,
    last_name: profile.last_name,
    phone: profile.phone,
    city: profile.city,
    state: profile.state,
    is_actively_interviewing: profile.is_actively_interviewing,
    experience_level: profile.experience_level,
    experience: profile.installer_experience.map((e) => ({
      service_type: e.service_type,
      years_experience: e.years_experience,
    })),
  };

  const form = useForm<InstallerProfileFormData>({
    resolver: zodResolver(installerProfileSchema),
    defaultValues,
  });

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = form;

  const experienceLevel = watch("experience_level");
  const experience = watch("experience") ?? [];

  const { submitHandler, isSubmitting, submitError } = useFormSubmit<InstallerProfileFormData>(
    "/api/profiles/installer",
    form,
    {
      method: "PUT",
      showSuccessToast: true,
      showErrorToast: false,
      successMessage: "Profile updated",
      onSuccess: async () => {
        await onRefresh();
        setIsEditing(false);
      },
    }
  );

  const handleCancel = () => {
    reset(defaultValues);
    setIsEditing(false);
  };

  const addExperience = () => {
    setValue("experience", [
      ...experience,
      { service_type: "automotive_tint" as ServiceType, years_experience: "less_than_1" as ExperienceYears },
    ]);
  };

  const removeExperience = (index: number) => {
    setValue("experience", experience.filter((_, i) => i !== index));
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-4 w-4" />
              Profile Information
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-1.5 text-muted-foreground">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
            {submitError && <AlertMessage variant="error" message={submitError} />}

            <FormSection title="Personal Details">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="First Name" htmlFor="first_name" error={errors.first_name?.message} required>
                  <Input id="first_name" {...register("first_name")} />
                </FormField>
                <FormField label="Last Name" htmlFor="last_name" error={errors.last_name?.message} required>
                  <Input id="last_name" {...register("last_name")} />
                </FormField>
              </div>
              <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} required>
                <Controller name="phone" control={control} render={({ field }) => (
                  <PhoneInput value={field.value || ""} onChange={field.onChange} />
                )} />
              </FormField>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="City" htmlFor="city" error={errors.city?.message} required>
                  <Input id="city" {...register("city")} />
                </FormField>
                <FormField label="State" htmlFor="state" error={errors.state?.message} required>
                  <Controller name="state" control={control} render={({ field }) => (
                    <StateSelector value={field.value || ""} onValueChange={field.onChange} />
                  )} />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="Job Status">
              <FormField label="Actively interviewing?" error={errors.is_actively_interviewing?.message}>
                <Controller name="is_actively_interviewing" control={control} render={({ field }) => (
                  <YesNoToggle value={field.value} onValueChange={field.onChange} />
                )} />
              </FormField>
            </FormSection>

            <FormSection title="Experience Level">
              <Controller name="experience_level" control={control} render={({ field }) => (
                <ExperienceLevelSelector value={field.value} onValueChange={field.onChange} />
              )} />
              {errors.experience_level && (
                <p className="text-sm text-destructive">{errors.experience_level.message}</p>
              )}
            </FormSection>

            {experienceLevel === "experienced" && (
              <FormSection title="Service Experience" description="Add each service and your years of experience">
                <div className="space-y-3">
                  {experience.map((exp, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex-1">
                        <Controller
                          name={`experience.${index}.service_type`}
                          control={control}
                          render={({ field }) => (
                            <FormSelect<ServiceType>
                              options={SERVICE_TYPES}
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              placeholder="Select service"
                            />
                          )}
                        />
                      </div>
                      <div className="flex-shrink-0">
                        <Controller
                          name={`experience.${index}.years_experience`}
                          control={control}
                          render={({ field }) => (
                            <YearsExperienceSelect value={field.value ?? ""} onValueChange={field.onChange} />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeExperience(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={addExperience}
                  >
                    <Plus className="h-4 w-4" />
                    Add Service
                  </Button>
                </div>
              </FormSection>
            )}

            <div className="flex gap-3 pt-2">
              <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving...">
                Save Changes
              </LoadingButton>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" />
            Profile Information
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <SectionHeader title="Personal Details" />
          <ProfileInfoRow icon={MapPin}>
            {profile.city}, {getStateName(profile.state)}
          </ProfileInfoRow>
          <ProfileInfoRow icon={Phone}>
            {formatPhoneDisplay(profile.phone)}
          </ProfileInfoRow>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Job Status</span>
          </div>
          <Badge
            variant={profile.is_actively_interviewing ? "default" : "secondary"}
            className={profile.is_actively_interviewing ? "bg-success" : ""}
          >
            {profile.is_actively_interviewing ? "Actively Interviewing" : "Not Looking"}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Experience Level</span>
          </div>
          <Badge variant="secondary">
            {getExperienceLevelLabel(profile.experience_level)}
          </Badge>
        </div>

        {profile.experience_level === "experienced" && profile.installer_experience.length > 0 && (
          <div className="space-y-2">
            <SectionHeader title="Service Experience" />
            <div className="grid sm:grid-cols-2 gap-2">
              {profile.installer_experience.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <span className="text-sm font-medium">{getServiceLabel(exp.service_type)}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs">{getYearsLabel(exp.years_experience)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
