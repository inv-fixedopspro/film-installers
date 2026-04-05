"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FormField, LoadingButton, SectionHeader } from "@/components/shared";
import { TemplateSelector } from "./template-selector";
import { SkillsInput } from "./skills-input";
import { WorkHistoryFields } from "./work-history-fields";
import { CertificationFields } from "./certification-fields";
import { EducationFields } from "./education-fields";
import { ResumePreview } from "./resume-preview";
import { resumeSchema, type ResumeFormData } from "@/lib/validations/resume";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type { InstallerResume } from "@/lib/types/database";
import type { InstallerContactInfo } from "@/app/(protected)/dashboard/resume/page";

const EXPERIENCE_LEVEL_LABELS: Record<string, string> = {
  new_to_industry: "New to Industry",
  experienced: "Experienced Professional",
};

interface ResumeFormProps {
  installerProfileId: string;
  installerName: string;
  existingResume: InstallerResume | null;
  contactInfo: InstallerContactInfo;
}

export function ResumeForm({ installerProfileId, installerName, existingResume, contactInfo }: ResumeFormProps) {
  const [previewData, setPreviewData] = useState<ResumeFormData | null>(null);

  const defaultValues: ResumeFormData = existingResume
    ? {
        installer_profile_id: existingResume.installer_profile_id,
        selected_template: existingResume.selected_template,
        accent_color: existingResume.accent_color,
        show_photo: existingResume.show_photo ?? true,
        headline: existingResume.headline,
        summary: existingResume.summary,
        skills: existingResume.skills,
        work_history: (existingResume.work_history as ResumeFormData["work_history"]) ?? [],
        certifications: (existingResume.certifications as ResumeFormData["certifications"]) ?? [],
        education: (existingResume.education as ResumeFormData["education"]) ?? [],
      }
    : {
        installer_profile_id: installerProfileId,
        selected_template: "standard",
        accent_color: "navy",
        show_photo: true,
        headline: "",
        summary: "",
        skills: [],
        work_history: [],
        certifications: [],
        education: [],
      };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResumeFormData>({
    resolver: zodResolver(resumeSchema),
    defaultValues,
  });

  const watchedTemplate = watch("selected_template");
  const watchedAccentColor = watch("accent_color");
  const watchedShowPhoto = watch("show_photo");

  const { mutate: saveResume, isLoading: isSaving } = useApiMutation<
    ResumeFormData & { id?: string },
    { resume: InstallerResume }
  >("/api/resume", "PUT");

  useEffect(() => {
    const subscription = watch((values) => {
      const timeout = setTimeout(() => {
        setPreviewData(values as ResumeFormData);
      }, 400);
      return () => clearTimeout(timeout);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    setPreviewData(defaultValues);
  }, []);

  const onSubmit = useCallback(
    (data: ResumeFormData) => {
      saveResume(
        { ...data, ...(existingResume?.id ? { id: existingResume.id } : {}) },
        {
          onSuccess: () => {
            toast.success("Resume saved successfully");
          },
          onError: (error) => {
            toast.error(error || "Failed to save resume");
          },
        }
      );
    },
    [saveResume, existingResume]
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-2">
                <div>
                  <h2 className="text-lg font-semibold">Resume Builder</h2>
                  <p className="text-sm text-muted-foreground">
                    {existingResume ? "Update your resume below" : "Build your professional resume"}
                  </p>
                </div>
                <LoadingButton
                  type="submit"
                  size="sm"
                  loading={isSaving}
                  loadingText="Saving…"
                  className="gap-1.5 bg-gradient-primary hover:opacity-90"
                >
                  <Save className="h-4 w-4" />
                  Save Resume
                </LoadingButton>
              </div>

              <Accordion type="multiple" defaultValue={["appearance", "basics"]} className="space-y-2">
                <AccordionItem value="appearance" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Template &amp; Appearance
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 space-y-5">
                    <Controller
                      name="selected_template"
                      control={control}
                      render={({ field: templateField }) => (
                        <Controller
                          name="accent_color"
                          control={control}
                          render={({ field: colorField }) => (
                            <TemplateSelector
                              selectedTemplate={templateField.value}
                              accentColor={colorField.value}
                              onTemplateChange={templateField.onChange}
                              onAccentColorChange={colorField.onChange}
                            />
                          )}
                        />
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Contact Info
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 space-y-4">
                    <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Contact info is pulled from your installer profile. To update it, edit your{" "}
                        <a href="/dashboard/installer" className="underline underline-offset-2 hover:text-foreground transition-colors">
                          installer profile
                        </a>
                        .
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <div className="text-sm px-3 py-2 rounded-md bg-muted/30 border border-border text-foreground">
                          {contactInfo.email || "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <div className="text-sm px-3 py-2 rounded-md bg-muted/30 border border-border text-foreground">
                          {contactInfo.phone || "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <div className="text-sm px-3 py-2 rounded-md bg-muted/30 border border-border text-foreground">
                          {contactInfo.city && contactInfo.state
                            ? `${contactInfo.city}, ${contactInfo.state}`
                            : "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Experience Level</Label>
                        <div className="text-sm px-3 py-2 rounded-md bg-muted/30 border border-border text-foreground">
                          {EXPERIENCE_LEVEL_LABELS[contactInfo.experience_level] ?? contactInfo.experience_level}
                        </div>
                      </div>
                    </div>

                    {contactInfo.hasPhoto && (
                      <Controller
                        name="show_photo"
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center justify-between py-3 px-4 rounded-md border border-border bg-muted/20">
                            <div>
                              <p className="text-sm font-medium">Show Profile Photo</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Display your profile photo in the resume header
                              </p>
                            </div>
                            <Switch
                              id="show_photo"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </div>
                        )}
                      />
                    )}

                    {!contactInfo.hasPhoto && (
                      <p className="text-xs text-muted-foreground">
                        No profile photo uploaded yet. Add one from your{" "}
                        <a href="/dashboard/installer" className="underline underline-offset-2 hover:text-foreground transition-colors">
                          installer profile
                        </a>{" "}
                        to enable the photo option.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="basics" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Headline &amp; Summary
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 space-y-4">
                    <FormField
                      label="Professional Headline"
                      htmlFor="headline"
                      error={errors.headline?.message}
                    >
                      <Input
                        id="headline"
                        placeholder="Lead PPF &amp; Vinyl Wrap Installer · 8 Years Experience"
                        {...register("headline")}
                      />
                    </FormField>

                    <FormField
                      label="Professional Summary"
                      htmlFor="summary"
                      error={errors.summary?.message}
                    >
                      <Textarea
                        id="summary"
                        placeholder="Write a short summary of your background, specialties, and what sets you apart…"
                        rows={4}
                        className="resize-none"
                        {...register("summary")}
                      />
                    </FormField>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="skills" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Skills
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <Controller
                      name="skills"
                      control={control}
                      render={({ field }) => (
                        <SkillsInput
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.skills?.message}
                        />
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="work_history" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Work History
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <WorkHistoryFields
                      control={control}
                      register={register}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="certifications" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Certifications
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <CertificationFields
                      control={control}
                      register={register}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="education" className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                    Education
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4">
                    <EducationFields
                      control={control}
                      register={register}
                      errors={errors}
                      watch={watch}
                      setValue={setValue}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end pt-2 lg:hidden">
                <LoadingButton
                  type="submit"
                  loading={isSaving}
                  loadingText="Saving…"
                  className="gap-1.5 bg-gradient-primary hover:opacity-90"
                >
                  <Save className="h-4 w-4" />
                  Save Resume
                </LoadingButton>
              </div>
            </form>
          </div>

          <div className="lg:w-[460px] lg:shrink-0">
            <div className="lg:sticky lg:top-6">
              <SectionHeader title="Live Preview" className="mb-3" />
              {previewData ? (
                <ResumePreview
                  data={previewData}
                  template={watchedTemplate}
                  accentColor={watchedAccentColor}
                  installerName={installerName}
                  contactInfo={contactInfo}
                />
              ) : (
                <div
                  className="bg-muted rounded-md border border-border"
                  style={{ aspectRatio: "816 / 1056" }}
                >
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">Preview loading…</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Updates as you type
              </p>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
