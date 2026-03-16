"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormSection,
  LoadingButton,
  AlertMessage,
  SectionHeader,
  ProfileInfoRow,
  BadgeList,
  StateSelector,
  PhoneInput,
  EmployeeCountSelect,
  ServiceCheckboxes,
  YesNoToggle,
} from "@/components/shared";
import { getStateName, getEmployeeCountLabel, getServiceLabel, formatPhoneDisplay } from "@/lib/formatters";
import { employerProfileSchema, type EmployerProfileFormData } from "@/lib/validations/profile";
import { useFormSubmit } from "@/hooks";
import { Building2, MapPin, Phone, Mail, Users, Briefcase, Globe, Pencil, X, Store, Truck } from "lucide-react";
import type { EmployerProfileWithServices } from "@/lib/types/database";

interface CompanyInfoSectionProps {
  profile: EmployerProfileWithServices;
  onRefresh: () => Promise<void>;
}

export function CompanyInfoSection({ profile, onRefresh }: CompanyInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<EmployerProfileFormData>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      contact_first_name: profile.contact_first_name,
      contact_last_name: profile.contact_last_name,
      contact_phone: profile.contact_phone,
      company_name: profile.company_name,
      company_email: profile.company_email,
      company_phone: profile.company_phone,
      hq_city: profile.hq_city,
      hq_state: profile.hq_state,
      employee_count: profile.employee_count,
      is_actively_hiring: profile.is_actively_hiring,
      is_vendor: profile.is_vendor,
      is_distributor: profile.is_distributor,
      services: profile.employer_services.map((s) => s.service_type),
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = form;

  const { submitHandler, isSubmitting, submitError } = useFormSubmit<EmployerProfileFormData>(
    "/api/profiles/employer",
    form,
    {
      method: "PUT",
      showSuccessToast: true,
      showErrorToast: false,
      successMessage: "Company profile updated",
      onSuccess: async () => {
        await onRefresh();
        setIsEditing(false);
      },
    }
  );

  const handleCancel = () => {
    reset({
      contact_first_name: profile.contact_first_name,
      contact_last_name: profile.contact_last_name,
      contact_phone: profile.contact_phone,
      company_name: profile.company_name,
      company_email: profile.company_email,
      company_phone: profile.company_phone,
      hq_city: profile.hq_city,
      hq_state: profile.hq_state,
      employee_count: profile.employee_count,
      is_actively_hiring: profile.is_actively_hiring,
      is_vendor: profile.is_vendor,
      is_distributor: profile.is_distributor,
      services: profile.employer_services.map((s) => s.service_type),
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Company Information
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

            <FormSection title="Contact Information">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="First Name" htmlFor="contact_first_name" error={errors.contact_first_name?.message} required>
                  <Input id="contact_first_name" {...register("contact_first_name")} />
                </FormField>
                <FormField label="Last Name" htmlFor="contact_last_name" error={errors.contact_last_name?.message} required>
                  <Input id="contact_last_name" {...register("contact_last_name")} />
                </FormField>
              </div>
              <FormField label="Your Phone" htmlFor="contact_phone" error={errors.contact_phone?.message} required>
                <Controller name="contact_phone" control={control} render={({ field }) => (
                  <PhoneInput value={field.value || ""} onChange={field.onChange} />
                )} />
              </FormField>
            </FormSection>

            <FormSection title="Company Details">
              <FormField label="Company Name" htmlFor="company_name" error={errors.company_name?.message} required>
                <Input id="company_name" {...register("company_name")} />
              </FormField>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="Company Email" htmlFor="company_email" error={errors.company_email?.message} required>
                  <Input id="company_email" type="email" {...register("company_email")} />
                </FormField>
                <FormField label="Company Phone" htmlFor="company_phone" error={errors.company_phone?.message} required>
                  <Controller name="company_phone" control={control} render={({ field }) => (
                    <PhoneInput value={field.value || ""} onChange={field.onChange} />
                  )} />
                </FormField>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField label="HQ City" htmlFor="hq_city" error={errors.hq_city?.message} required>
                  <Input id="hq_city" {...register("hq_city")} />
                </FormField>
                <FormField label="HQ State" htmlFor="hq_state" error={errors.hq_state?.message} required>
                  <Controller name="hq_state" control={control} render={({ field }) => (
                    <StateSelector value={field.value || ""} onValueChange={field.onChange} />
                  )} />
                </FormField>
              </div>
              <FormField label="Number of Employees" htmlFor="employee_count" error={errors.employee_count?.message} required>
                <Controller name="employee_count" control={control} render={({ field }) => (
                  <EmployeeCountSelect value={field.value || ""} onValueChange={field.onChange} />
                )} />
              </FormField>
            </FormSection>

            <FormSection title="Company Status">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">Actively hiring?</span>
                  <Controller name="is_actively_hiring" control={control} render={({ field }) => (
                    <YesNoToggle value={field.value} onValueChange={field.onChange} />
                  )} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium">Are you a vendor?</span>
                    <p className="text-xs text-muted-foreground">Provides B2B services at client locations without a fixed storefront</p>
                  </div>
                  <Controller name="is_vendor" control={control} render={({ field }) => (
                    <YesNoToggle value={field.value ?? false} onValueChange={field.onChange} />
                  )} />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium">Are you a distributor or supplier?</span>
                    <p className="text-xs text-muted-foreground">Primary business is selling or distributing film, supplies, or materials</p>
                  </div>
                  <Controller name="is_distributor" control={control} render={({ field }) => (
                    <YesNoToggle value={field.value ?? false} onValueChange={field.onChange} />
                  )} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Services Offered" description="Select all services your company offers">
              <Controller name="services" control={control} render={({ field }) => (
                <ServiceCheckboxes value={field.value || []} onValueChange={field.onChange} />
              )} />
              {errors.services && <p className="text-sm text-destructive">{errors.services.message}</p>}
            </FormSection>

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
            <Building2 className="h-4 w-4" />
            Company Information
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <SectionHeader title="Company Details" />
            <ProfileInfoRow icon={Building2}>{profile.company_name}</ProfileInfoRow>
            <ProfileInfoRow icon={MapPin}>{profile.hq_city}, {getStateName(profile.hq_state)}</ProfileInfoRow>
            <ProfileInfoRow icon={Phone}>{formatPhoneDisplay(profile.company_phone)}</ProfileInfoRow>
            <ProfileInfoRow icon={Mail}>{profile.company_email}</ProfileInfoRow>
            <ProfileInfoRow icon={Users}>{getEmployeeCountLabel(profile.employee_count)}</ProfileInfoRow>
          </div>
          <div className="space-y-3">
            <SectionHeader title="Primary Contact" />
            <ProfileInfoRow icon={Users}>{profile.contact_first_name} {profile.contact_last_name}</ProfileInfoRow>
            <ProfileInfoRow icon={Phone}>{formatPhoneDisplay(profile.contact_phone)}</ProfileInfoRow>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <SectionHeader title="Services Offered" />
          <BadgeList
            items={profile.employer_services}
            getLabel={(s) => getServiceLabel(s.service_type)}
            variant="secondary"
            emptyText="No services listed"
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Hiring Status</span>
          </div>
          <Badge variant={profile.is_actively_hiring ? "default" : "secondary"} className={profile.is_actively_hiring ? "bg-success" : ""}>
            {profile.is_actively_hiring ? "Actively Hiring" : "Not Hiring"}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Store className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-medium">Vendor</span>
              <p className="text-xs text-muted-foreground">Provides B2B services at client locations</p>
            </div>
          </div>
          <Badge variant={profile.is_vendor ? "default" : "secondary"} className="ml-3 flex-shrink-0">
            {profile.is_vendor ? "Yes" : "No"}
          </Badge>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-medium">Distributor / Supplier</span>
              <p className="text-xs text-muted-foreground">Primary business is selling or distributing film and supplies</p>
            </div>
          </div>
          <Badge variant={profile.is_distributor ? "default" : "secondary"} className="ml-3 flex-shrink-0">
            {profile.is_distributor ? "Yes" : "No"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
