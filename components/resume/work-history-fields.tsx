"use client";

import { useFieldArray, Control, UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import { CirclePlus as PlusCircle, Trash2, ChevronDown, ChevronUp, Briefcase } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared";
import { StateSelector } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { ResumeFormData } from "@/lib/validations/resume";
import { generateId } from "@/lib/utils/string";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1949 }, (_, i) => String(currentYear - i));

interface WorkHistoryFieldsProps {
  control: Control<ResumeFormData>;
  register: UseFormRegister<ResumeFormData>;
  errors: FieldErrors<ResumeFormData>;
  watch: UseFormWatch<ResumeFormData>;
  setValue: UseFormSetValue<ResumeFormData>;
}

export function WorkHistoryFields({ control, register, errors, watch, setValue }: WorkHistoryFieldsProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "work_history" });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const workHistory = watch("work_history");

  const addEntry = () => {
    const newIndex = fields.length;
    append({
      id: generateId(),
      company_name: "",
      job_title: "",
      city: "",
      state: "",
      start_month: "January",
      start_year: String(currentYear),
      end_month: null,
      end_year: null,
      is_current: false,
      is_self_employed: false,
      description: "",
    });
    setExpandedIndex(newIndex);
  };

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No work history added yet</p>
        </div>
      )}

      {fields.map((field, index) => {
        const entry = workHistory?.[index];
        const entryErrors = errors.work_history?.[index];
        const isExpanded = expandedIndex === index;
        const label = entry?.company_name
          ? `${entry.job_title || "Position"} at ${entry.company_name}`
          : `Entry ${index + 1}`;

        return (
          <div key={field.id} className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleExpanded(index)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
            >
              <span className="text-sm font-medium truncate pr-4">{label}</span>
              <div className="flex items-center gap-2 shrink-0">
                {Object.keys(entryErrors || {}).length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-4 space-y-4 border-t border-border">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    label="Company / Business Name"
                    htmlFor={`wh-company-${index}`}
                    error={entryErrors?.company_name?.message}
                    required
                  >
                    <Input
                      id={`wh-company-${index}`}
                      placeholder="Acme Auto Tint"
                      {...register(`work_history.${index}.company_name`)}
                    />
                  </FormField>
                  <FormField
                    label="Job Title"
                    htmlFor={`wh-title-${index}`}
                    error={entryErrors?.job_title?.message}
                    required
                  >
                    <Input
                      id={`wh-title-${index}`}
                      placeholder="Lead Installer"
                      {...register(`work_history.${index}.job_title`)}
                    />
                  </FormField>
                </div>

                <div className="flex gap-6 items-center">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`wh-current-${index}`}
                      checked={entry?.is_current ?? false}
                      onCheckedChange={(checked) => {
                        setValue(`work_history.${index}.is_current`, !!checked);
                        if (checked) {
                          setValue(`work_history.${index}.end_month`, null);
                          setValue(`work_history.${index}.end_year`, null);
                        }
                      }}
                    />
                    <Label htmlFor={`wh-current-${index}`} className="text-sm font-normal cursor-pointer">
                      Currently working here
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`wh-self-${index}`}
                      checked={entry?.is_self_employed ?? false}
                      onCheckedChange={(checked) =>
                        setValue(`work_history.${index}.is_self_employed`, !!checked)
                      }
                    />
                    <Label htmlFor={`wh-self-${index}`} className="text-sm font-normal cursor-pointer">
                      Self-employed
                    </Label>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={entry?.start_month ?? "January"}
                        onValueChange={(v) => setValue(`work_history.${index}.start_month`, v as typeof MONTHS[number])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={entry?.start_year ?? String(currentYear)}
                        onValueChange={(v) => setValue(`work_history.${index}.start_year`, v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {entryErrors?.start_month && (
                      <p className="text-sm text-destructive">{entryErrors.start_month.message}</p>
                    )}
                    {entryErrors?.start_year && (
                      <p className="text-sm text-destructive">{entryErrors.start_year.message}</p>
                    )}
                  </div>

                  {!entry?.is_current && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        End Date <span className="text-destructive">*</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={entry?.end_month ?? ""}
                          onValueChange={(v) => setValue(`work_history.${index}.end_month`, v as typeof MONTHS[number])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={entry?.end_year ?? ""}
                          onValueChange={(v) => setValue(`work_history.${index}.end_year`, v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {(entryErrors?.end_month || entryErrors?.end_year) && (
                        <p className="text-sm text-destructive">
                          {entryErrors?.end_month?.message || entryErrors?.end_year?.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="City" htmlFor={`wh-city-${index}`} error={entryErrors?.city?.message} required>
                    <Input
                      id={`wh-city-${index}`}
                      placeholder="Los Angeles"
                      {...register(`work_history.${index}.city`)}
                    />
                  </FormField>
                  <FormField label="State" htmlFor={`wh-state-${index}`} error={entryErrors?.state?.message} required>
                    <StateSelector
                      value={entry?.state ?? ""}
                      onValueChange={(v) => setValue(`work_history.${index}.state`, v)}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Description"
                  htmlFor={`wh-desc-${index}`}
                  error={entryErrors?.description?.message}
                >
                  <Textarea
                    id={`wh-desc-${index}`}
                    placeholder="Describe your responsibilities, achievements, and the types of film work you performed…"
                    rows={3}
                    className="resize-none"
                    {...register(`work_history.${index}.description`)}
                  />
                </FormField>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      remove(index);
                      setExpandedIndex(null);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {fields.length < 20 && (
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="w-full">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Work History
        </Button>
      )}
    </div>
  );
}
